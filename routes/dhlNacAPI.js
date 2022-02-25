const express = require('express')
const CalcDHL = require('../middleware/dhlCalc.js')

const router = express.Router()

router.get('/nac', (req, res) => {
  const orgcty = req.query.orgcty,
    dstcty = req.query.dstcty,
    peso_cons = req.query.peso_cons,
    orgcep = req.query.orgcep,
    dstcep = req.query.dstcep,
    orgctr = req.query.orgctr,
    dstctr = req.query.dstctr,
    excedmed = req.query.excedmed,
    excedpeso = req.query.excedpeso

  console.log('DHL NAC:', peso_cons, 'KG', dstcep, dstcty)

  pacoteNac = new CalcDHL(
    orgcty,
    dstcty,
    peso_cons,
    orgcep,
    dstcep,
    orgctr,
    dstctr,
    excedmed,
    excedpeso
  )

  pacoteNac
    .cotarNacional()
    .then((quote) => {
      console.log(quote)
      res.json(quote)
    })
    .catch((err) => {
      res.json(err)
    })
})

module.exports = router
