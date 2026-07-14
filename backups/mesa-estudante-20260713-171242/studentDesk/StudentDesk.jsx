import "./StudentDesk.css";

export default function StudentDesk({ onNavigate }) {

   function clicar(destino){

    if(onNavigate){

        onNavigate(destino);

    }

}

    return(

        <div className="desk-container">

            <img
                src="/assets/interface/mesa.png"
                className="desk-image"
                alt="Mesa do estudante"
            />

            <div className="desk-hotspot livro">

    <button
        className="desk-item"
       onClick={() => clicar("biblioteca")}
    />

    <span>📚 Biblioteca</span>

</div>

            <button
                className="desk-item mochila"
                onClick={() => clicar("inventario")}
            />

            <button
                className="desk-item bolsa"
               onClick={() => clicar("banco")}
            />

            <button
                className="desk-item mapa"
               onClick={() => clicar("mapa")}
            />

            <button
                className="desk-item carta"
                onClick={() => clicar("correio")}
            />

        </div>

    );

}