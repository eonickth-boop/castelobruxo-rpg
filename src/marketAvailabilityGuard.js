const MOTIVOS_POR_ID = new Map([
  ['ESC_N_01', 'Emitida pela escola ao estudante'],
  ['ESC_N_07', 'Concedido a monitores oficiais'],
  ['ESC001', 'Concedido pela biblioteca'],
  ['ESC002', 'Exclusivo para monitores'],
  ['ESC003', 'Recompensa especial da administração'],
  ['ESC004', 'Recompensa por mérito acadêmico'],
  ['ESC005', 'Recebido ao concluir uma missão'],
  ['ESC006', 'Liberado a partir do segundo ano'],
  ['ESC007', 'Liberada para exploradores de nível 2'],
  ['ESC008', 'Exclusivo para professores e administradores'],
  ['ESC009', 'Entregue durante eventos oficiais'],
  ['ESC010', 'Liberado a partir do nível 2'],
  ['ESC011', 'Concedido pela administração escolar'],
  ['ESC012', 'Liberada ao completar o perfil público'],
  ['BRO001', 'Recebido ao ingressar na tribo Yandara'],
  ['BRO002', 'Recebido ao ingressar na tribo Arayé'],
  ['BRO003', 'Recebido ao ingressar na tribo Anayru'],
  ['BRO004', 'Recebido ao ingressar na tribo Aratá'],
  ['BRO005', 'Recebido ao ingressar na tribo Caora'],
  ['COM_007', 'Servida no refeitório'],
  ['COM_008', 'Servido no refeitório'],
  ['COM_012', 'Servido em atividade escolar'],
])

export function itemEhCompravel(item) {
  const preco = Number(item?.preco)
  return Number.isFinite(preco) && preco > 0
}

export function motivoDeObtencao(item) {
  if (itemEhCompravel(item)) return ''
  return MOTIVOS_POR_ID.get(String(item?.id || ''))
    || item?.regra_obtencao
    || 'Obtido por progressão ou concessão da escola'
}

// Compatibilidade com o ponto de entrada antigo. As regras agora são
// renderizadas pelo React e validadas antes da RPC, sem observar o DOM.
export function iniciarProtecaoMercado() {}
