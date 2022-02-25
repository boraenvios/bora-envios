const axios = require('axios')
const convert = require('xml-js')

const CalcCorreios = async (orgCep, dstCep, pesoCons) => {
  const url =
    'http://ws.correios.com.br/Calculador/CalcPrecoPrazo.asmx/CalcPrecoPrazo'

  let valores = []
  let prazo = ''

  for (let i = 0; i < pesoCons.length; i++) {
    let params = {
      nCdEmpresa: '20350520',
      sDsSenha: '33459014',
      nCdServico: '04014',
      sCepOrigem: orgCep,
      sCepDestino: dstCep,
      nVlPeso: pesoCons[i],
      nCdFormato: '1',
      nVlComprimento: '20',
      nVlAltura: '10',
      nVlLargura: '10',
      nVlDiametro: '0',
      sCdMaoPropria: 'false',
      nVlValorDeclarado: '21',
      sCdAvisoRecebimento: 'false',
    }

    const res = await axios.get(url, { params })
    const resXml = res.data
    const resJson = JSON.parse(
      convert.xml2json(resXml, { compact: true, spaces: 4 })
    )
    const data = resJson.cResultado.Servicos.cServico

    valores.push(parseFloat(data.Valor._text.replace(',', '.')))
    prazo = data.PrazoEntrega._text
  }

  valor = parseFloat(valores.reduce((acc, cur) => acc + cur) + 5)
    .toFixed(2)
    .replace('.', ',')

  const output = {
    service: 'correios',
    valor: `R$ ` + valor,
    prazo: prazo,
  }

  return output
}

module.exports = CalcCorreios
