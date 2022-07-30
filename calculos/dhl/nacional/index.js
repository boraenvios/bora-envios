const { readFileSync } = require('fs')
require('data-forge-fs')
const dataForge = require('data-forge')

const { resolve } = require('path')

const getCidade = (cep) => {
    const cidades = dataForge.readFileSync(resolve(__dirname, 'dados', 'cidades.json')).parseJSON()
    const check = cidades
        .where(row => row.CEP == cep)
        .toArray()
    return check.length == 0 ? null : check[0]
}

const getZona = (cepOrigem, cepDestino) => {

}

const calc = (input) => {    
    input.seguro = false
    input.valor_segurado = 0
    input.remetente_destinatario_pj_contribui_icms = false
    input.com_comissao = true
    input.taxa_combustivel = 10
    const cidades = dataForge.readFileSync(resolve(__dirname, 'dados', 'cidades.json')).parseJSON()
    const taxas = JSON.parse(readFileSync(resolve(__dirname, 'dados', 'taxas.json')).toString())

    const cidadeOrigem = cidades
        .where(row => row.CEP == input.cidade.origem)
        .toArray()[0]
    const cidadeDestino = cidades
        .where(row => row.CEP == input.cidade.destino)
        .toArray()[0]

    const pacotes = new dataForge.DataFrame(input.pacotes)
        .select(row => {
            const { comprimento, altura, largura, peso } = row
            const peso_dimensional = (comprimento * altura * largura) / 5000
            const peso_considerado = peso_dimensional > peso ? peso_dimensional : peso
            const sobrepeso = peso_considerado > 70
            const media_excedente = sobrepeso 
                ? false 
                : (
                    (comprimento > 120 || altura > 120 || largura > 120)
                        ? true
                        : false
                ) 
            return {
                ...row,
                peso_dimensional,
                peso_considerado,
                sobrepeso,
                media_excedente
            }
        })
    const totalPacotes = {
        peso: pacotes.aggregate(
            0,
            (accumulator, row) => accumulator + row.peso
        ),
        peso_dimensional: pacotes.aggregate(
            0,
            (accumulator, row) => accumulator + row.peso_dimensional
        ),
        peso_considerado: pacotes.aggregate(
            0,
            (accumulator, row) => accumulator + row.peso_considerado
        ),
        sobrepeso: pacotes.where(row => row.sobrepeso).toArray().length,
        medida_excedente: pacotes.where(row => row.medida_excedente).toArray().length
    }

    const lane_zona = dataForge.readFileSync(resolve(__dirname, 'dados', 'lane_zona.json')).parseJSON()

    const calculado = {
        origem: {
            uf: cidadeOrigem.UF,
            aeroporto: cidadeOrigem.aeroporto,
            lane: cidadeOrigem.aeroporto + cidadeDestino.aeroporto,
            area_remota: false
        },
        destino: {
            uf: cidadeDestino.UF,
            aeroporto: cidadeDestino.aeroporto,
            lane: cidadeOrigem.UF + cidadeDestino.UF,
            area_remota: cidadeDestino.area_remota == "Sim"
        }
    }

    calculado.origem.valor = calculado.origem.area_remota ? taxas.area_remota : 0
    calculado.destino.valor = calculado.destino.area_remota ? taxas.area_remota : 0

    calculado.zona = lane_zona.where(row => row.lane == calculado.origem.lane).toArray()[0].zona

    const frete_com_comissao = dataForge.readFileSync(resolve(__dirname, 'dados', 'frete_com_comissao.json')).parseJSON()
    const frete_sem_comissao = dataForge.readFileSync(resolve(__dirname, 'dados', 'frete_sem_comissao.json')).parseJSON()

    const tabela_frete = input.com_comissao ? frete_com_comissao : frete_sem_comissao

    calculado.frete1kg = tabela_frete.where(row => row.zona == calculado.zona).toArray()[0].frete1kg
    calculado.addkg = tabela_frete.where(row => row.zona == calculado.zona).toArray()[0].addkg

    calculado.seguro = {
        frete_sem_imposto: input.seguro 
            ? (
                (input.valor_segurado / 100) * taxas.seguro_pct > taxas.seguro_valor
                    ? (input.valor_segurado / 100) * taxas.seguro_pct
                    : taxas.seguro_valor
            )
            : 0 
    }

    //calculado.destino.lane 
    const lane_iss = dataForge.readFileSync(resolve(__dirname, 'dados', 'lane_iss.json')).parseJSON()
    const lane_taxa = dataForge.readFileSync(resolve(__dirname, 'dados', 'lane_taxa.json')).parseJSON()

    calculado.seguro.valor = cidadeOrigem.CEP == cidadeDestino.CEP
        ? Number((calculado.seguro.frete_sem_imposto / lane_iss.where(row => row.lane == calculado.destino.lane ).toArray()[0].iss).toFixed(2))
        : (
            input.remetente_destinatario_pj_contribui_icms
                ? Number((calculado.seguro.frete_sem_imposto / lane_taxa.where(row => row.lane == calculado.destino.lane ).toArray()[0].taxa_contribuinte).toFixed(2))
                : Number((calculado.seguro.frete_sem_imposto / lane_taxa.where(row => row.lane == calculado.destino.lane ).toArray()[0].taxa_nao_contribuinte).toFixed(2))
        )

    calculado.sobrepeso = {
        manuseio: totalPacotes.sobrepeso > 0
    }
    calculado.sobrepeso.frete_sem_imposto = Number(((calculado.sobrepeso.manuseio ? taxas.manuseio_sobrepeso : 0) * totalPacotes.sobrepeso).toFixed(2))
    calculado.sobrepeso.valor = cidadeOrigem.CEP == cidadeDestino.CEP
        ? Number((calculado.sobrepeso.frete_sem_imposto / lane_iss.where(row => row.lane == calculado.destino.lane ).toArray()[0].iss).toFixed(2))
        : (
            input.remetente_destinatario_pj_contribui_icms
                ? Number((calculado.sobrepeso.frete_sem_imposto / lane_taxa.where(row => row.lane == calculado.destino.lane ).toArray()[0].taxa_contribuinte).toFixed(2))
                : Number((calculado.sobrepeso.frete_sem_imposto / lane_taxa.where(row => row.lane == calculado.destino.lane ).toArray()[0].taxa_nao_contribuinte).toFixed(2))
        )

    calculado.medida_excedente = {
        manuseio: totalPacotes.medida_excedente > 0
    }
    calculado.medida_excedente.frete_sem_imposto = Number(((calculado.medida_excedente.manuseio ? taxas.manuseio_media_excedente : 0) * totalPacotes.medida_excedente).toFixed(2))
    calculado.medida_excedente.valor = cidadeOrigem.CEP == cidadeDestino.CEP
        ? Number((calculado.medida_excedente.frete_sem_imposto / lane_iss.where(row => row.lane == calculado.destino.lane ).toArray()[0].iss).toFixed(2))
        : (
            input.remetente_destinatario_pj_contribui_icms
                ? Number((calculado.medida_excedente.frete_sem_imposto / lane_taxa.where(row => row.lane == calculado.destino.lane ).toArray()[0].taxa_contribuinte).toFixed(2))
                : Number((calculado.medida_excedente.frete_sem_imposto / lane_taxa.where(row => row.lane == calculado.destino.lane ).toArray()[0].taxa_nao_contribuinte).toFixed(2))
        )
    
    calculado.area_remota = {
        frete_sem_imposto: calculado.origem.valor + calculado.destino.valor
    }
    calculado.area_remota.valor = cidadeOrigem.CEP == cidadeDestino.CEP
        ? Number((calculado.area_remota.frete_sem_imposto / lane_iss.where(row => row.lane == calculado.destino.lane ).toArray()[0].iss).toFixed(2))
        : (
            input.remetente_destinatario_pj_contribui_icms
                ? Number((calculado.area_remota.frete_sem_imposto / lane_taxa.where(row => row.lane == calculado.destino.lane ).toArray()[0].taxa_contribuinte).toFixed(2))
                : Number((calculado.area_remota.frete_sem_imposto / lane_taxa.where(row => row.lane == calculado.destino.lane ).toArray()[0].taxa_nao_contribuinte).toFixed(2))
        )
    calculado.area_remota.status = !(calculado.area_remota.valor == 0)

    calculado.combustivel = {
        frete_sem_imposto: Number((((calculado.sobrepeso.valor + calculado.medida_excedente.valor + calculado.area_remota.valor) / 100) * input.taxa_combustivel).toFixed(2))
    }

    calculado.combustivel.valor = cidadeOrigem.CEP == cidadeDestino.CEP
        ? Number((calculado.combustivel.frete_sem_imposto / lane_iss.where(row => row.lane == calculado.destino.lane ).toArray()[0].iss).toFixed(2))
        : (
            input.remetente_destinatario_pj_contribui_icms
                ? Number((calculado.combustivel.frete_sem_imposto / lane_taxa.where(row => row.lane == calculado.destino.lane ).toArray()[0].taxa_contribuinte).toFixed(2))
                : Number((calculado.combustivel.frete_sem_imposto / lane_taxa.where(row => row.lane == calculado.destino.lane ).toArray()[0].taxa_nao_contribuinte).toFixed(2))
        )

    calculado.frete_nacional = {
        frete_sem_imposto: calculado.frete1kg + (totalPacotes.peso_considerado - 1) * calculado.addkg
    }
    calculado.frete_nacional.valor = totalPacotes.peso_considerado == 0
        ? 0
        : (
            cidadeOrigem.CEP == cidadeDestino.CEP
                ? Number((calculado.frete_nacional.frete_sem_imposto / lane_iss.where(row => row.lane == calculado.destino.lane ).toArray()[0].iss).toFixed(2))
                : (
                    input.remetente_destinatario_pj_contribui_icms
                        ? Number((calculado.frete_nacional.frete_sem_imposto / lane_taxa.where(row => row.lane == calculado.destino.lane ).toArray()[0].taxa_contribuinte).toFixed(2))
                        : Number((calculado.frete_nacional.frete_sem_imposto / lane_taxa.where(row => row.lane == calculado.destino.lane ).toArray()[0].taxa_nao_contribuinte).toFixed(2))
                )
        )

    calculado.combustivel_frete = {
        frete_sem_imposto: Number(((calculado.frete_nacional.frete_sem_imposto / 100) * input.taxa_combustivel).toFixed(2))
    }
    calculado.combustivel_frete.valor = totalPacotes.peso_considerado == 0
        ? 0
        : (
            cidadeOrigem.CEP == cidadeDestino.CEP
                ? Number((calculado.combustivel_frete.frete_sem_imposto / lane_iss.where(row => row.lane == calculado.destino.lane ).toArray()[0].iss).toFixed(2))
                : (
                    input.remetente_destinatario_pj_contribui_icms
                        ? Number((calculado.combustivel_frete.frete_sem_imposto / lane_taxa.where(row => row.lane == calculado.destino.lane ).toArray()[0].taxa_contribuinte).toFixed(2))
                        : Number((calculado.combustivel_frete.frete_sem_imposto / lane_taxa.where(row => row.lane == calculado.destino.lane ).toArray()[0].taxa_nao_contribuinte).toFixed(2))
                )
        )


    calculado.total = calculado.seguro.valor + calculado.sobrepeso.valor + calculado.medida_excedente.valor + calculado.area_remota.valor + calculado.combustivel.valor + calculado.combustivel_frete.valor + calculado.frete_nacional.valor

    return calculado
}

module.exports = {
    calc,
    getCidade
}


