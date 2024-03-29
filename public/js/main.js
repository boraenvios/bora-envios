const $q = document.querySelector.bind(document),
  $a = document.querySelectorAll.bind(document)

const baseURL = `${location.protocol}//${location.hostname}:${location.port}`,
  dhlAPI = '/dhl/nac',
  correiosAPI = '/correios',
  dhlInterAPI = '/dhl/inter',
  upsAPI = '/ups/inter',
  upsNacAPI = '/ups/nac',
  fedexAPI = '/fedex/inter',
  listaPaisesEnd = '/js/codigopaises.json',
  citySearchAPI = '/citysearch'

const ctryInput = $q('#dest-country'),
  ctryInputIcon = $q('#country-ok'),
  cityInput = $q('#dest-city'),
  cityInputWrapper = $q('#dest-city_wrapper'),
  citySpinner = $q('#city-spinner'),
  cityInputOkIcon = $q('#city-ok'),
  cityInputErrorIcon = $q('#city-error'),
  selectorNac = $q('#select-nacional'),
  selectorInt = $q('#select-inter'),
  containerNac = $q('#box-nacional'),
  containerInt = $q('#box-inter'),
  resultsContainer = $q('#results'),
  resultsNac = $q('#results-nac'),
  resultsInt = $q('#results-inter'),
  paisesDataList = $q('#paises'),
  dimensionRowNac = $q('#nac-dims'),
  dimensionRowInt = $q('#inter-dims'),
  cepDstInput = $q('#dstCep'),
  cepOrgInput = $q('#orgCep'),
  orgNacInput = $q('#org-nac'),
  dstNacInput = $q('#dst-nac'),
  btnNacional = $q('#calcular'),
  btnInter = $q('#calcularinter'),
  postalCodeInput = $q('#postalCode'),
  mainSpinner = $q('#spinner'),
  countryFlag = $q('#flag'),
  navToggle = $q('#nav-toggle'),
  navbar = $q('#navbar'),
  navbarOverlay = $q('#nav-overlay')

const loadMainListeners = () => {
  btnNacional.addEventListener('click', calcularNacional)
  btnInter.addEventListener('click', calcularInter)

  containerInt.addEventListener('click', (e) => {
    if (e.target.nodeName === 'BUTTON') return
    $q('.alert-element')?.remove()
  })

  containerNac.addEventListener('click', (e) => {
    if (e.target.nodeName === 'BUTTON') return
    $q('.alert-element')?.remove()
  })

  dimensionRowNac.addEventListener('click', manageRows)
  dimensionRowInt.addEventListener('click', manageRows)

  selectorNac.addEventListener('click', changeCalc)
  selectorInt.addEventListener('click', changeCalc)

  ctryInput.addEventListener('input', countriesInput)
  ctryInput.addEventListener('click', clearFields)

  cityInput.addEventListener('input', debounce(citySpinnerToggle, 600))
  cityInput.addEventListener('input', debounce(citiesInput, 1000))
  cityInput.addEventListener('click', clearCityField)

  cepOrgInput.addEventListener('keyup', buscaCep)
  cepDstInput.addEventListener('keyup', buscaCep)

  $a('.navbar-contact').forEach((item) =>
    item.addEventListener('click', () => {
      window.open(
        `https://api.whatsapp.com/send?phone=5511913640105&text=Olá, estou entrando em contato pelo site da Bora Envios. Poderia me ajudar?`,
        '_blank'
      )
    })
  )

  navToggle.addEventListener('click', () => {
    toggleNavbar()
  })

  navbarOverlay.addEventListener('touchstart', (e) => {
    navbar.classList.replace('right-0', '-right-full')
    navbarOverlay.classList.replace('left-0', '-left-full')
  })

  navbarOverlay.addEventListener('click', (e) => {
    navbar.classList.replace('right-0', '-right-full')
    navbarOverlay.classList.replace('left-0', '-left-full')
  })

  $a('.nav-item').forEach((item) =>
    item.addEventListener('click', (e) => {
      toggleNavbar(navbar)
    })
  )
}

const toggleNavbar = () => {
  if (navbar.classList.contains('right-0')) {
    navbar.classList.replace('right-0', '-right-full')
    navbarOverlay.classList.replace('left-0', '-left-full')
  } else if (navbar.classList.contains('-right-full')) {
    navbar.classList.replace('-right-full', 'right-0')
    navbarOverlay.classList.replace('-left-full', 'left-0')
  }
}

