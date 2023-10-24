// Import the css so it gets included in the output
// eslint-disable-next-line no-unused-vars
import style from './style.css'

// Import the globals
// import $ from 'jquery'
import RED from 'node-red'
import * as sidebar from './sidebar'
import * as settingsPane from './views/settingsPane'
// import * as api from './api.js'

RED.plugins.registerPlugin('flowfuse-nr-tools', {
    onadd: async function () {
        sidebar.init()
        settingsPane.init()
    }
})
