import "./pets.css";

export default function Pet({
  imagem,
  nome,
  estado = "idle",
  onClick,
}) {

  return (
    <button
      className={`pet-container pet-${estado}`}
      onClick={onClick}
      aria-label={nome}
    >

      <img
        src={imagem}
        alt={nome}
        className="pet-imagem"
      />

    </button>
  );
}