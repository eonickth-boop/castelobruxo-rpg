import "../../styles/layout/header.css";

export default function Header() {
  return (
    <header className="cb-header">
      <div className="cb-header-logo">
        <h2>🏰 Castelobruxo</h2>
      </div>

      <div className="cb-header-search">
        <input
          type="text"
          placeholder="Pesquisar..."
          disabled
        />
      </div>

      <div className="cb-header-actions">
        <button title="Notificações">
          🔔
        </button>

        <button title="Perfil">
          👤
        </button>
      </div>
    </header>
  );
}