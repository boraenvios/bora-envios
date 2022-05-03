const axios = require('axios')
const convert = require('xml-js')
const { verificarFeriado } = require('../middleware/dhlCalc.js')
const tabelaPrazos = require('./tabelaPrazos.json')

const fedexBody = (serviceType, shipDate, pesoCons, postalCode, country) => {
  return `<SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/" xmlns:SOAP-ENC="http://schemas.xmlsoap.org/soap/encoding/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns="http://fedex.com/ws/rate/v28">
   <SOAP-ENV:Body>
      <RateRequest>
         <WebAuthenticationDetail>
            <UserCredential>
               <Key>${process.env.FEDEX_KEY}</Key>
               <Password>${process.env.FEDEX_PASSWORD}</Password>
            </UserCredential>
         </WebAuthenticationDetail>
         <ClientDetail>
            <AccountNumber>${process.env.FEDEX_ACCOUNT}</AccountNumber>
            <MeterNumber>${process.env.FEDEX_METER}</MeterNumber>
            <SoftwareId>WSXI</SoftwareId>
         </ClientDetail>
         <TransactionDetail>
            <CustomerTransactionId>Site Bora Envios</CustomerTransactionId>
         </TransactionDetail>
         <Version>
            <ServiceId>crs</ServiceId>
            <Major>28</Major>
            <Intermediate>0</Intermediate>
            <Minor>0</Minor>
         </Version>
         <ReturnTransitAndCommit>true</ReturnTransitAndCommit>
         <RequestedShipment>
            <ShipTimestamp>${shipDate}</ShipTimestamp>
            <DropoffType>REGULAR_PICKUP</DropoffType>
            <ServiceType>${serviceType}</ServiceType>
            <PackagingType>YOUR_PACKAGING</PackagingType>
            <TotalWeight>
               <Units>KG</Units>
               <Value>${pesoCons}</Value>
            </TotalWeight>
            <Shipper>               
               <Address>
                  <StateOrProvinceCode>SP</StateOrProvinceCode>
                  <PostalCode>06707100</PostalCode>
                  <CountryCode>BR</CountryCode>
               </Address>
            </Shipper>
            <Recipient>               
               <Address>
                  <PostalCode>${postalCode}</PostalCode>
                  <CountryCode>${country}</CountryCode>
                  <Residential>1</Residential>
               </Address>
            </Recipient>
            <ShippingChargesPayment>
               <PaymentType>SENDER</PaymentType>
               <Payor>
                  <ResponsibleParty>
                     <AccountNumber>${process.env.FEDEX_ACCOUNT}</AccountNumber>
                  </ResponsibleParty>
               </Payor>
            </ShippingChargesPayment>
            <RateRequestTypes>LIST</RateRequestTypes>
            <PackageCount>1</PackageCount>
            <RequestedPackageLineItems>
               <SequenceNumber>1</SequenceNumber>
               <GroupNumber>1</GroupNumber>
               <GroupPackageCount>1</GroupPackageCount>
               <Weight>
                  <Units>KG</Units>
                  <Value>${pesoCons}</Value>
               </Weight>
               <Dimensions>
                  <Length>15</Length>
                  <Width>15</Width>
                  <Height>15</Height>
                  <Units>CM</Units>
               </Dimensions>
            </RequestedPackageLineItems>
         </RequestedShipment>
      </RateRequest>
   </SOAP-ENV:Body>
</SOAP-ENV:Envelope>`
}

const CalcFedex = async (pesoCons, postalCode, country) => {
  const url = 'https://ws.fedex.com:443/web-services'
  let shipDate = new Date()

  try {
    const shipDateVerified = new Date((await verificarFeriado()) + ' 00:00:00')
    shipDate = new Date(
      shipDateVerified.toISOString().split('T')[0] + ' 00:00:00'
    )
    shipDate.setHours('12')
  } catch (error) {
    console.log(error)
  }

  const shipDateISO = shipDate.toISOString()
  const str1 = 'xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/"'
  const str2 = 'xmlns="http://fedex.com/ws/rate/v28"'
  const serviceTypes = ['INTERNATIONAL_ECONOMY', 'INTERNATIONAL_PRIORITY']
  const quotes = []
  const tit = []

  for (let i = 0; i < 2; i++) {
    const body = fedexBody(
      serviceTypes[i],
      shipDateISO,
      pesoCons,
      postalCode,
      country
    )
    const res = await axios.post(url, body)
    let resXml = res.data

    resXml = resXml.replace(str1, '').replace(str2, '')

    const resJson = JSON.parse(
      convert.xml2json(resXml, { compact: true, spaces: 4 })
    )

    const resStatus =
      resJson['SOAP-ENV:Envelope']['SOAP-ENV:Body'].RateReply.HighestSeverity
        ._text

    if (resStatus !== 'ERROR' && resStatus !== 'FAILURE') {
      const resQuote =
        resJson['SOAP-ENV:Envelope']['SOAP-ENV:Body'].RateReply.RateReplyDetails

      const deliveryDate = new Date(resQuote.DeliveryTimestamp._text)
      deliveryDate.setHours('12')
      shipDate.setHours('12', '00', '00')
      const dateDiff = deliveryDate.getTime() - shipDate.getTime()
      let prazoFedex = Math.ceil(dateDiff / (1000 * 3600 * 24))
      prazoFedex =
        prazoFedex > 4 && prazoFedex < 10
          ? prazoFedex - 2
          : prazoFedex > 11 && prazoFedex < 17
          ? prazoFedex - 4
          : prazoFedex > 18
          ? prazoFedex - 6
          : prazoFedex

      let quoteValue =
        resQuote.RatedShipmentDetails[1].ShipmentRateDetail.TotalNetFedExCharge
          .Amount._text

      quoteValue = parseFloat(quoteValue)
      const discountedValue = Number((quoteValue * .99).toFixed(2)).toLocaleString('pt-br', { minimumFractionDigits: 2 })
      quotes[i] =
        'R$ ' + discountedValue

      let svcPrazo = i === 0 ? 'fedexEconomy' : 'fedexPriority'
      tit[i] = tabelaPrazos.filter((item) => item.countryCode === country)[0][
        svcPrazo
      ]
    }
  }

  const output = {
    service: 'fedex',
    economy: {
      valor: quotes[0],
      prazo: tit[0],
    },
    priority: {
      valor: quotes[1],
      prazo: tit[1],
    },
  }

  return output
}

module.exports = CalcFedex
