const express = require('express')
const fs = require('fs')
const CalcDHL = require('../middleware/dhlCalc.js')
const CalcFedex = require('../middleware/fedexCalc.js')

const router = express.Router()

router.get('/inter', (req, res) => {
  let dstcty = req.query.dstcty,
  peso_cons = req.query.peso_cons,
  dstctr = req.query.dstctr

  let postalCode = req.query.postalCode

  postalCode = postalCode === 'undefined' ? '' : postalCode
  postalCode = dstctr === 'CA' ? 'T6X 0Z4' : postalCode
  postalCode = dstctr === 'CU' ? '32700' : postalCode
  postalCode = dstctr === 'CN' ? '200000' : postalCode
  postalCode = dstctr === 'ID' ? '10110' : postalCode
  postalCode = dstctr === 'BD' ? '1000' : postalCode
  postalCode = dstctr === 'BY' ? '220000' : postalCode
  postalCode = dstctr === 'KH' ? '120409' : postalCode
  postalCode = dstctr === 'MN' ? '15141' : postalCode
  postalCode = dstctr === 'TM' ? '744000' : postalCode
  postalCode = dstctr === 'TJ' ? '734000' : postalCode
  postalCode = dstctr === 'MD' ? '2001' : postalCode
  dstcty = dstcty.replace("'", '').split(' ')[0]

  const pacoteDHLInter = new CalcDHL(
    null,
    dstcty,
    peso_cons,
    null,
    postalCode,
    null,
    dstctr
  )

  console.log('FEDEX INTER:', peso_cons, 'KG', postalCode, dstctr)

  function randBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  pacoteDHLInter
    .cotarInternacional()
    .then((quote) => {
      const rand = randBetween(5, 10) * .10
      quote.service = 'fedex'      
      quote.produtos = quote.produtos.map(produto => {
        produto.produto = "FEDEX"
        let valor = Number(produto.valor.replace("R$ ", '').replace(',', '.'))
        valor = (valor + rand).toLocaleString('pt-br', { minimumFractionDigits: 2 })
        produto.valor = `R$ ${valor}`
        return produto
      })
      console.log(quote)
      res.json(quote)
    })
    .catch((err) => {
      res.json(err)
    })

})

module.exports = router
