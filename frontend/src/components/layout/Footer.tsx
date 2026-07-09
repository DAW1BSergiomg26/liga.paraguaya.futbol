export default function Footer() {
  return (
    <footer className="bg-bg-secundario mt-auto" style={{ borderTop: "2px solid", borderImage: "linear-gradient(90deg, #D52B1E, #FFFFFF, #0038A8) 1" }}>
      <div className="max-w-6xl mx-auto px-4 py-6 text-center text-sm text-texto-apagado">
        <p>liga.paraguaya.futbol — Proyecto de datos y seguimiento del fútbol paraguayo</p>
        <p className="mt-1">
          <a href="https://github.com/usuario/liga.paraguaya.futbol" className="hover:text-texto-secundario transition" target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
        </p>
      </div>
    </footer>
  );
}
