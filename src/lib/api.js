const undici = require('undici')

const auth = require('./auth')
const settings = require('./settings')

async function ffGet (url, token) {
    const { body } = await undici.request(
        `${settings.get('forgeURL')}${url}`,
        {
            method: 'GET',
            headers: { authorization: `Bearer ${token}` }
        }
    )
    return await body.json()
}
async function ffPost (url, token, payload) {
    const { body } = await undici.request(
        `${settings.get('forgeURL')}${url}`,
        {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: {
                authorization: `Bearer ${token}`,
                'content-type': 'application/json'
            }
        }
    )
    return await body.json()
}
function setupRoutes (RED) {
    auth.setupRoutes(RED)

    RED.httpAdmin.get('/flowforge-nr-tools/settings', async (request, response) => {
        const body = settings.exportPublicSettings()

        const token = auth.getUserTokenForRequest(request)
        if (!token) {
            body.connected = false
        } else {
            const userProfile = await ffGet('/api/v1/user', token.access_token)
            if (userProfile.code === 'unauthorized') {
                auth.deleteUserTokenForRequest(request)
                body.connected = false
            } else {
                body.connected = true
                body.user = {
                    id: userProfile.id,
                    avatar: userProfile.avatar,
                    defaultTeam: userProfile.defaultTeam,
                    username: userProfile.username,
                    name: userProfile.name
                }
            }
        }
        response.send(body)
    })

    // ** All routes after this point must have a valid FF Token associated with the session **
    RED.httpAdmin.use('/flowforge-nr-tools/*', auth.needsFFToken)

    RED.httpAdmin.get('/flowforge-nr-tools/teams', async (request, response) => {
        const teams = await ffGet('/api/v1/user/teams', request.ffToken)
        response.send(teams)
    })

    RED.httpAdmin.get('/flowforge-nr-tools/teams/:teamId/projects', async (request, response) => {
        const projects = await ffGet(`/api/v1/teams/${request.params.teamId}/projects`, request.ffToken)
        response.send(projects)
    })

    RED.httpAdmin.get('/flowforge-nr-tools/projects/:projectId', async (request, response) => {
        const project = await ffGet(`/api/v1/projects/${request.params.projectId}`, request.ffToken)
        response.send(project)
    })

    RED.httpAdmin.get('/flowforge-nr-tools/projects/:projectId/snapshots', async (request, response) => {
        const project = await ffGet(`/api/v1/projects/${request.params.projectId}/snapshots`, request.ffToken)
        response.send(project)
    })

    RED.httpAdmin.post('/flowforge-nr-tools/projects/:projectId/snapshots', async (request, response) => {
        const flows = []
        const credentials = {}
        RED.nodes.eachNode(n => {
            flows.push({ ...n })
            const nodeCreds = RED.nodes.getCredentials(n.id)
            if (nodeCreds) {
                credentials[n.id] = nodeCreds
            }
        })
        const snapshot = {
            name: request.body.name,
            description: request.body.description,
            settings: {
                modules: request.body.settings.modules
            },
            flows,
            credentials
        }
        // console.log(snapshot)
        await ffPost(`/api/v1/projects/${request.params.projectId}/snapshots`, request.ffToken, snapshot)
        response.send({})
    })
}

module.exports = {
    setupRoutes
}
