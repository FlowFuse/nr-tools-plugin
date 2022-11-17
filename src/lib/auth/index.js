const crypto = require('node:crypto')
const base64url = require('base64url')
const store = require('./store')
const undici = require('undici')
const settings = require('../settings')

const authorizationURL = () => `${settings.get('forgeURL')}/account/authorize`
const tokenURL = () => `${settings.get('forgeURL')}/account/token`

const activeTokens = { }

function getUserForRequest (request) {
    let sessionUsername = '_'
    if (request.user) {
        // adminAuth is configured
        sessionUsername = request.user.username || '_'
    }
    return sessionUsername
}

function setUserToken (user, token) {
    activeTokens[user] = token
    const refreshInterval = token.expires_in - 10 // refresh with 10 secs to spare
    if (refreshInterval > 0) {
        token.refreshTimeout = setTimeout(async () => {
            const newTokens = await refreshToken(token)
            newTokens.expires_at = Date.now() + (newTokens.expires_in * 1000)
            setUserToken(user, newTokens)
        }, refreshInterval * 1000)
    }
}

function getUserTokenForRequest (request) {
    const token = activeTokens[getUserForRequest(request)]
    if (token && token.expires_at < Date.now()) {
        deleteUserTokenForRequest(request)
        return undefined
    }
    return token
}

function deleteUserTokenForRequest (request) {
    const token = activeTokens[getUserForRequest(request)]
    if (token) {
        clearTimeout(token.refreshTimeout)
    }
    delete activeTokens[getUserForRequest(request)]
}

function needsFFToken (request, response, next) {
    const token = getUserTokenForRequest(request)
    if (token) {
        request.ffToken = token.access_token
        next()
    } else {
        return response.status(401).end()
    }
}

async function refreshToken (token) {
    const params = {
        grant_type: 'refresh_token',
        client_id: 'ff-plugin',
        refresh_token: token.refresh_token
    }
    const {
        statusCode,
        body
    } = await undici.request(tokenURL(), { method: 'POST', body: JSON.stringify(params), headers: { 'content-type': 'application/json' } })
    if (statusCode === 200) {
        const tokens = await body.json()
        return tokens
    }
}

function setupRoutes (RED) {
    RED.httpAdmin.get('/flowforge-nr-tools/auth/authorize', (request, response) => {
        const existingRequest = store.getRequest(request.query.s)
        if (!existingRequest) {
            return response.send(404)
        }
        const verifier = base64url(crypto.randomBytes(32))
        const scope = 'ff-plugin'
        store.storeRequest({ ...existingRequest, verifier, scope })
        const params = {}
        params.client_id = 'ff-plugin'
        params.scope = scope
        params.response_type = 'code'
        params.state = existingRequest.state
        params.code_challenge = base64url(crypto.createHash('sha256').update(verifier).digest())
        params.code_challenge_method = 'S256'
        params.redirect_uri = existingRequest.redirect_uri
        const authURL = new URL(authorizationURL())
        authURL.search = new URLSearchParams(params)
        response.redirect(authURL.toString())
    })

    RED.httpAdmin.get('/flowforge-nr-tools/auth/callback', async (request, response) => {
        if (request.query.error) {
            const postMessage = JSON.stringify({ code: 'flowforge-auth-error', error: request.query.error, message: request.query.errorDescription })
            response.send(`
<html><head>
<script>
if (window.opener) {
    window.opener.postMessage('${postMessage}', '*')
    window.close()
}
</script>
</head><body>Failed to complete authentication.</body></html>            
`)
            return
        }
        if (!request.query.code || !request.query.state) {
            response.send('Failed to complete authentication')
            return
        }
        const originalRequest = store.getRequest(request.query.state)
        if (!originalRequest) {
            response.send('Failed to complete authentication - unknown state')
            return
        }

        const params = {}
        params.grant_type = 'authorization_code'
        params.code = request.query.code
        params.redirect_uri = originalRequest.redirect_uri
        params.client_id = 'ff-plugin'
        params.code_verifier = originalRequest.verifier
        const {
            statusCode,
            body
        } = await undici.request(tokenURL(), { method: 'POST', body: JSON.stringify(params), headers: { 'content-type': 'application/json' } })
        if (statusCode === 200) {
            const tokens = await body.json()
            setUserToken(originalRequest.user, tokens)
            const postMessage = JSON.stringify({ code: 'flowforge-auth-complete', state: originalRequest.state })
            response.send(`
<html><head>
<script>
if (window.opener) {
    window.opener.postMessage('${postMessage}', '*')
    window.close()
}
</script>
</head><body>Success! You're connected to FlowForge. You can now close this window to continue.</body></html>            
`)
        }
    })
    // ** All routes after this point must have a valid Node-RED session user **
    RED.httpAdmin.use('/flowforge-nr-tools/*', RED.auth.needsPermission('flowforge.write'))

    RED.httpAdmin.post('/flowforge-nr-tools/auth/start', async (request, response) => {
        // This request is made from the editor, so will have the Node-RED user attached.
        // Generate the login url for the auth pop-up window
        if (request.body.forgeURL) {
            settings.set('forgeURL', request.body.forgeURL)
        }
        const state = base64url(crypto.randomBytes(16))
        const redirect = request.body.editorURL + (request.body.editorURL.endsWith('/') ? '' : '/') + 'flowforge-nr-tools/auth/callback'
        store.storeRequest({
            user: getUserForRequest(request),
            state,
            redirect_uri: redirect
        })
        const authPath = 'flowforge-nr-tools/auth/authorize?s=' + state
        response.send({ path: authPath, state })
    })
    RED.httpAdmin.post('/flowforge-nr-tools/auth/disconnect', async (request, response) => {
        // This request is made from the editor, so will have the Node-RED user attached.
        deleteUserTokenForRequest(request)
        response.send({ })
    })
}

module.exports = {
    setupRoutes,
    getUserTokenForRequest,
    deleteUserTokenForRequest,
    needsFFToken
}
