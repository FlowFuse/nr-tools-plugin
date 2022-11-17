import $ from 'jquery'
import RED from 'node-red'
import * as api from '../api.js'
import * as events from '../events.js'

const connectionStatusTemplate = `<span class="ff-nr-tools-connection-status">
    <div class="ff-nr-tools-connection-status-connected">
        <i class="fa fa-circle"></i> connected as <span class="ff-nr-tools-connection-status-username"></span>
    </div>
    <div class="ff-nr-tools-connection-status-disconnected">
        <i class="fa fa-circle-o"></i> not connected
    </div>
</span>`

function refreshConnectionState (element) {
    const settings = api.getSettings()
    element.find('.ff-nr-tools-connection-status-connected').toggle(!!settings.connected)
    element.find('.ff-nr-tools-connection-status-disconnected').toggle(!settings.connected)
    if (settings.connected) {
        element.find('.ff-nr-tools-connection-status-username').text(settings.user.username)
    }
}

events.on('connection-state', function () {
    refreshConnectionState($(document))
})

export function ConnectionStatusWidget () {
    const widget = $(connectionStatusTemplate)
    RED.popover.create({
        tooltip: true,
        target: widget.find('.ff-nr-tools-connection-status-username'),
        trigger: 'hover',
        size: 'small',
        direction: 'top',
        content: function () {
            const settings = api.getSettings()
            return $(`<div style="padding: 5px"><img src="${settings.user.avatar}" width="24px" style="margin-right: 5px;"> <span>${settings.user.name}</div>`)
        },
        delay: { show: 250, hide: 50 }
    })
    refreshConnectionState(widget)
    return widget
}
