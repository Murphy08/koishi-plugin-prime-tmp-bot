const BASE_API = 'https://api.codetabs.com/v1/proxy/?quest=https://api.truckersmp.com/v2'
const { logRequestSuccess, logRequestError } = require('../util/requestLog')

function parseErrorFlag (value) {
  if (typeof value === 'boolean') {
    return value
  }

  if (typeof value === 'string') {
    if (value === 'true' || value === 'false') {
      return JSON.parse(value)
    }
    return value.length > 0
  }

  return Boolean(value)
}

async function request (http, name, path) {
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

  if (!result || typeof result !== 'object') {
    logRequestError(name, url, {
      reason: 'invalid response'
    })
    return {
      error: true
    }
  }

  const error = parseErrorFlag(result.error)
  const data = {
    error,
    data: error ? null : result.response
  }

  if (data.error) {
    logRequestError(name, url, {
      apiError: result.error
    })
  } else {
    logRequestSuccess(name, url)
  }

  return data
}

module.exports = {
  async eventById (http, eventId) {
    return await request(http, 'truckersMPEventApi.eventById', `/events/${eventId}`)
  },

  async vtcEvents (http, vtcId) {
    return await request(http, 'truckersMPEventApi.vtcEvents', `/vtc/${vtcId}/events`)
  },

  async vtcEventsAttending (http, vtcId) {
    return await request(http, 'truckersMPEventApi.vtcEventsAttending', `/vtc/${vtcId}/events/attending`)
  }
}