// Data Handlers
const obterPesoTotal = (x) => {
  const P = Array.from($a(`.peso${x}`)).map((e) =>
      Number(e.value.replace(',', '.'))
    ),
    A = Array.from($a(`.alt${x}`)).map((e) =>
      Number(e.value.replace(',', '.'))
    ),
    L = Array.from($a(`.larg${x}`)).map((e) =>
      Number(e.value.replace(',', '.'))
    ),
    C = Array.from($a(`.comp${x}`)).map((e) =>
      Number(e.value.replace(',', '.'))
    )

  const pacotes = P.map((p, index) => ({
    peso: p,
    altura: A[index],
    largura: L[index],
    comprimento: C[index]
  }))

  const errorSign = ' - '
  if (
    P.includes('') ||
    A.includes('') ||
    L.includes('') ||
    C.includes('') ||
    P.includes(0) ||
    A.includes(0) ||
    L.includes(0) ||
    C.includes(0) ||
    P.length === 0 ||
    A.length === 0 ||
    L.length === 0 ||
    C.length === 0
  )
    return errorSign

  const arrPesos = []
  for (let i = 0; i < P.length; i++) {
    let pesoDim = (C[i] * L[i] * A[i]) / 5000,
      pesoReal = P[i]

    if (pesoDim > pesoReal) {
      arrPesos[i] = Math.ceil(pesoDim)
    } else {
      arrPesos[i] = Math.ceil(pesoReal)
    }
  }
  const pesoTotal = arrPesos.reduce((acc, cur) => acc + cur)

  let excedPeso = 0,
    excedMedidas = 0
  for (let i = 0; i < P.length; i++) {
    if (P[i] > 70) excedPeso += 1
    else {
      if (C[i] > 120 || L[i] > 120 || A[i] > 120) excedMedidas += 1
    }
  }

  const output = {
    PesoTotal: pesoTotal,
    ExcedPeso: excedPeso,
    ExcedMedidas: excedMedidas,
    ArrPesos: arrPesos,
    pacotes
  }
  return output
}

const sendWhatsapp = (elementClass, preferred) => {
  let x = []
  let y = []
  let z = []

  $a(elementClass).forEach((element) =>
    x.push(Array.from(element.firstElementChild.lastElementChild.children))
  )

  x.forEach((e) => e.forEach((l) => y.push(l.innerText)))

  for (let i = 0; i < y.length / 3; i++) {
    let j = (i + 1) * 3
    z.push(`${y[j - 3]} ${y[j - 2]} ${y[j - 1]}`)
  }

  let string = ''

  if (elementClass === '.box-cotacao-inter') {
    const wppCountry = ctryInput.value
    const wppCity = cityInput.value

    const wppDims = []
    const wpppesos = Array.from($a('.pesoi')).map((e) => e.value)
    const wppcomps = Array.from($a('.compi')).map((e) => e.value)
    const wppalts = Array.from($a('.alti')).map((e) => e.value)
    const wpplargs = Array.from($a('.largi')).map((e) => e.value)

    for (let i = 0; i < wpppesos.length; i++) {
      const str = `Pacote ${i + 1}:%0aPeso: *${
        wpppesos[i]
      }kgs*%0aComprimento: *${wppcomps[i]}cm*%0aLargura: *${
        wpplargs[i]
      }cm*%0aAltura: *${wppalts[i]}cm*%0a`
      wppDims.push(str)
    }

    string = `Olá, tudo bem?%0a%0aFiz uma cotação no site da Bora Envios e gostaria de atendimento. Seguem as informações do meu pedido:%0a%0aPaís de destino: *${wppCountry}*%0aCidade de destino: *${wppCity}*%0a%0aDimensões:%0a%0a${wppDims.join(
      '%0a%0a'
    )}%0aServiço Preferido: *${preferred}*%0a%0aServiços disponíveis:%0a${z.join(
      '%0a'
    )}`
  } else if (elementClass === '.box-cotacao-nac') {
    const wppCepOrg = cepOrgInput.value
    const wppCepDst = cepDstInput.value
    const wppCidOrg = orgNacInput.value
    const wppCidDst = dstNacInput.value

    const wppDims = []

    const wpppesos = Array.from($a('.peso')).map((e) => e.value)
    const wppcomps = Array.from($a('.comp')).map((e) => e.value)
    const wppalts = Array.from($a('.alt')).map((e) => e.value)
    const wpplargs = Array.from($a('.larg')).map((e) => e.value)

    for (let i = 0; i < wpppesos.length; i++) {
      const str = `Pacote ${i + 1}:%0aPeso: *${
        wpppesos[i]
      }kgs*%0aComprimento: *${wppcomps[i]}cm*%0aLargura: *${
        wpplargs[i]
      }cm*%0aAltura: *${wppalts[i]}cm*%0a`
      wppDims.push(str)
    }

    string = `Olá, tudo bem?%0a%0aFiz uma cotação no site da Bora Envios e gostaria de atendimento. Seguem as informações do meu pedido:%0a%0aCep de origem: *${wppCepOrg}*%0aCidade de origem: *${wppCidOrg}*%0a%0aCep de destino: *${wppCepDst}*%0aCidade de destino: *${wppCidDst}*%0a%0aDimensões:%0a%0a${wppDims.join(
      '%0a%0a'
    )}%0aServiço Preferido: *${preferred}*%0a%0aServiços disponíveis:%0a${z.join(
      '%0a'
    )}`
  }

  const is_mobile =
    navigator.userAgent.match(/Android/i) ||
    navigator.userAgent.match(/iPhone/i) ||
    navigator.userAgent.match(/BlackBerry/i)

  if (is_mobile)
    window.open(
      `https://api.whatsapp.com/send?phone=5511913640105&text=${string}`,
      '_blank'
    )
  else
    window.open(
      `https://web.whatsapp.com/send?phone=5511913640105&text=${string}`,
      '_blank'
    )
}

