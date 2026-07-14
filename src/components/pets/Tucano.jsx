import Pet from "./Pets";

export default function Tucano({
  onClick,
}) {

  return (

    <Pet

      nome="Tucano Amazônico"

      imagem="/assets/pets/tucano/idle.png"

      estado="idle"

      onClick={onClick}

    />

  );

}