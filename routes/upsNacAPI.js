const express = require('express')
const UpsCalcNac = require('../middleware/upsCalcNac.js')

const router = express.Router()

router.get('/nac', (req, res) => {
  const pesoCons = req.query.pesoCons,
    orgPostalCode = req.query.orgPostalCode,
    dstPostalCode = req.query.dstPostalCode

  console.log('UPS NACIONAL:', orgPostalCode, dstPostalCode, pesoCons, 'KGS')

  UpsCalcNac(orgPostalCode, dstPostalCode, pesoCons)
    .then((quote) => {
      console.log(quote)
      res.json(quote)
    })
    .catch((err) => {
      res.json(err)
    })
})

module.exports = router
