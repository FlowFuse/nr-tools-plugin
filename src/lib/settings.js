
const settings = {
    // forgeURL: 'http://localhost:3000'
    // allowProjectSelection: false,
    // team: '<team-id>',
    // project: '<project-id>>'
}

function init (RED) {

}

const get = key => settings[key]
const set = (key, value) => { settings[key] = value }
const exportPublicSettings = () => { return { ...settings } }
module.exports = {
    init,
    get,
    set,
    exportPublicSettings
}
