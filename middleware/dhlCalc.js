const fs = require('fs')
const axios = require('axios')
const tabelaPrazos = require('./tabelaPrazos.json')

class CalcDHL {
  constructor(
    orgcty,
    dstcty,
    peso_cons,
    orgcep,
    dstcep,
    orgctr,
    dstctr,
    excedmed,
    excedpeso
  ) {
    this.props = {
      orgcty,
      dstcty,
      peso_cons,
      orgcep,
      dstcep,
      orgctr,
      dstctr,
      excedmed,
      excedpeso,
    }
  }
  cotarInternacional = async () => {
    const { dstcty, peso_cons, dstctr, dstcep } = this.props
    const shpDate_ = await CalcDHL.verificarFeriado()
    const shpDate = new Date(shpDate_ + ' 00:00:00')
    const params = {
      dtbl: 'N',
      wgt0: peso_cons,
    }
    const dctUrl = `http://dct.dhl.com/data/quotation/?dtbl=N&declVal=&declValCur=BRL&wgtUom=kg&dimUom=cm&noPce=1&wgt0=${peso_cons}&w0=0&l0=&h0=&shpDate=${shpDate_}&orgCtry=BR&orgCity=COTIA&dstCtry=${dstctr}&dstCity=${dstcty}&dstZip=${dstcep}`
    const quote_ = await axios.get(dctUrl)
    const quote = quote_.data
    const quoteCount = quote.count
    const quoteSelector = quote.quotationList.quotation.filter(
      (quote) => quote.prodNm === 'EXPRESS WORLDWIDE'
    )[0]

    //VERIFICAÇÃO DE ERRO
    if (quoteCount === 0) {
      return 'DHL INTER: ' + quote.errorMessage
    } else {
      const strPrazo = quoteSelector.estDeliv,
        dataPrazo = strPrazo.split(',')[1].substring(1),
        dataEntregaDHL = new Date(dataPrazo)
      dataEntregaDHL.setHours('00')
      let diffDHL = dataEntregaDHL.getTime() - shpDate.getTime()
      let prazoDHL = diffDHL / (1000 * 60 * 60 * 24)
      prazoDHL =
        prazoDHL > 4 && prazoDHL < 10
          ? prazoDHL - 2
          : prazoDHL > 11 && prazoDHL < 17
          ? prazoDHL - 4
          : prazoDHL > 18
          ? prazoDHL - 6
          : prazoDHL
      const value = quoteSelector.estTotPrice
        .replace('BRL', '')
        .replace(',', '')
      const quoteValue = parseFloat(value) * 0.98

      const prazoFromTable = tabelaPrazos.filter(
        (item) => item.countryCode === dstctr
      )[0].dhl

      const output = {
        service: 'dhl',
        valor:
          'R$ ' +
          quoteValue
            .toFixed(2)
            .replace(',', '')
            .replace(/.([^.]*)$/, ',' + '$1'),
        prazo: prazoFromTable,
      }

      return output
    }
  }

  cotarNacional = async () => {
    const { orgcty, dstcty, peso_cons, excedmed, excedpeso } = this.props

    const taxacomb = 10 / 100
    const taxaExced = 47.25
    const taxaRemota = 48.3

    // LEITURA DE BASE DE DADOS LOCAL
    const listacidades = JSON.parse(
        fs.readFileSync(`${__dirname}/../db/listacidades.json`, 'utf8')
      ),
      listazonas = JSON.parse(
        fs.readFileSync(`${__dirname}/../db/listazonas.json`, 'utf8')
      ),
      frete = JSON.parse(
        fs.readFileSync(`${__dirname}/../db/frete.json`, 'utf8')
      ),
      listataxas = JSON.parse(
        fs.readFileSync(`${__dirname}/../db/taxas.json`, 'utf8')
      )

    //Pesquisa Cidade -> Aeroporto
    const cidadeOrigem = listacidades.filter((apt) => apt.cidade === orgcty)[0]
    const cidadeDestino = listacidades.filter((apt) => apt.cidade === dstcty)[0]

    //VERIFICAÇÃO DE ERRO, SE CIDADE NÃO CONSTA EM BASE DE DADOS
    if (cidadeOrigem === undefined || cidadeDestino === undefined) {
      return { erro: 'DHL Indisponível para localidade selecionada' }
    } else {
      //Estabelece as Lanes
      const markup = 10
      const lane = cidadeOrigem.aeroporto + cidadeDestino.aeroporto
      const uflane = cidadeOrigem.uf + cidadeDestino.uf

      const zona = listazonas.filter((zon) => zon.lane === lane)[0].zona

      const fretes = frete.filter((f) => f.zona === zona)[0]
      const frete1 = fretes.frete1
      const freteadd = fretes.freteadd

      const taxas = listataxas.filter((taxa) => taxa.uflane === uflane)[0]
      const iss = taxas.iss
      const icms = taxas.icms

      //Frete base
      const valorBase = frete1 + (peso_cons - 1) * freteadd
      const valorImp = orgcty == dstcty ? valorBase / iss : valorBase / icms

      //Taxa de combustível
      const valorComb = valorBase * taxacomb
      const valorCombImp = orgcty == dstcty ? valorComb / iss : valorComb / icms

      //Área Remota
      const valorRem = cidadeDestino.area_remota === 'Sim' && taxaRemota
      const valorRemImp = orgcty == dstcty ? valorRem / iss : valorRem / icms

      //Excedente Peso
      const valorExcedPeso = taxaExced * Number(excedpeso)
      const valorExcedPesoImp =
        orgcty == dstcty ? valorExcedPeso / iss : valorExcedPeso / icms

      //Excendente Medidas
      const valorExcedMed = taxaExced * Number(excedmed)
      const valorExcedMedImp =
        orgcty == dstcty ? valorExcedMed / iss : valorExcedMed / icms

      //Combustível sobre excedente
      const valorCombExc =
        (valorExcedMed + valorExcedPeso + valorRem) * taxacomb
      const valorCombExcImp =
        orgcty == dstcty ? valorCombExc / iss : valorCombExc / icms

      //Soma dos valores
      const somaValores =
        valorImp +
        valorCombImp +
        valorRemImp +
        valorExcedPesoImp +
        valorExcedMedImp +
        valorCombExcImp +
        markup
      const v1 = somaValores.toFixed(2)

      const prazo = await this.obterPrazoNac()

      //VERIFICAÇÃO QUANDO COTAÇÃO -> OK E PRAZO -> ERRO
      if (prazo === 'erro') {
        const output = {
          erro: 'DHL Indisponível para localidade selecionada',
        }
        return output
      }

      const output = {
        service: 'dhl-nacional',
        valor: `R$ ` + v1.replace('.', ','),
        prazo: prazo,
      }
      return output
    }
  }

