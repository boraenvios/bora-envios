const CorreiosCalc = require('../middleware/correiosCalc')
const express = require('express')
const router = express.Router()

router.post('/', (req, res) => {
  req.setTimeout(10000)

  const orgCep = req.body.orgCep,
    pesoCons = req.body.pesoCons,
    dstCep = req.body.dstCep

  CorreiosCalc(orgCep, dstCep, pesoCons)
    .then((quote) => {
      res.json(quote)
    })
    .catch((err) => {
      res.json(err)
    })
})

module.exports = router
