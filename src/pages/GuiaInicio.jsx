import '../styles/guia-inicio.css'

const passos=[
 ['1','Crie seu personagem','Preencha nome, idade, origem e detalhes do personagem. Depois conclua a cerimônia de seleção da tribo.'],
 ['2','Comece pelas aulas','Aulas concedem XP, Conhecimento, reputação escolar e liberam certificados.'],
 ['3','Explore e cumpra missões','Descobertas, missões e eventos aumentam XP, reputação e coleções.'],
 ['4','Construa sua reputação','Conhecimento, Natureza, Exploração, Comércio, Escola e Tribo liberam profissões e benefícios.'],
 ['5','Escolha uma profissão','Confira nível, ano, reputação e vagas. Trabalhos rendem Ipês, XP profissional e promoções.'],
 ['6','Participe da temporada','Conclua desafios, receba XP sazonal e resgate recompensas na trilha gratuita.'],
]
const moedas=[['XP','Aumenta o nível geral do personagem. A cada 100 XP, o nível sobe automaticamente.'],['Ipês','Moeda usada no mercado, banco e recompensas.'],['Reputação','Reconhecimento por área, usado para liberar profissões e vantagens.'],['XP profissional','Faz sua carreira avançar de Aprendiz até Guardião da profissão.'],['XP sazonal','Avança a trilha da temporada ativa.']]
export default function GuiaInicio(){return <main className="guia-inicio-pagina"><button onClick={()=>location.href='/'}>← Voltar</button><header><p>Primeiros passos</p><h1>Guia de Castelobruxo</h1><span>Um caminho simples para começar sua jornada sem se perder entre os sistemas.</span></header><section className="guia-passos">{passos.map(([n,t,d])=><article key={n}><b>{n}</b><div><h2>{t}</h2><p>{d}</p></div></article>)}</section><section className="guia-recursos"><h2>Entenda os pontos do jogo</h2><div>{moedas.map(([t,d])=><article key={t}><strong>{t}</strong><p>{d}</p></article>)}</div></section><section className="guia-atalhos"><h2>Para onde ir agora?</h2><div><a href="/?pagina=aulas">Aulas</a><a href="/?pagina=missoes">Missões</a><a href="/exploracao">Exploração</a><a href="/profissoes">Profissões</a><a href="/jornal">Jornal</a><a href="/temporadas">Temporadas</a></div></section></main>