const setWhatsappListener = (btnClass, elementClass) => {
  $a(btnClass).forEach((e) =>
    e.addEventListener('click', (e) => {
      const preferred =
        e.target.previousElementSibling.lastElementChild.firstElementChild
          .innerText
      e.preventDefault()
      sendWhatsapp(elementClass, preferred)
    })
  )
}

// Utilities
const changeElement = (option, element) => {
  switch (option) {
    case 'show':
      element.classList.remove('hidden')
      break
    case 'hide':
      element.classList.add('hidden')
      break
    case 'toggle':
      element.classList.contains('hidden')
        ? element.classList.remove('hidden')
        : element.classList.add('hidden')
      break
  }
}

const debounce = (callback, delay) => {
  let timeout
  return function () {
    clearTimeout(timeout)
    timeout = setTimeout(callback, delay)
  }
}

Object.prototype.isEmpty = () => {
  for (let key in this) {
    if (this.hasOwnProperty(key)) return false
  }
  return true
}

//Calculate
const calcularInter = async () => {
  const dimValues = obterPesoTotal('i')
  if (cityInput.value === '' || ctryInput.value === '' || dimValues === ' - ') {
    createAlert('Preencha todos os campos!', containerInt)
    console.log('preencha')
    return
  }

  changeElement('toggle', mainSpinner)
  changeElement('hide', resultsInt)
  clearResults('inter')

  const pesoCons = dimValues.PesoTotal
  const city = cityInput.value
      .split(',')[0]
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, ''),
    country = ctryInput.value.split(',')[1].substring(1)

  let postalCode = postalCodeInput.value.replace(' ', '')
  console.log(postalCode)

  //DHL
  const dhlURL = `${baseURL}${dhlInterAPI}`
  console.log(dhlURL)
  const dhlParams = {
    postalCode: postalCode,
    dstcty: city,
    dstctr: country,
    peso_cons: pesoCons,
  }
  try {
    const dhlInterQuote = await axios.get(dhlURL, { params: dhlParams })
    console.log(dhlInterQuote.data)
    generateResults(dhlInterQuote.data)
  } catch (e) {
    console.log('UPS Indisponível')
  }

  //FEDEX
  const fedexURL = `${baseURL}${fedexAPI}`
  const fedexParams = {
    postalCode: postalCode,
    dstcty: city,
    dstctr: country,
    peso_cons: pesoCons,
  }
  try {
    const fedexQuote = await axios.get(fedexURL, { params: fedexParams })
    console.log(fedexQuote.data)
    generateResults(fedexQuote.data)
  } catch (e) {
    console.log('FEDEX Indisponível')
  }

  //UPS
  const upsUrl = `${baseURL}${upsAPI}`
  const upsParams = {
    postcode: postalCode,
    city: city,
    ctry: country,
    peso: pesoCons,
  }
  try {
    const upsInterQuote = await axios.get(upsUrl, { params: upsParams })
    generateResults(upsInterQuote.data)
  } catch (e) {
    console.log('DHL Indisponível')
  }

  setWhatsappListener('.wpp-int', '.box-cotacao-inter')
  changeElement('toggle', mainSpinner)
  changeElement('show', resultsInt)
  resultsInt.scrollIntoView()
}

