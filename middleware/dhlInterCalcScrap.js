const puppeteer = require('puppeteer')

const dhlInternacionalScrap = (origem, destino, objetos) => new Promise(async (resolve, reject) => {
    const browser = await puppeteer.launch({ headless: true })
    const page = await browser.newPage()

    await page.exposeFunction('calculateDHL', async (data) => {
        await browser.close()
        resolve(data)
    })

    await page.goto('https://dct.dhl.com/', {
        waitUntil: 'networkidle2',
    })

    await page.evaluate(async (origem, destino) => {

        const updatePieceInfoOld = updatePieceInfo
        updatePieceInfo = (...params) => {
            const result = updatePieceInfoOld(...params)
            let data = null
            console.log(params)
            if (params[0].errorMessage != null) {
                data = {
                    error: params[0].errorMessage
                }
            }
            else {
                data = params[0].quotationList.quotation.map(quotation => ({
                    produto: quotation.prodNm,
                    prazo: new Date(quotation.estDeliv.split(', ')[1]),
                    preco: Number(quotation.estTotPrice.replace('BRL', ''))
                }))
            }
            calculateDHL(data)
            return result
        }

        const paisOrigemInput = document.querySelector("[name='orgCtry']")
        paisOrigemInput.value = origem.pais

        const cidadeOrigemInput = document.querySelector("[name='orgCity']")
        cidadeOrigemInput.value = origem.cidade

        const paisDestinoInput = document.querySelector("[name='dstCtry']")
        paisDestinoInput.value = destino.pais

        const cidadeDestinoInput = document.querySelector("[name='dstCity']")
        cidadeDestinoInput.value = destino.cidade

        const quantidadeObjetos = document.querySelector("[name='number_of_pieces']")
        quantidadeObjetos.value = ''

    }, origem, destino)

    await page.type("[name='number_of_pieces']", objetos.length.toString())

    await page.$eval("[name='number_of_pieces']", e => e.blur())

    await page.evaluate(async (objetos) => {

        objetos.forEach((objeto, index) => {
            const pesoInput = document.querySelector(`tr#piece_${index} input[name='weight']`)
            pesoInput.value = objeto.peso

            const comprimentoInput = document.querySelector(`tr#piece_${index} input[name='length']`)
            comprimentoInput.value = objeto.comprimento

            const larguraInput = document.querySelector(`tr#piece_${index} input[name='width']`)
            larguraInput.value = objeto.largura

            const alturaInput = document.querySelector(`tr#piece_${index} input[name='height']`)
            alturaInput.value = objeto.altura
        })        

        onCalculate()

    }, objetos)

})

module.exports = dhlInternacionalScrap