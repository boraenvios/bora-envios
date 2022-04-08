const express = require('express')
//const CalcDHL = require('../middleware/dhlCalc.js')

const dhlInternacionalScrap = require('./../middleware/dhlInterCalcScrap')
const { differenceInBusinessDays } = require('date-fns')

const router = express.Router()

router.get('/inter', async (req, res) => {

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

  console.log('DHL INTER:', peso_cons, 'KG', postalCode, dstctr)

  const result = await dhlInternacionalScrap(
    {
      pais: 'BRAZIL (BR)',
      cidade: 'Cotia'
    },
    {
      pais: dstctr,
      cidade: dstcty
    },
    [
      {
        peso: peso_cons,
        comprimento: '0',
        largura: '0',
        altura: '0'
      }
    ]
  )

  if (result.error) {
    res.json(result.error)
  }
  else {
    const produtos = result.map(({ produto, prazo, preco }) => {
      const diffDays = differenceInBusinessDays(new Date(prazo), new Date())
      return { 
        produto, 
        prazo: `${diffDays} - ${diffDays + 2}`, 
        valor: `R$ ${Number((preco * .98).toFixed(2)).toLocaleString('pt-br', { minimumFractionDigits: 2 }) }`
      }
    })
    res.json({
      service: 'dhl',
      produtos
    })
  }
})

module.exports = router
