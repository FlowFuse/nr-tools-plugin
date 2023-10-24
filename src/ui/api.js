import $ from 'jquery'
import RED from 'node-red'
import * as events from './events.js'

let settings = { connected: false }

function checkResponse (response) {
    if (response.code === 'unauthorized') {
        refreshSettings()
        throw new Error(response.code)
    } else if (response.code === 'request_failed') {
        RED.notify(`Request failed: ${response.error}`, { type: 'error' })
    }
    return response
}

export async function refreshSettings () {
    try {
        settings = await $.ajax({
            url: 'flowfuse-nr-tools/settings/',
            type: 'GET'
        })
        if (settings.connected) {
            events.emit('connection-state', true)
        } else {
            events.emit('connection-state', false)
        }
    } catch (err) {
        settings = { connected: false }
        events.emit('connection-state', false)
    }
}

export function connect (forgeURL, done) {
    forgeURL = forgeURL || settings.forgeURL
    if (!forgeURL) {
        RED.notify('Please provide a FlowFuse Server URL', 'error')
        return
    }
    $.ajax({
        contentType: 'application/json',
        url: 'flowfuse-nr-tools/auth/start',
        method: 'POST',
        data: JSON.stringify({
            forgeURL,
            editorURL: window.location.origin + window.location.pathname
        })
    }).then(data => {
        if (data && data.path && data.state) {
            const handleAuthCallback = function (evt) {
                try {
                    const message = JSON.parse(evt.data)
                    if (message.code === 'flowfuse-auth-complete') {
                        if (message.state === data.state) {
                            refreshSettings()
                        }
                    } else if (message.code === 'flowfuse-auth-error') {
                        RED.notify('Failed to connect to FlowFuse: ' + message.message, 'error')
                        refreshSettings()
                    }
                } catch (err) {}
                window.removeEventListener('message', handleAuthCallback, false)
                if (done) {
                    done()
                }
            }
            window.open(document.location.toString().replace(/[?#].*$/, '') + data.path, 'FlowFuseNodeREDPluginAuthWindow', 'menubar=no,location=no,toolbar=no,chrome,height=650,width=500')
            window.addEventListener('message', handleAuthCallback, false)
        } else if (data && data.error) {
            RED.notify(`Failed to connect to server: ${data.error}`, { type: 'error' })
        }
    })
}

export function disconnect (done) {
    $.post('flowfuse-nr-tools/auth/disconnect').then(data => {
        refreshSettings()
        if (done) {
            done()
        }
    })
}

export function getSettings () {
    return settings
}

export async function getUserTeams () {
    return checkResponse(await $.getJSON('flowfuse-nr-tools/teams'))
}

export async function getTeamProjects (teamId) {
    return checkResponse(await $.getJSON(`flowfuse-nr-tools/teams/${teamId}/projects`))
}
export async function getProject (projectId) {
    return checkResponse(await $.getJSON(`flowfuse-nr-tools/projects/${projectId}`))
}
export async function getProjectSnapshots (projectId) {
    return checkResponse(await $.getJSON(`flowfuse-nr-tools/projects/${projectId}/snapshots`))
}

export async function createProjectSnapshot (projectId, options) {
    return checkResponse(await $.ajax({
        type: 'POST',
        url: `flowfuse-nr-tools/projects/${projectId}/snapshots`,
        contentType: 'application/json; charset=utf-8',
        data: JSON.stringify(options)
    }))
}
