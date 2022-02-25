const HereMaps = require('../middleware/hereMaps.js')

const express = require('express')
const router = express.Router()

router.get('/', (req, res) => {
  const city = req.query.city,
    country = req.query.country,
    lang = req.query.lang

  HereMaps(city, country, lang)
    .then((v) => {
      res.json(v)
    })
    .catch((err) => {
      res.json(err)
    })
})

module.exports = router
