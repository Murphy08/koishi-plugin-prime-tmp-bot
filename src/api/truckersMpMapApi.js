const BASE_API = 'https://tracker.ets2map.com'
const { logRequestSuccess, logRequestError } = require('../util/requestLog')

module.exports = {
  async area (http, serverId, x1, y1, x2, y2) {
    const url = `${BASE_API}/v3/area?x1=${x1}&y1=${y1}&x2=${x2}&y2=${y2}&server=${serverId}`
    let result = null
    try {
      result = await http.get(url)
    } catch (error) {
      logRequestError('truckersMpMapApi.area', url, error)
      return {
        error: true
      }
    }

    let data = {
      error: !result || !result.Success
    }
    if (!data.error) {
      data.data = result.Data
    }

    if (data.error) {
      logRequestError('truckersMpMapApi.area', url, {
        success: result && result.Success
      })
    } else {
      logRequestSuccess('truckersMpMapApi.area', url)
    }

    return data
  }
}
