import { useMemo, useState } from 'react'
import './exploracao-v2.css'

const locais = [
  { id: 'patio', nome: 'Pátio das Palmeiras', zona: 'Núcleo central', estado: 'Seguro', progresso: 100, descricao: 'Centro de encontros, avisos e passagem entre as alas da escola.' },
  { id: 'torre', nome: 'Torre das Águas', zona: 'Ala leste', estado: 'Acessível', progresso: 82, descricao: 'Salas de encantamentos, observatório hídrico e arquivos de marés mágicas.' },
  { id: 'estufa', nome: 'Estufa III', zona: 'Jardins baixos', estado: 'Acessível', progresso: 64, descricao: 'Espécies amazônicas raras e ingredientes usados nas aulas de herbologia.' },
  { id: 'rio', nome: 'Rio Escuro', zona: 'Floresta externa', estado: 'Interditado', progresso: 28, descricao: 'Uma passagem instável, cercada por relatos de luzes e ruídos noturnos.' },
]

const missoes = [
  { titulo: 'Ronda da Floresta', recompensa: '140 Ipês', dificuldade: 'Média', prazo: 'Hoje, 21h' },
  { titulo: 'Herbário Perdido', recompensa: '90 Ipês', dificuldade: 'Fácil', prazo: '2 dias' },
  { titulo: 'O eco sob a torre', recompensa: '220 Ipês', dificuldade: 'Alta', prazo: '4 dias' },
]

const descobertas = [
  { nome: 'Selo de pedra azul', tipo: 'Relíquia', data: '26 jul' },
  { nome: 'Folha de fogo-brando', tipo: 'Ingrediente', data: '24 jul' },
  { nome: 'Atalho da raiz antiga', tipo: 'Passagem', data: '19 jul' },
]

export default function ExploracaoV2({ onVoltar }) {
  const [aba, setAba] = useState('mapa')
  const [localAtivo, setLocalAtivo] = useState(locais[0])
  const [mensagem, setMensagem] = useState('')
  const progressoGeral = useMemo(() => Math.round(locais.reduce((soma, local) => soma + local.progresso, 0) / locais.length), [])

  function iniciarMissao(titulo) {
    setMensagem(`“${titulo}” foi adicionada ao seu registro de exploração.`)
  }

  return (
    <section className="exploracao-v2">
      <header className="exploracao-topo">
        <div>
          <button type="button" onClick={onVoltar}>← Voltar ao painel</button>
          <small>ARQUIVO CARTOGRÁFICO</small>
          <h1>Exploração</h1>
          <p>Mapeie Castelobruxo, descubra passagens e acompanhe missões espalhadas pela escola e pela floresta.</p>
        </div>
        <div className="exploracao-progresso">
          <span>{progressoGeral}%</span>
          <small>território registrado</small>
        </div>
      </header>

      <nav className="exploracao-abas" aria-label="Seções de exploração">
        {[
          ['mapa', 'Mapa'],
          ['missoes', 'Missões'],
          ['descobertas', 'Descobertas'],
        ].map(([id, nome]) => <button key={id} type="button" className={aba === id ? 'ativa' : ''} onClick={() => setAba(id)}>{nome}</button>)}
      </nav>

      {mensagem && <div className="exploracao-mensagem" role="status"><span>{mensagem}</span><button type="button" onClick={() => setMensagem('')}>×</button></div>}

      {aba === 'mapa' && (
        <div className="exploracao-grade">
          <section className="exploracao-mapa">
            <div className="exploracao-mapa-superficie">
              <span className="mapa-rio" />
              {locais.map((local, indice) => (
                <button
                  key={local.id}
                  type="button"
                  className={`mapa-ponto ponto-${indice + 1} ${localAtivo.id === local.id ? 'ativo' : ''}`}
                  onClick={() => setLocalAtivo(local)}
                  aria-label={`Abrir ${local.nome}`}
                >
                  <i />
                  <span>{local.nome}</span>
                </button>
              ))}
              <div className="mapa-rosa"><strong>N</strong><span>✦</span></div>
              <div className="mapa-legenda">MAPA PARCIAL · SETOR ACADÊMICO E FLORESTA NORTE</div>
            </div>
          </section>

          <aside className="exploracao-detalhe">
            <small>{localAtivo.zona}</small>
            <h2>{localAtivo.nome}</h2>
            <span className={`estado ${localAtivo.estado.toLowerCase()}`}>{localAtivo.estado}</span>
            <p>{localAtivo.descricao}</p>
            <div className="exploracao-barra"><i style={{ width: `${localAtivo.progresso}%` }} /></div>
            <div className="exploracao-meta"><span>Registro concluído</span><strong>{localAtivo.progresso}%</strong></div>
            <button type="button" onClick={() => setMensagem(`${localAtivo.nome} foi marcado como seu próximo destino.`)}>Marcar destino</button>
          </aside>
        </div>
      )}

      {aba === 'missoes' && (
        <section className="exploracao-lista">
          <header><small>QUADRO DE CAMPO</small><h2>Missões disponíveis</h2></header>
          <div>
            {missoes.map((missao, indice) => (
              <article key={missao.titulo}>
                <span>{String(indice + 1).padStart(2, '0')}</span>
                <div><small>{missao.dificuldade} · {missao.prazo}</small><h3>{missao.titulo}</h3><p>Recompensa: {missao.recompensa}</p></div>
                <button type="button" onClick={() => iniciarMissao(missao.titulo)}>Aceitar missão</button>
              </article>
            ))}
          </div>
        </section>
      )}

      {aba === 'descobertas' && (
        <section className="exploracao-lista descobertas">
          <header><small>COLEÇÃO DE CAMPO</small><h2>Descobertas recentes</h2></header>
          <div>
            {descobertas.map((item) => (
              <article key={item.nome}><span>✦</span><div><small>{item.tipo} · {item.data}</small><h3>{item.nome}</h3><p>Registrado no arquivo pessoal de exploração.</p></div><button type="button" onClick={() => setMensagem(`${item.nome} aberto no arquivo de descobertas.`)}>Ver registro</button></article>
            ))}
          </div>
        </section>
      )}
    </section>
  )
}
