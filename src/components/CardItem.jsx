import './CardItem.css'

export default function CardItem({
  item,
  saldo = 0,
  itemComprando = null,
  onComprar,
  quantidade,
  modoInventario = false,
}) {
  const pastas = {
    ART: 'ART',
    CRI: 'CRIS',
    LIV: 'LIV',
    PLA: 'PLA',
    POT: 'POT',
    UTE: 'UTE',
    VES: 'VEST',
  }

  const prefixo = item.id.slice(0, 3)
  const pasta = pastas[prefixo]
  const caminhoImagem = `/assets/${pasta}/${item.imagem}`

  const semSaldo = saldo < item.preco
  const comprandoEsteItem = itemComprando === item.id

  return (
    <article
      onMouseEnter={(evento) => {
        evento.currentTarget.style.transform = 'translateY(-6px)'
        evento.currentTarget.style.boxShadow =
          '0 18px 38px rgba(0, 0, 0, 0.48)'
      }}
      onMouseLeave={(evento) => {
        evento.currentTarget.style.transform = 'translateY(0)'
        evento.currentTarget.style.boxShadow =
          '0 12px 30px rgba(0, 0, 0, 0.35)'
      }}
      style={{
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        cursor: 'default',
        background:
          'linear-gradient(180deg, rgba(28, 34, 29, 0.98), rgba(15, 18, 16, 0.98))',
        border: '1px solid rgba(201, 164, 92, 0.45)',
        borderRadius: '18px',
        padding: '20px',
        boxShadow: '0 12px 30px rgba(0, 0, 0, 0.35)',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '520px',
      }}
    >
      <div
        style={{
          minHeight: '190px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '12px',
        }}
      >
        <img
          src={caminhoImagem}
          alt={item.nome}
          style={{
            width: '180px',
            height: '180px',
            objectFit: 'contain',
            filter: 'drop-shadow(0 8px 16px rgba(0, 0, 0, 0.45))',
          }}
        />
      </div>

      <h2
        style={{
          margin: '4px 0 10px',
          fontSize: '1.35rem',
          color: '#f3ead2',
        }}
      >
        {item.nome}
      </h2>

      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '8px',
          flexWrap: 'wrap',
          marginBottom: '14px',
        }}
      >
        <span
          style={{
            padding: '6px 10px',
            borderRadius: '999px',
            background: 'rgba(84, 122, 90, 0.22)',
            border: '1px solid rgba(117, 164, 126, 0.35)',
            color: '#b9d3bd',
            fontSize: '0.85rem',
          }}
        >
          {item.categoria}
        </span>

        <span
          style={{
            padding: '6px 10px',
            borderRadius: '999px',
            background: 'rgba(201, 164, 92, 0.14)',
            border: '1px solid rgba(201, 164, 92, 0.35)',
            color: '#dfc78f',
            fontSize: '0.85rem',
          }}
        >
          {item.raridade}
        </span>
      </div>

      <p
        style={{
          color: '#c9c9c9',
          lineHeight: '1.55',
          margin: '0 0 18px',
          flexGrow: 1,
        }}
      >
        {item.descricao}
      </p>

      <div
        style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          paddingTop: '16px',
        }}
      >
        {modoInventario ? (
          <div
            style={{
              display: 'inline-block',
              padding: '10px 20px',
              borderRadius: '999px',
              background: 'rgba(201, 164, 92, 0.14)',
              border: '1px solid rgba(201, 164, 92, 0.4)',
              color: '#e3c474',
              fontWeight: '700',
              fontSize: '1.1rem',
            }}
          >
            Quantidade: {quantidade}
          </div>
        ) : (
          <>
            <div
              style={{
                fontSize: '1.45rem',
                fontWeight: '700',
                color: '#e3c474',
                marginBottom: '14px',
              }}
            >
              {item.preco} Ipês
            </div>

            <button
              onClick={() => onComprar(item)}
              disabled={semSaldo || itemComprando !== null}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '10px',
                border: semSaldo
                  ? '1px solid rgba(255,255,255,0.12)'
                  : '1px solid rgba(224, 190, 103, 0.55)',
                background: semSaldo
                  ? '#2e312f'
                  : 'linear-gradient(180deg, #d8b866, #b78b35)',
                color: semSaldo ? '#8e938f' : '#1c1a14',
                fontWeight: '700',
                cursor: semSaldo ? 'not-allowed' : 'pointer',
              }}
            >
              {comprandoEsteItem
                ? 'Comprando...'
                : semSaldo
                  ? 'Saldo insuficiente'
                  : 'Comprar'}
            </button>
          </>
        )}
      </div>
    </article>
  )
}