const axios = require('axios')

HereMaps = async (city, country, lang) => {
  const api_key = process.env.HEREMAPS_API_KEY
  const url = 'https://geocode.search.hereapi.com/v1/geocode'

  const params = {
    qq: `city=${city};country=${country}`,
    lang,
    apiKey: api_key,
  }

  const res = await axios.get(url, { params })
  const result = res.data

  if (result.items[0] === undefined) {
    return 'err'
  } else {
    return result.items[0]
  }
}

module.exports = HereMaps
