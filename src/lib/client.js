const undici = require('undici')
const settings = require('./settings')

async function ffGet (url, token) {
    const opts = {
        method: 'GET'
    }
    if (token) {
        opts.headers = { authorization: `Bearer ${token}` }
    }
    const { body } = await undici.request(
        `${settings.get('forgeURL')}${url}`,
        opts
    )
    return await body.json()
}
async function ffPost (url, token, payload) {
    const { body } = await undici.request(
        `${settings.get('forgeURL')}${url}`,
        {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: {
                authorization: `Bearer ${token}`,
                'content-type': 'application/json'
            }
        }
    )
    return await body.json()
}

module.exports = {
    ffGet,
    ffPost
}
