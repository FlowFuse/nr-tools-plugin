// Import the globals
import $ from 'jquery'
import RED from 'node-red'

import * as api from './api.js'
import * as events from './events.js'
import { loginPane } from './views/loginPane.js'
import { mainPane } from './views/mainPane.js'
import { ConnectionStatusWidget } from './components/connectionStatus'
import { TeamSelectionWidget } from './components/teamSelection'
import { ProjectSelectionWidget } from './components/projectSelection'

const sidebarContentTemplate = `
<div class="ff-nr-tools">
    <div class="red-ui-sidebar-header ff-nr-tools-header">
        <!-- Left Header -->
        <span id="ff-nr-tools-header-left">
        </span>
        <!-- Right Header -->
        <span id="ff-nr-tools-header-right">
            <button type="button" class="red-ui-sidebar-header-button" id="ff-nr-tools-show-settings"><i class="fa fa-cog"></i></button>
        </span>
    </div>
    <div class="ff-nr-tools" id="ff-nr-tools-body">
    </div>
</div>
`
const sidebarToolbarTemplate = '<div></div>'

function init () {
    const content = $(sidebarContentTemplate)
    content.find('#ff-nr-tools-show-settings').on('click', function (evt) {
        evt.preventDefault()
        RED.userSettings.show('flowfuse-nr-tools')
    })
    const contentBody = content.find('#ff-nr-tools-body')
    const toolbar = $(sidebarToolbarTemplate)

    ConnectionStatusWidget().appendTo(toolbar)
    TeamSelectionWidget().appendTo(content.find('#ff-nr-tools-header-left'))
    ProjectSelectionWidget().appendTo(content.find('#ff-nr-tools-header-left'))

    const panes = {
        login: loginPane,
        main: mainPane
    }
    let activePane = null
    function showPane (id) {
        if (activePane) {
            if (activePane.id === id) {
                return
            }
            activePane._content.remove()
            if (activePane.onhide) {
                activePane.onhide()
            }
        }
        activePane = panes[id]
        activePane._content = activePane.content()
        activePane._content.appendTo(contentBody)
        if (activePane.onshow) {
            activePane.onshow()
        }
    }

    events.on('connection-state', function (state) {
        if (!state) {
            showPane('login')
        } else {
            showPane('main')
        }
    })

    RED.sidebar.addTab({
        id: 'flowfuse-nr-tools',
        label: 'FlowFuse',
        name: 'FlowFuse Tools',
        content,
        toolbar,
        pinned: true,
        iconClass: 'flowfuse-nr-tools-icon',
        action: 'flowfuse-nr-tools:show-flowfuse-tools-tab'
    })
    RED.actions.add('flowfuse-nr-tools:show-flowfuse-tools-tab', function () {
        RED.sidebar.show('flowfuse-nr-tools')
    })
    RED.comms.subscribe('flowfuse-nr-tools/connected', function (topic, msg) {
        api.refreshSettings()
    })
}

export {
    init
}