const calcularNacional = async () => {
  const cidadeOrigem = orgNacInput.value
      .toUpperCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, ''),
    cidadeDestino = dstNacInput.value
      .toUpperCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')

  const dimValues = obterPesoTotal('')

  const peso_cons = dimValues.PesoTotal
  const excedMed = dimValues.ExcedMedidas
  const excedPeso = dimValues.ExcedPeso
  const arrPesos = dimValues.ArrPesos

  const dataDHL = [cidadeOrigem, cidadeDestino, dimValues]

  if (dataDHL.includes(' - ')) {
    createAlert('Preencha todos os campos!', containerNac)
    return
  }

  const start = () => {
    changeElement('toggle', mainSpinner)
    clearResults('nac')
    changeElement('hide', resultsNac)
  }
  const dhlNac = async () => {
    const dhlNacUrl = `${baseURL}${dhlAPI}`
    const dhlNacParams = {
      orgcty: cidadeOrigem,
      dstcty: cidadeDestino,
      peso_cons: peso_cons,
      orgcep: cepOrgInput.value.replace("-", ''),
      dstcep: cepDstInput.value.replace("-", ''),
      orgctr: 'BR',
      dstctr: 'BR',
      excedmed: excedMed,
      excedpeso: excedPeso,
      pacotes: dimValues.pacotes
    }

    try {
      const dhlQuote = await axios.get(dhlNacUrl, { params: dhlNacParams })
      if (!dhlQuote.data.erro) {
        generateResults(dhlQuote.data)
      } else {
        const msg = dhlQuote.data.erro.type == 'origem-cep-error' ? 'CEP de origem' : 'CEP de destino'
        Swal.fire({
          icon: 'error',
          title: 'DHL Nacional',
          html: `O <b>${msg}</b> que você inseriu não aparece em nosso banco de dados. Tente novamente usando um CEP válido ou continue para obter uma cotação.`,
        })     
      }
    } catch (error) {
      console.log(error)
    }
  }

  const upsNac = async () => {
    const upsUrl = `${baseURL}${upsNacAPI}`
    const upsNacParams = {
      orgPostalCode: cepOrgInput.value,
      dstPostalCode: cepDstInput.value,
      pesoCons: peso_cons,
    }

    try {
      const upsNacQuote = await axios.get(upsUrl, { params: upsNacParams })
      generateResults(upsNacQuote.data)
    } catch (e) {
      console.log('UPS Nacional indisponível')
    }
  }

  const correiosNac = async () => {
    const correiosUrl = `${baseURL}${correiosAPI}`
    const correiosBody = {
      orgCep: cepOrgInput.value,
      dstCep: cepDstInput.value,
      pesoCons: arrPesos,
    }

    try {
      const correiosQuote = await axios.post(correiosUrl, correiosBody)
      generateResults(correiosQuote.data)
    } catch (e) {
      console.log('Correios indisponível')
    }
  }

  const finish = () => {
    changeElement('show', resultsNac)
    setWhatsappListener('.wpp-nac', '.box-cotacao-nac')
    changeElement('toggle', mainSpinner)
    resultsNac.scrollIntoView()
  }

  start()
  //await correiosNac()
  await dhlNac()
  //await upsNac()
  finish()
}

//UI Interaction
const changeCalc = (e) => {
  e.preventDefault()
  if (e.target.id == 'select-nacional') {
    changeElement('show', containerNac)
    changeElement('hide', containerInt)
    changeElement('show', resultsNac)
    changeElement('hide', resultsInt)
    selectorNac.classList.add('bg-secondary', 'text-white')
    selectorInt.classList.remove('bg-secondary', 'text-white')
  } else {
    changeElement('hide', containerNac)
    changeElement('show', containerInt)
    changeElement('hide', resultsNac)
    changeElement('show', resultsInt)
    selectorNac.classList.remove('bg-secondary', 'text-white')
    selectorInt.classList.add('bg-secondary', 'text-white')
  }
}

