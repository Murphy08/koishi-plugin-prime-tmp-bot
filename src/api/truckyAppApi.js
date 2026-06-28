const BASE_API = 'https://api.codetabs.com/v1/proxy/?quest=https://api.truckyapp.com'
const { logRequestSuccess, logRequestError } = require('../util/requestLog')

module.exports = {
  async online (http, tmpId) {
    const url = `${BASE_API}/v3/map/online?playerID=${tmpId}`
    let result = null
    try {
      result = await http.get(url)
    } catch (error) {
      logRequestError('truckyAppApi.online', url, error)
      return {
        error: true
      }
    }

    let data = {
      error: !result || !result.response || result.response.error
    }
    if (!data.error) {
      data.data = result.response
    }

    if (data.error) {
      logRequestError('truckyAppApi.online', url, {
        apiError: result && result.response && result.response.error
      })
    } else {
      logRequestSuccess('truckyAppApi.online', url)
    }

    return data
  },

  async trafficTop (http, serverName) {
    const url = `${BASE_API}/v2/traffic/top?game=ets2&server=${serverName}`
    let result = null
    try {
      result = await http.get(url)
    } catch (error) {
      logRequestError('truckyAppApi.trafficTop', url, error)
      return {
        error: true
      }
    }

    let data = {
      error: !result || !result.response || result.response.length <= 0
    }
    if (!data.error) {
      data.data = result.response
    }

    if (data.error) {
      logRequestError('truckyAppApi.trafficTop', url, {
        responseLength: result && result.response && result.response.length
      })
    } else {
      logRequestSuccess('truckyAppApi.trafficTop', url)
    }

    return data
  }
}
