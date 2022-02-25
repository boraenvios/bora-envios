const axios = require('axios')

const quoteBody = (svcCode, orgPostalCode, dstPostalCode, pesoCons) => {
  return {
    RateRequest: {
      Shipment: {
        ShipmentRatingOptions: {
          NegotiatedRatesIndicator: {},
        },
        DeliveryTimeInformation: {
          PackageBillType: '03',
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
            PostalCode: dstPostalCode,
            CountryCode: 'BR',
          },
        },
        ShipFrom: {
          Address: {
            CountryCode: 'BR',
            PostalCode: orgPostalCode,
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
            Weight: pesoCons,
          },
        },
        ShipmentTotalWeight: {
          UnitOfMeasurement: {
            Code: 'KGS',
          },
          Weight: pesoCons,
        },
        InvoiceLineTotal: {
          CurrencyCode: 'USD',
          MonetaryValue: '10',
        },
      },
    },
  }
}

const CalcUPS = async (orgPostalCode, dstPostalCode, pesoCons) => {
  const UPSurl = 'https://onlinetools.ups.com/ship/v1801/rating/Rate?additionalinfo=timeintransit'

  const UPSheaders = {
    'Content-Type': 'application/json',
    transactionSrc: 'SiteBoraEnvios',
    AccessLicenseNumber: process.env.UPS_KEY,
    Username: process.env.UPS_USERNAME,
    Password: process.env.UPS_PASSWORD,
  }

  const svcCodeRate = ['65']

  const body = quoteBody(svcCodeRate[0], orgPostalCode, dstPostalCode, pesoCons)
  console.log(body)

  const quoteRes = await axios.post(UPSurl, JSON.stringify(body), {
    headers: UPSheaders,
  })

  const result = quoteRes.data.RateResponse.RatedShipment

  //VALUES FILLING
  if (result.response === undefined) {
    const currencyCode = result.NegotiatedRateCharges.TotalCharge.CurrencyCode
    const quoteValue = result.NegotiatedRateCharges.TotalCharge.MonetaryValue
    const tit = result.TimeInTransit.ServiceSummary.EstimatedArrival.TotalTransitDays

    const quoteCorrected = (parseFloat(quoteValue) * 2.33 * 1.4).toFixed(2)

    const output = {
      service: 'ups-nacional',
      saver: { valor: `R$  ${quoteCorrected.replace('.', ',')}`, prazo: tit },
    }

    return output
  }
}

module.exports = CalcUPS
