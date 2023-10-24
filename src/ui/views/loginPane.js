import $ from 'jquery'
import { connect, getSettings } from '../api.js'
const loginPane = {
    id: 'login',
    onshow: () => {},
    content: () => {
        const pane = $('<div class="ff-nr-tools-pane ff-nr-tools-pane-centered"></div>')

        const settings = getSettings()
        if (!settings.forgeURL) {
            $('<div>To connect to FlowFuse, open <i class="fa fa-cog"></i> Settings and set the Server URL</div>').appendTo(pane)
        } else {
            $('<button type="button" class="red-ui-button">Connect to FlowFuse</button>').appendTo(pane).on('click', function (evt) { connect() })
        }
        return pane
    }
}

export {
    loginPane
}
