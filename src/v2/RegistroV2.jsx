import { useState } from 'react'
import './registro-v2.css'

const atributos = [
  ['Coragem', 78],
  ['Conhecimento', 64],
  ['Intuição', 86],
  ['Afinidade mágica', 71],
]

const historico = [
  ['27 JUL 2026', 'Concluiu o registro acadêmico', 'Secretaria'],
  ['26 JUL 2026', 'Recebeu 120 Ipês pela missão introdutória', 'Tesouraria'],
  ['24 JUL 2026', 'Ingressou no terceiro ano', 'Diretoria'],
]

export default function RegistroV2({ onVoltar }) {
  const [editando, setEditando] = useState(false)
  const [mensagem, setMensagem] = useState('')
  const [dados, setDados] = useState({
    nome: 'Nicolas Vale',
    pronomes: 'ele/dele',
    origem: 'São Paulo, Brasil',
    bio: 'Observador, curioso e profundamente ligado aos mistérios da floresta. Mantém um caderno de anotações sobre criaturas, símbolos e passagens ocultas.',
  })

  function alterar(campo, valor) {
    setDados((atual) => ({ ...atual, [campo]: valor }))
  }

  function salvar() {
    setEditando(false)
    setMensagem('Alterações salvas nesta prévia. A conexão com o Supabase será feita na etapa de dados.')
  }

  return (
    <div className="registro-v2">
      <header className="registro-v2-cabecalho">
        <div>
          <button type="button" onClick={onVoltar}>← Voltar ao painel</button>
          <small>ARQUIVO PESSOAL · REGISTRO 027</small>
          <h2>Meu registro</h2>
          <p>Identidade, jornada acadêmica e histórico do personagem.</p>
        </div>
        <button type="button" className="registro-v2-editar" onClick={() => setEditando((valor) => !valor)}>{editando ? 'Cancelar edição' : 'Editar registro'}</button>
      </header>

      {mensagem && <div className="registro-v2-mensagem" role="status"><span>{mensagem}</span><button type="button" onClick={() => setMensagem('')}>×</button></div>}

      <section className="registro-v2-identidade">
        <div className="registro-v2-banner"><span>ARQUIVO VIVO</span></div>
        <div className="registro-v2-perfil">
          <div className="registro-v2-retrato">NV</div>
          <div className="registro-v2-nome">
            {editando ? <input value={dados.nome} onChange={(e) => alterar('nome', e.target.value)} /> : <h3>{dados.nome}</h3>}
            <span>3º ano · Tribo Anayru</span>
            <div><em>Estudante ativo</em><em>Registro verificado</em></div>
          </div>
          <div className="registro-v2-selo"><strong>CB</strong><small>027</small></div>
        </div>
      </section>

      <div className="registro-v2-grade">
        <section className="registro-v2-bloco registro-v2-sobre">
          <header><small>IDENTIDADE</small><h3>Sobre o personagem</h3></header>
          <div className="registro-v2-campos">
            <label><span>Pronomes</span>{editando ? <input value={dados.pronomes} onChange={(e) => alterar('pronomes', e.target.value)} /> : <strong>{dados.pronomes}</strong>}</label>
            <label><span>Origem</span>{editando ? <input value={dados.origem} onChange={(e) => alterar('origem', e.target.value)} /> : <strong>{dados.origem}</strong>}</label>
            <label className="largo"><span>Biografia</span>{editando ? <textarea rows="5" value={dados.bio} onChange={(e) => alterar('bio', e.target.value)} /> : <p>{dados.bio}</p>}</label>
          </div>
          {editando && <button type="button" className="registro-v2-salvar" onClick={salvar}>Salvar alterações</button>}
        </section>

        <section className="registro-v2-bloco registro-v2-tribo">
          <header><small>VÍNCULO</small><h3>Tribo Anayru</h3></header>
          <div className="registro-v2-brasao">A</div>
          <p>Ligação com conhecimento ancestral, natureza, memória e proteção coletiva.</p>
          <dl><div><dt>Pontos da tribo</dt><dd>1.840</dd></div><div><dt>Posição</dt><dd>12º</dd></div><div><dt>Contribuições</dt><dd>18</dd></div></dl>
        </section>
      </div>

      <div className="registro-v2-grade inferior">
        <section className="registro-v2-bloco registro-v2-atributos">
          <header><small>DESENVOLVIMENTO</small><h3>Atributos</h3></header>
          <div>{atributos.map(([nome, valor]) => <article key={nome}><div><strong>{nome}</strong><span>{valor}</span></div><i><b style={{ width: `${valor}%` }} /></i></article>)}</div>
        </section>

        <section className="registro-v2-bloco registro-v2-historico">
          <header><small>HISTÓRICO</small><h3>Registros recentes</h3></header>
          <div>{historico.map(([data, texto, origem]) => <article key={texto}><time>{data}</time><div><strong>{texto}</strong><span>{origem}</span></div></article>)}</div>
        </section>
      </div>

      <section className="registro-v2-bloco registro-v2-conquistas">
        <header><small>CONQUISTAS</small><h3>Selos obtidos</h3></header>
        <div>
          <article><span>✦</span><strong>Primeiro registro</strong><small>Ficha concluída</small></article>
          <article><span>⌁</span><strong>Explorador iniciante</strong><small>Primeira trilha visitada</small></article>
          <article><span>◈</span><strong>Voz da comunidade</strong><small>10 interações publicadas</small></article>
          <article className="bloqueado"><span>?</span><strong>Selo oculto</strong><small>Continue sua jornada</small></article>
        </div>
      </section>
    </div>
  )
}
