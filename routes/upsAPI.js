const express = require('express')
const CalcUPS = require('../middleware/upsCalc.js')

const router = express.Router()

router.get('/inter', (req, res) => {
  let country = req.query.ctry,
    pesoCons = req.query.peso,
    city = req.query.city
  let postalCode = req.query.postcode

  postalCode = postalCode === 'undefined' ? '' : postalCode
  postalCode =
    country === 'JP'
      ? '206-0000'
      : country === 'CA'
      ? 'T6X 0Z4'
      : country === 'CN'
      ? '300000'
      : country === 'ID'
      ? '10110'
      : country === 'BD'
      ? '1000'
      : country === 'BY'
      ? '220001'
      : country === 'VN'
      ? '150000'
      : country === 'VN'
      ? '150000'
      : country === 'TZ'
      ? '12101'
      : country === 'MN'
      ? '210100'
      : country === 'SE'
      ? '10012'
      : country === 'PL'
      ? '77130'
      : country === 'LK'
      ? '10150'
      : country === 'NP'
      ? '44621'
      : country === 'NL'
      ? '1109'
      : country === 'MH'
      ? '96960'
      : country === 'GR'
      ? '10160'
      : country === 'GW'
      ? '100'
      : country === 'IL'
      ? '4691000'
      : country === 'MD'
      ? '2001'
      : country === 'MA'
      ? '10000'
      : country === 'KG'
      ? '720001'
      : country === 'KR'
      ? '01000'
      : country === 'TW'
      ? '10601'
      : country === 'EC'
      ? '170312'
      : postalCode

  city = city.toString().split(' ')[0].replace("'", '').replace('-', ' ')

  city = country === 'KH' ? 'Phnom Penh' : city

  console.log('UPS INTER:', country, postalCode, city, pesoCons, 'KG')

  CalcUPS(country, postalCode, pesoCons, city)
    .then((quote) => {
      console.log(quote)
      res.json(quote)
    })
    .catch((err) => {
      res.json(err)
    })
})

module.exports = router
