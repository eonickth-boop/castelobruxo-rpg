import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../services/supabase'
import '../styles/recompensas-escola.css'

export default function RecompensasEscolaStandalone() {
  const [itens, setItens] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [processando, setProcessando] = useState(null)
  const [mensagem, setMensagem] = useState('')

  async function carregar() {
    setCarregando(true)
    const { data, error } = await supabase.rpc('listar_recompensas_escola')
    if (error) {
      setMensagem(error.message || 'Não foi possível carregar os benefícios.')
      setItens([])
    } else {
      setItens(data ?? [])
    }
    setCarregando(false)
  }

  useEffect(() => { carregar() }, [])

  async function resgatar(item) {
    setProcessando(item.codigo)
    setMensagem('')
    const { data, error } = await supabase.rpc('resgatar_recompensa_escola', {
      recompensa_alvo: item.codigo,
    })
    if (error) {
      setMensagem(error.message || 'Não foi possível resgatar esta recompensa.')
    } else {
      setMensagem(`${data?.item || item.titulo} foi adicionado ao seu inventário.`)
      await carregar()
    }
    setProcessando(null)
  }

  const grupos = useMemo(() => {
    return itens.reduce((acc, item) => {
      const chave = item.origem || 'Escola'
      acc[chave] = acc[chave] || []
      acc[chave].push(item)
      return acc
    }, {})
  }, [itens])

  return (
    <main className="recompensas-escola-pagina">
      <header className="recompensas-escola-topo">
        <button type="button" onClick={() => window.location.assign('/')}>← Voltar</button>
        <button type="button" onClick={() => window.location.assign('/?pagina=inventario')}>🎒 Inventário</button>
      </header>

      <section className="recompensas-escola-hero">
        <p>Benefícios e recompensas</p>
        <h1>Serviços da Escola</h1>
        <span>Cumpra requisitos, participe dos sistemas e retire itens que não são vendidos no mercado.</span>
      </section>

      {mensagem && <p className="recompensas-escola-mensagem">{mensagem}</p>}

      {carregando ? (
        <p className="recompensas-escola-estado">Carregando benefícios...</p>
      ) : (
        Object.entries(grupos).map(([grupo, registros]) => (
          <section className="recompensas-escola-grupo" key={grupo}>
            <h2>{grupo}</h2>
            <div className="recompensas-escola-grade">
              {registros.map((item) => {
                const bloqueado = !item.elegivel || item.resgatado || item.tipo_regra === 'equipe'
                let texto = 'Resgatar'
                if (item.tipo_regra === 'equipe') texto = 'Concedido pela equipe'
                else if (item.resgatado) texto = item.repetivel ? 'Retirado hoje' : 'Já recebido'
                else if (!item.elegivel) texto = 'Requisito pendente'
                else if (processando === item.codigo) texto = 'Resgatando...'

                return (
                  <article className={`recompensa-escola-card ${item.elegivel ? 'elegivel' : 'bloqueado'}`} key={item.codigo}>
                    <div className="recompensa-escola-icone">{item.tipo_regra === 'diaria' || item.tipo_regra === 'dia_semana' || item.tipo_regra === 'horario' ? '🍽️' : item.tipo_regra === 'tribo' ? '🛡️' : '🎁'}</div>
                    <small>{item.item_codigo}</small>
                    <h3>{item.titulo}</h3>
                    <p>{item.status_texto || item.descricao}</p>
                    <div className="recompensa-escola-status">
                      <span>{item.resgatado ? '✓ Recebido' : item.elegivel ? 'Disponível' : 'Bloqueado'}</span>
                    </div>
                    <button type="button" disabled={bloqueado || processando === item.codigo} onClick={() => resgatar(item)}>{texto}</button>
                  </article>
                )
              })}
            </div>
          </section>
        ))
      )}
    </main>
  )
}
