import "../../styles/layout/sidebar.css";

const grupos = [
  {
    titulo: "Principal",
    itens: [
      "🏠 Início",
      "👤 Perfil",
      "📖 Diário",
    ],
  },
  {
    titulo: "Escola",
    itens: [
      "📚 Biblioteca",
      "🎓 Área Acadêmica",
      "📜 Quadro de Avisos",
    ],
  },
  {
    titulo: "Economia",
    itens: [
      "🏦 Banco",
      "🛒 Mercado",
      "🎒 Inventário",
    ],
  },
  {
    titulo: "Comunidade",
    itens: [
      "🌎 Perfis Públicos",
    ],
  },
  {
    titulo: "Sistema",
    itens: [
      "⚙ Configurações",
    ],
  },
];

export default function Sidebar() {
  return (
    <aside className="cb-sidebar">
      {grupos.map((grupo) => (
        <section key={grupo.titulo} className="sidebar-group">
          <h4>{grupo.titulo}</h4>

          {grupo.itens.map((item) => (
            <button
              key={item}
              className="sidebar-item"
            >
              {item}
            </button>
          ))}
        </section>
      ))}
    </aside>
  );
}