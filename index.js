require('dotenv').config()

const express = require('express')
const dhlNacAPI = require('./routes/dhlNacAPI.js')
const dhlAPI = require('./routes/dhlAPI.js')
const citySearchAPI = require('./routes/citySearchAPI.js')
const upsAPI = require('./routes/upsAPI.js')
const upsNacAPI = require('./routes/upsNacAPI.js')
const fedexAPI = require('./routes/fedexAPI.js')
const correiosAPI = require('./routes/correiosAPI.js')

const app = express()

app.use(express.json())

app.use(express.static('./public'))

app.use('/correios', correiosAPI)
app.use('/dhl', dhlNacAPI)
app.use('/dhl', dhlAPI)
app.use('/citysearch', citySearchAPI)
app.use('/ups', upsAPI)
app.use('/ups', upsNacAPI)
app.use('/fedex', fedexAPI)

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`Server Started on ${PORT}`)
})
