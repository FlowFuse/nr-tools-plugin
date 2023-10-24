const settings = require('./settings')
const api = require('./api')
module.exports = (RED) => {
    RED.plugins.registerPlugin('flowfuse-nr-tools', {
        settings: {
            '*': { exportable: true }
        },
        onadd: function () {
            settings.init(RED)
            api.setupRoutes(RED)
            // This is a bit of a hack, but it lets the plugin know when the
            // comms connection has been established - such as after a runtime
            // restart
            RED.comms.publish('flowfuse-nr-tools/connected', true, true)
        }
    })
}