const manageRows = (e) => {
  const pElm = e.target.parentElement
  const dimContainer = pElm.parentElement?.parentElement

  const newRow = document.createElement('div')
  newRow.classList = 'mt-2 text-center grid grid-cols-dim gap-2'

  let x = ''

  if (dimContainer.id === 'inter-dims') x = 'i'

  newRow.innerHTML = `<input type="text" class="ka-input peso${x}" placeholder="kg" />
  <input type="text" class="ka-input alt${x}" placeholder="cm" />
  <input type="text" class="ka-input larg${x}" placeholder="cm" />
  <input type="text" class="ka-input comp${x}" placeholder="cm" />
  <a href="#" class="remove-row flex justify-center items-center"
    ><i class="fas fa-minus-circle"></i
  ></a>`

  if (pElm.classList.contains('remove-row')) {
    pElm.parentElement.remove()
  } else if (pElm.classList.contains('add-row')) {
    dimContainer.appendChild(newRow)
  }
}

const clearCityField = () => {
  cityInput.value = ''
  citySpinnerToggle()
}

const clearFields = () => {
  ctryInput.value = ''
  cityInput.value = ''
  countryFlag.className = ''
  changeElement('hide', cityInputWrapper)
  changeElement('hide', ctryInputIcon)
  changeElement('hide', cityInputWrapper)
}

const citySpinnerToggle = (cmd) => {
  if (cmd === 'off') {
    changeElement('hide', citySpinner)
  } else {
    if (cityInput.value !== '') {
      changeElement('show', citySpinner)
      changeElement('hide', cityInputErrorIcon)
      changeElement('hide', cityInputOkIcon)
    } else {
      changeElement('hide', citySpinner)
      changeElement('hide', cityInputOkIcon)
      changeElement('hide', cityInputErrorIcon)
    }
  }
}

//Output Handlers
const generateResults = (quote) => {
  const appendResText = (type, element) => {
    if ($q(`.result-text-${type}`) === null) {
      const resDiv = document.createElement('div')
      resDiv.classList = 'md:col-span-2'

      const resText = document.createElement('h1')
      resText.classList = `result-text-${type} text-4xl font-semibold py-3 text-center text-white mt-16 self-center`
      resText.innerText = 'Serviços disponíveis:'

      const resText2 = document.createElement('h1')
      resText2.classList = `result-text-${type} text-md font-semibold text-center text-white self-center`
      resText2.innerText = '* Prazos estimados'

      resDiv.append(resText)
      resDiv.append(resText2)
      element.prepend(resDiv)
    }
  }

  const genDiv = (icon, svcName, value, time, erro = false) => {
    const str = /Nacional/
    const resultDiv = document.createElement('div')
    resultDiv.className = `${
      str.test(svcName) ? 'box-cotacao-nac' : 'box-cotacao-inter'
    }`
    resultDiv.classList.add(
      'p-3.5',
      'border',
      'rounded',
      'shadow-md',
      'flex-col',
      'md:min-w-full',
      'bg-white'
    )

    resultDiv.innerHTML = `<div class="grid grid-cols-2/3">
      <div class="flex items-center justify-center"><img src="./assets/${icon}-logo.png" style="height: ${
      icon === 'ups' || icon === 'correios'
        ? '72px'
        : icon === 'fedex'
        ? '30px'
        : 'auto'
    }; width: auto" ></img></div>
      <div class="pl-3 grid grid-rows-3">
        <p class="font-bold">${svcName}</p>
        <p>${value}</p>
        <p>${time} ${time < 2 ? 'dia útil' : 'dias úteis'}</p>
      </div>
      </div>
      <button class="${
        str.test(svcName) ? 'btn wpp-nac' : 'btn wpp-int'
      } mt-3 text-white bg-primary p-2 rounded w-full hover:bg-seconday hover:text-white">Solicitar</button>`
    return resultDiv
  }

  switch (quote.service) {
    case 'dhl':
      quote.produtos.forEach(produto => {
        resultsInt.appendChild(
          genDiv('dhl', produto.produto, produto.valor, produto.prazo)
        )
        appendResText('int', resultsInt)
      })
      break

    case 'ups':
      if (quote.saver.valor)
        resultsInt.appendChild(
          genDiv('ups', 'UPS Express', quote.saver.valor, quote.saver.prazo)
        )

      if (quote.expedited.valor)
        resultsInt.appendChild(
          genDiv(
            'ups',
            'UPS Expedited',
            quote.expedited.valor,
            quote.expedited.prazo
          )
        )
      appendResText('int', resultsInt)
      break

    case 'ups-nacional':
      if (quote.saver.valor) {
        resultsNac.appendChild(
          genDiv('ups', 'UPS Nacional', quote.saver.valor, quote.saver.prazo)
        )
        appendResText('nac', resultsNac)
      }
      break

    case 'dhl-nacional':
      resultsNac.appendChild(
        genDiv('dhl', 'DHL Nacional', quote.valor, quote.prazo)
      )
      appendResText('nac', resultsNac)
      break

    case 'correios':
      resultsNac.appendChild(
        genDiv('correios', 'Correios Nacional', quote.valor, quote.prazo)
      )
      appendResText('nac', resultsNac)
      break

    case 'fedex':
      quote.produtos.forEach(produto => {
        resultsInt.appendChild(
          genDiv('fedex', produto.produto, produto.valor, produto.prazo)
        )
        appendResText('int', resultsInt)
      })
      break
    default:
      return console.log('nothing')
  }
}

