const BASE_API = 'https://api.truckersmp.com/v2'

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

async function request (http, path) {
  let result = null
  try {
    result = await http.get(`${BASE_API}${path}`)
  } catch {
    return {
      error: true
    }
  }

  if (!result || typeof result !== 'object') {
    return {
      error: true
    }
  }

  const error = parseErrorFlag(result.error)
  return {
    error,
    data: error ? null : result.response
  }
}

module.exports = {
  /**
   * 根据活动 ID 查询活动详情。
   */
  async eventById (http, eventId) {
    return await request(http, `/events/${eventId}`)
  },

  /**
   * 查询指定 VTC 创建的活动列表。
   */
  async vtcEvents (http, vtcId) {
    return await request(http, `/vtc/${vtcId}/events`)
  },

  /**
   * 查询指定 VTC 参与的活动列表。
   */
  async vtcEventsAttending (http, vtcId) {
    return await request(http, `/vtc/${vtcId}/events/attending`)
  }
}
