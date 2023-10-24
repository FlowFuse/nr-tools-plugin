// Import the globals
import $ from 'jquery'
import RED from 'node-red'
import { connect, disconnect, getSettings } from '../api'
import { ConnectionStatusWidget } from '../components/connectionStatus'
import * as events from '../events.js'

function init () {
    RED.userSettings.add({
        id: 'flowfuse-nr-tools',
        title: 'FlowFuse Tools',
        get: getSettingsPane,
        close: function () {
            events.off('connection-state', refreshConnectionState)
            // var existingSettings = RED.settings.get("nrlint", {rules:{}});
            // RED.settings.set("nrlint",settings);
        }
    })
}

const settingsTemplate = `
<div id="red-ui-settings-tab-flowfuse-nr-tools" class="red-ui-help ff-nr-tools-settings">
    <h3>Platform Details</h3>
    <div class="red-ui-settings-row flowfuse-nr-tools-settings-connectionStatus"></div>
    <div class="red-ui-settings-row">
        <label>Server</label>
        <div style="display: inline-flex">
            <input type="text" id="flowfuse-nr-tools-settings-forgeURL" style="flex-grow: 1; margin-right: 10px;">
            <button type="button" class="red-ui-button" id="flowfuse-nr-tools-settings-connection">disconnect</button>
        </div>
    </div>        
</div>`

function refreshConnectionState (element) {
    element = element || $(document)
    const { connected } = getSettings()
    element.find('#flowfuse-nr-tools-settings-connection').text(connected ? 'disconnect' : 'connect')
    element.find('#flowfuse-nr-tools-settings-forgeURL').attr('disabled', !!connected)
}
function getSettingsPane () {
    const pane = $(settingsTemplate)
    const settings = getSettings()
    events.on('connection-state', () => { refreshConnectionState() })
    pane.find('#flowfuse-nr-tools-settings-forgeURL').val(settings.forgeURL || 'https://app.flowfuse.com')
    ConnectionStatusWidget().appendTo(pane.find('.flowfuse-nr-tools-settings-connectionStatus'))

    pane.find('#flowfuse-nr-tools-settings-connection').on('click', function (evt) {
        const { connected } = getSettings()
        if (connected) {
            disconnect()
        } else {
            const url = pane.find('#flowfuse-nr-tools-settings-forgeURL').val()
            connect(url)
        }
    })

    refreshConnectionState(pane)
    return pane
}

export {
    init
}