const clearResults = (c) => {
  const resultsHTML = document.querySelectorAll(`.box-cotacao-${c}`)
  resultsHTML.forEach((v) => v.remove())
}

const createAlert = (msg, element) => {
  if (element.lastElementChild.classList.contains('alert-element')) {
    return
  }

  const resultDiv = document.createElement('div')
  resultDiv.className = 'alert-element text-center text-red-700 pt-3'
  resultDiv.innerHTML = `
  <div>
  <span>${msg}</span>
  </div>`

  element.append(resultDiv)
}

//Field Queries
const countriesInput = async () => {
  clearCityField()

  const arr = ctryInput.value.split(',')
  if (arr.length > 1) {
    countryFlag.classList.add(
      'flag',
      `flag-${arr[1].toLowerCase().substring(1)}`
    )
    changeElement('show', ctryInputIcon)
    changeElement('show', cityInputWrapper)
  }
}

const citiesInput = async () => {
  const citySearchUrl = `${baseURL}${citySearchAPI}`

  const citySearchParams = {
    city: cityInput.value.normalize('NFD').replace(/\p{Diacritic}/gu, ''),
    country: ctryInput.value.split(',')[1].substring(1),
    lang: 'en',
  }

  if (cityInput.value !== '') {
    const res = await axios.get(citySearchUrl, { params: citySearchParams })
    const address = res.data.address

    if (address === 'err' || address === undefined) {
      citySpinnerToggle('off')
      changeElement('show', cityInputErrorIcon)
    } else {
      const { label, postalCode } = address

      if (!citySpinner.classList.contains('hidden')) {
        postalCodeInput.value = postalCode

        const laberArr = label.split(',')
        laberArr.pop()
        cityInput.value = laberArr.join(', ')

        citySpinnerToggle('off')
        changeElement('show', cityInputOkIcon)
      }
    }
  }
}

const buscaCep = async (e) => {
  let cep = e.target.value
  const rowElm = e.target.nextElementSibling,
    errorIcon = e.target.nextElementSibling.nextElementSibling

  const limpaCep = () => {
    rowElm.value = ''
    changeElement('hide', rowElm)
    changeElement('hide', errorIcon)
  }

  cep = cep.replace(/\D/g, '')

  if (cep === '') return limpaCep()

  const validacep = /^[0-9]{8,10}$/

  if (!validacep.test(cep)) {
    limpaCep()
    return
  }

  try {
    const res1 = await fetch('https://viacep.com.br/ws/' + cep + '/json/')
    const res2 = await res1.json()

    if ('erro' in res2) {
      limpaCep()
      changeElement('show', errorIcon)
      return
    }
    changeElement('hide', errorIcon)
    changeElement('show', rowElm)
    rowElm.value = `${res2.localidade} - ${res2.uf}`
  } catch (error) {
    limpaCep()
    changeElement('show', errorIcon)
    return
  }
}

// Page Preparation
;(async () => {
  const res = await fetch(baseURL + listaPaisesEnd)
  const res2 = await res.json()

  const frag = document.createDocumentFragment()
  res2.forEach((v) => {
    const option = document.createElement('option')
    option.innerText = `${v.country}, ${v.ISO2}`
    frag.appendChild(option)
  })
  paisesDataList.appendChild(frag)
})()

clearFields()
loadMainListeners()
