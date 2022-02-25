const axios = require('axios')
const tabelaPrazos = require('./tabelaPrazos.json')

const quoteBody = (svcCode, delTime, ctr, zipCode, peso_cons, city) => {
  const today = new Date()
  const date = today
    .toISOString()
    .split('T')[0]
    .replace('-', '')
    .replace('-', '')

  return {
    RateRequest: {
      Shipment: {
        ShipmentRatingOptions: {
          NegotiatedRatesIndicator: {},
        },
        DeliveryTimeInformation: {
          PackageBillType: '03',
          Pickup: {
            Time: delTime,
            Date: date,
          },
        },
        Shipper: {
          ShipperNumber: process.env.UPS_USERNAME,
          Address: {
            PostalCode: '06707100',
            CountryCode: 'BR',
          },
        },
        ShipTo: {
          Address: {
            PostalCode: zipCode,
            City: city,
            CountryCode: ctr,
          },
        },
        ShipFrom: {
          Address: {
            StateProvinceCode: 'SP',
            CountryCode: 'BR',
            PostalCode: '06707100',
          },
        },
        Service: {
          Code: svcCode,
        },
        Package: {
          PackagingType: {
            Code: '00',
            Description: 'Package',
          },
          Dimensions: {
            UnitOfMeasurement: {
              Code: 'CM',
            },
            Length: '5',
            Width: '5',
            Height: '5',
          },
          PackageWeight: {
            UnitOfMeasurement: {
              Code: 'KGS',
            },
            Weight: peso_cons,
          },
        },
        ShipmentTotalWeight: {
          UnitOfMeasurement: {
            Code: 'KGS',
          },
          Weight: peso_cons,
        },
        InvoiceLineTotal: {
          CurrencyCode: 'USD',
          MonetaryValue: '10',
        },
      },
    },
  }
}

const CalcUPS = async (country, zipCode, peso_cons, city) => {
  const UPSurl =
    'https://onlinetools.ups.com/ship/v1801/rating/Rate?additionalinfo=timeintransit'

  const UPSheaders = {
    'Content-Type': 'application/json',
    transactionSrc: 'SiteBoraEnvios',
    AccessLicenseNumber: process.env.UPS_KEY,
    Username: process.env.UPS_USERNAME,
    Password: process.env.UPS_PASSWORD,
  }

  const result = []
  const rate = []
  const tit = []
  const svcCodeRate = ['65', '08']
  const delTime = ['1600', '210000']

  let valorDolar = 1

  try {
    const cambioUrl = `https://economia.awesomeapi.com.br/json/last/USD-BRL`
    const cambioDoDia = await axios.get(cambioUrl)

    valorDolar = cambioDoDia.data.USDBRL.high
  } catch (error) {
    console.log(error)
  }

  for (let i = 0; i < svcCodeRate.length; i++) {
    const body = quoteBody(
      svcCodeRate[i],
      delTime[i],
      country,
      zipCode,
      peso_cons,
      city
    )
    let quoteRes

    try {
      quoteRes = await axios.post(UPSurl, JSON.stringify(body), {
        headers: UPSheaders,
      })
      result[i] = quoteRes.data.RateResponse.RatedShipment
      const value = result[i].NegotiatedRateCharges.TotalCharge.MonetaryValue

      if (result[i].response === undefined) {
        rate[i] =
          'R$ ' +
          (parseFloat(value) * 2.37 * parseFloat(valorDolar))
            .toFixed(2)
            .replace('.', ',')

        prazoUPS =
          result[i].TimeInTransit.ServiceSummary.EstimatedArrival
            .BusinessDaysInTransit

        let svcPrazo = i === 0 ? 'upsSaver' : 'upsExpedited'
        tit[i] = tabelaPrazos.filter((item) => item.countryCode === country)[0][
          svcPrazo
        ]
      }
    } catch (error) {
      console.log(error.response.data.response.errors[0].message)
    }
  }

  const output = {
    service: 'ups',
    saver: { valor: rate[0], prazo: tit[0] },
    expedited: { valor: rate[1], prazo: tit[1] },
  }

  return output
}

module.exports = CalcUPS
