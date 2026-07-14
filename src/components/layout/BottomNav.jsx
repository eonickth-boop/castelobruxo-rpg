import "../../styles/layout/bottomNav.css";

export default function BottomNav() {
  return (
    <nav className="bottom-nav">

      <button>
        🏠
        <span>Início</span>
      </button>

      <button>
        📖
        <span>Diário</span>
      </button>

      <button>
        🏦
        <span>Banco</span>
      </button>

      <button>
        🎒
        <span>Inventário</span>
      </button>

      <button>
        👤
        <span>Perfil</span>
      </button>

    </nav>
  );
}