  obterPrazoNac = async () => {
    const { orgctr, orgcep, dstctr, dstcep } = this.props

    const shpDate = await CalcDHL.verificarFeriado()
    const shpDate_ = new Date(shpDate)
    shpDate_.setHours('00')

    //MONTAGEM DE URL
    const dctUrl = `https://dct.dhl.com/data/quotation/?wgtUom=kg&dimUom=cm&noPce=1&wgt0=0.1&w0=0&l0=0&h0=0&shpDate=${shpDate}&orgCtry=${orgctr}&orgZip=${orgcep}&dstCtry=${dstctr}&dstZip=${dstcep}`

    //GET REQUEST PARA URL, RETORNA JSON
    const prazo_ = await axios.get(dctUrl)
    const prazo = prazo_.data

    if (prazo.count == 1) {
      const strPrazo = prazo.quotationList.quotation[0].estDeliv,
        dataPrazo = strPrazo.split(',')[1].substring(1),
        dataEntregaDHL = new Date(dataPrazo)
      shpDate_.setHours('00')
      dataEntregaDHL.setHours('00')
      const diffDataDHL = dataEntregaDHL.getTime() - shpDate_.getTime()
      let prazoDHL = Math.ceil(diffDataDHL / (1000 * 3600 * 24))
      prazoDHL =
        prazoDHL > 4 && prazoDHL < 10
          ? prazoDHL - 2
          : prazoDHL > 11 && prazoDHL < 17
          ? prazoDHL - 4
          : prazoDHL > 18
          ? prazoDHL - 6
          : prazoDHL

      return prazoDHL === 0 ? 1 : prazoDHL
    } else {
      return 'erro'
    }
  }

  static verificarFeriado = async () => {
    const hoje = new Date()
    hoje.setDate(hoje.getDate() + ((1 + 7 - hoje.getDay()) % 7))

    const anoAtual = hoje.getFullYear()

    let shpDate_ = hoje.toISOString().substring(0, 10)
    let arrDateFeriado = shpDate_.split('-')
    let dateFeriado = `${arrDateFeriado[2]}/${arrDateFeriado[1]}/${arrDateFeriado[0]}`

    //FETCH CALENDAR FOR YEAR
    let res2 = await axios.get(
      `https://api.calendario.com.br/?json=true&ano=${anoAtual}&token=${process.env.FERIADO_API_KEY}`
    )

    let res3 = res2.data.filter((dia) => dia.date === dateFeriado)[0]

    //IF HOLIDAY, RETURNS NEXT MONDAY
    if (res3 === undefined) {
      return shpDate_
    } else {
      let res4 = res3.type.split(' ')[0]
      if (res4 === 'Feriado' || res4 === 'Facultativo') {
        hoje.setDate(hoje.getDate() + 1)
        hoje.setDate(hoje.getDate() + ((1 + 7 - hoje.getDay()) % 7))
        let shpDate_ = hoje.toISOString().substring(0, 10)
        return shpDate_
      } else return shpDate_
    }
  }
}

module.exports = CalcDHL
