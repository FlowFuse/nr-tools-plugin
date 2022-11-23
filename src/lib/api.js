const auth = require('./auth')
const settings = require('./settings')
const { ffGet, ffPost } = require('./client')

function setupRoutes (RED) {
    auth.setupRoutes(RED)

    RED.httpAdmin.get('/flowforge-nr-tools/settings', async (request, response) => {
        const body = settings.exportPublicSettings()

        const token = auth.getUserTokenForRequest(request)
        if (!token) {
            body.connected = false
        } else {
            try {
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
            } catch (err) {
                // Failed to get user profile
                body.connect = false
            }
        }
        response.send(body)
    })

    // ** All routes after this point must have a valid FF Token associated with the session **
    RED.httpAdmin.use('/flowforge-nr-tools/*', auth.needsFFToken)

    RED.httpAdmin.get('/flowforge-nr-tools/teams', async (request, response) => {
        try {
            const teams = await ffGet('/api/v1/user/teams', request.ffToken)
            response.send(teams)
        } catch (err) {
            response.send({ error: err.toString(), code: 'request_failed' })
        }
    })

    RED.httpAdmin.get('/flowforge-nr-tools/teams/:teamId/projects', async (request, response) => {
        try {
            const projects = await ffGet(`/api/v1/teams/${request.params.teamId}/projects`, request.ffToken)
            response.send(projects)
        } catch (err) {
            response.send({ error: err.toString(), code: 'request_failed' })
        }
    })

    RED.httpAdmin.get('/flowforge-nr-tools/projects/:projectId', async (request, response) => {
        try {
            const project = await ffGet(`/api/v1/projects/${request.params.projectId}`, request.ffToken)
            response.send(project)
        } catch (err) {
            response.send({ error: err.toString(), code: 'request_failed' })
        }
    })

    RED.httpAdmin.get('/flowforge-nr-tools/projects/:projectId/snapshots', async (request, response) => {
        try {
            const project = await ffGet(`/api/v1/projects/${request.params.projectId}/snapshots`, request.ffToken)
            response.send(project)
        } catch (err) {
            response.send({ error: err.toString(), code: 'request_failed' })
        }
    })

    RED.httpAdmin.post('/flowforge-nr-tools/projects/:projectId/snapshots', async (request, response) => {
        try {
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
        } catch (err) {
            response.send({ error: err.toString(), code: 'request_failed' })
        }
    })
}

module.exports = {
    setupRoutes
}
