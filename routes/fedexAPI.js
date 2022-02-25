const express = require('express')
const fs = require('fs')
const CalcFedex = require('../middleware/fedexCalc.js')

const router = express.Router()

router.get('/inter', (req, res) => {
  const country = req.query.country
  const pesoCons = req.query.pesoCons
  let postalCode = req.query.postalCode
  //   city = req.query.city;

  postalCode = postalCode === 'undefined' ? '' : postalCode
  postalCode = country === 'JP' ? '206-0000' : postalCode
  postalCode = country === 'CA' ? 'T6X 0Z4' : postalCode
  postalCode = country === 'CN' ? '300000' : postalCode
  postalCode = country === 'ID' ? '10110' : postalCode
  postalCode = country === 'BD' ? '1000' : postalCode
  postalCode = country === 'BY' ? '220000' : postalCode
  postalCode = country === 'AE' ? '00000' : postalCode
  postalCode = country === 'SE' ? '10012' : postalCode
  postalCode = country === 'PL' ? '77130' : postalCode
  postalCode = country === 'GN' ? '' : postalCode
  postalCode = country === 'NP' ? '44621' : postalCode
  postalCode = country === 'NL' ? '1109' : postalCode
  postalCode = country === 'GR' ? '10160' : postalCode
  postalCode = country === 'GW' ? '100' : postalCode
  postalCode = country === 'KR' ? '01000' : postalCode
  postalCode = country === 'EC' ? '170312' : postalCode

  console.log('FEDEX INTER:', pesoCons, 'KG', postalCode, country)

  CalcFedex(pesoCons, postalCode, country)
    .then((quote) => {
      console.log(quote)
      res.json(quote)
    })
    .catch((err) => {
      res.json(err)
    })
})

module.exports = router
