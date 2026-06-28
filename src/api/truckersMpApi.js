const BASE_API = 'https://api.codetabs.com/v1/proxy/?quest=https://api.truckersmp.com/v2'
const { logRequestSuccess, logRequestError } = require('../util/requestLog')

async function request (http, name, path, resolveData) {
  const url = `${BASE_API}${path}`
  let result = null
  try {
    result = await http.get(url)
  } catch (error) {
    logRequestError(name, url, error)
    return {
      error: true
    }
  }

  let data = null
  try {
    data = resolveData(result)
  } catch (error) {
    logRequestError(name, url, error)
    return {
      error: true
    }
  }

  if (data.error) {
    logRequestError(name, url, {
      apiError: result && result.error
    })
  } else {
    logRequestSuccess(name, url)
  }

  return data
}

function resolveTruckersMpResponse (result) {
  let data = {
    error: typeof result.error === 'boolean' ? result.error : JSON.parse(result.error)
  }
  if (!data.error) {
    data.data = result.response
  }

  return data
}

module.exports = {
  async player (http, tmpId) {
    return await request(http, 'truckersMpApi.player', `/player/${tmpId}`, resolveTruckersMpResponse)
  },

  async servers (http) {
    return await request(http, 'truckersMpApi.servers', '/servers', resolveTruckersMpResponse)
  },

  async bans (http, tmpId) {
    return await request(http, 'truckersMpApi.bans', `/bans/${tmpId}`, resolveTruckersMpResponse)
  },

  async version (http) {
    return await request(http, 'truckersMpApi.version', '/version', (result) => ({
      error: false,
      data: result
    }))
  },

  async vtcMember (http, vtcId, memberId) {
    return await request(http, 'truckersMpApi.vtcMember', `/vtc/${vtcId}/member/${memberId}`, resolveTruckersMpResponse)
  }
}
