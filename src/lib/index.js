const api = require('./api')
module.exports = (RED) => {
    RED.plugins.registerPlugin('flowforge-nr-tools', {
        settings: {
            '*': { exportable: true }
        },
        onadd: function () {
            api.setupRoutes(RED)
            // This is a bit of a hack, but it lets the plugin know when the
            // comms connection has been established - such as after a runtime
            // restart
            RED.comms.publish('flowforge-nr-tools/connected', true, true)
        }
    })
}
