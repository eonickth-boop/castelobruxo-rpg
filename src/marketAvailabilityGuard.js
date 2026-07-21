const REGRAS_NAO_COMPRAVEIS = new Map([
  ['Passe da biblioteca', 'Concedido pela biblioteca'],
  ['Distintivo de monitor', 'Exclusivo para monitores'],
  ['Chave mestra', 'Item de missão'],
  ['Medalha de mérito', 'Recompensa acadêmica'],
  ['Certificado enrolado', 'Conquista acadêmica'],
  ['Kit de primeiros socorros', 'Equipamento da escola'],
  ['Lanterna de corredor', 'Equipamento da escola'],
  ['Rádio comunicador', 'Uso de funcionários'],
  ['Convite para evento', 'Obtido em eventos'],
  ['Passe de transporte', 'Concedido pela escola'],
  ['Selo acadêmico', 'Uso administrativo'],
  ['Caixa de correspondência', 'Patrimônio da escola'],
  ['Broche Yandara', 'Recebido pela tribo'],
  ['Broche Arayé', 'Recebido pela tribo'],
  ['Broche Anayru', 'Recebido pela tribo'],
  ['Broche Aratá', 'Recebido pela tribo'],
  ['Marmita estudantil', 'Servida no refeitório'],
  ['Macarrão do refeitório', 'Servido no refeitório'],
  ['Chá noturno', 'Servido em atividade escolar'],
])

function normalizar(texto = '') {
  return String(texto)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

const regrasNormalizadas = new Map(
  [...REGRAS_NAO_COMPRAVEIS].map(([nome, motivo]) => [normalizar(nome), motivo]),
)

function aplicarRegras() {
  document.querySelectorAll('.mercado-item').forEach((card) => {
    const titulo = card.querySelector('h2')?.textContent?.trim()
    const motivo = regrasNormalizadas.get(normalizar(titulo))
    if (!motivo) return

    card.classList.add('mercado-item-institucional')
    card.dataset.naoCompravel = 'true'

    const preco = card.querySelector('.mercado-item-rodape strong')
    if (preco) {
      preco.textContent = motivo
      preco.classList.add('mercado-obtencao')
    }

    const botao = card.querySelector('.mercado-item-rodape button')
    if (botao) {
      botao.disabled = true
      botao.textContent = 'Não disponível para compra'
      botao.setAttribute('aria-disabled', 'true')
      botao.title = motivo
    }
  })
}

export function iniciarProtecaoMercado() {
  const estilo = document.createElement('style')
  estilo.textContent = `
    .mercado-item-institucional{border-style:dashed!important;opacity:.92}
    .mercado-item-institucional .mercado-item-imagem::after{content:'Institucional';position:absolute;right:12px;top:12px;padding:6px 10px;border-radius:999px;background:rgba(8,20,15,.88);border:1px solid rgba(201,164,92,.4);color:#ead9a8;font-size:.72rem;font-weight:800;letter-spacing:.04em;text-transform:uppercase}
    .mercado-item-institucional .mercado-obtencao{color:#c8d1ca!important;font-size:.92rem!important}
    .mercado-item-institucional button:disabled{background:#303a33!important;color:#aeb8b0!important;border-color:#4c574f!important;cursor:not-allowed!important;opacity:1!important}
  `
  document.head.appendChild(estilo)

  document.addEventListener('click', (evento) => {
    const botao = evento.target.closest?.('.mercado-item[data-nao-compravel="true"] button')
    if (!botao) return
    evento.preventDefault()
    evento.stopImmediatePropagation()
  }, true)

  aplicarRegras()
  new MutationObserver(aplicarRegras).observe(document.body, {
    childList: true,
    subtree: true,
  })
}
