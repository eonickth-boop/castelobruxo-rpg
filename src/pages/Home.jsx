import StudentDesk from "../components/studentDesk/StudentDesk";
export default function Home({
  perfil,
  carregarCarteira,
  carregarInventario,
  carregarMercado,
  carregando,
  sair,
}) {
  return (
    <main
      style={{
        maxWidth: "1100px",
        margin: "40px auto",
        padding: "30px",
      }}
    >
      <div
        style={{
          textAlign: "center",
          marginBottom: "45px",
        }}
      >
        <h1
          style={{
            color: "#e5c16b",
            fontSize: "3rem",
            marginBottom: "8px",
          }}
        >
          Castelobruxo
        </h1>

        <p
          style={{
            color: "#a7b7a8",
            fontSize: "1.15rem",
          }}
        >
          Escola Brasileira de Magia
        </p>
      </div>

      <div
        style={{
          background: "#1b221d",
          borderRadius: "18px",
          padding: "30px",
          border: "1px solid rgba(201,164,92,.35)",
          marginBottom: "35px",
        }}
      >
        <h2 style={{ color: "#f0d27a" }}>
          Bem-vindo de volta,
          <br />
          {perfil.nome_personagem || perfil.usuario}
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4,1fr)",
            gap: "18px",
            marginTop: "30px",
          }}
        >
          <Info titulo="Tribo" valor={perfil.tribo || "—"} />
          <Info titulo="Ano" valor={perfil.ano} />
          <Info titulo="Nível" valor={perfil.nivel} />
          <Info titulo="XP" valor={perfil.xp} />
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2,1fr)",
          gap: "18px",
        }}
      >
        <Botao
          titulo="🏦 Banco da Árvore Ancestral"
          onClick={carregarCarteira}
          carregando={carregando}
        />

        <Botao
          titulo="🛒 Mercado das Cinco Trilhas"
          onClick={carregarMercado}
          carregando={carregando}
        />

        <Botao
          titulo="🎒 Inventário"
          onClick={carregarInventario}
          carregando={carregando}
        />

        <Botao
          titulo="📚 Biblioteca"
          disabled
        />
      </div>

      <div
        style={{
          textAlign: "center",
          marginTop: "40px",
        }}
      >
        <button onClick={sair}>
          Sair
        </button>
      </div>
    </main>
  )
}

function Info({ titulo, valor }) {
  return (
    <div
      style={{
        background: "#232d25",
        padding: "18px",
        borderRadius: "12px",
      }}
    >
      <small
        style={{
          color: "#9fb0a0",
        }}
      >
        {titulo}
      </small>

      <h3
        style={{
          color: "#f0d27a",
          marginTop: "8px",
        }}
      >
        {valor}
      </h3>
    </div>
  )
}

function Botao({
  titulo,
  onClick,
  carregando,
  disabled,
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || carregando}
      style={{
        padding: "24px",
        fontSize: "1.1rem",
      }}
    >
      {titulo}
    </button>
  )
}