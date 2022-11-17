const settings = {
    forgeURL: 'http://localhost:3000'
    // allowProjectSelection: false,
    // team: 'Jp6oj5LNqG',
    // project: '780de1a7-7e45-4e2b-b7de-07eeec6f0126'
}

const get = key => settings[key]
const set = (key, value) => { settings[key] = value }
const exportPublicSettings = () => { return { ...settings } }
module.exports = {
    get,
    set,
    exportPublicSettings
}
