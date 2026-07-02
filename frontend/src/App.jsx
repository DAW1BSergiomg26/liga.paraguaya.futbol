import { useEffect, useState } from 'react'
import './App.css'

function App() {
  const [clubes, setClubes] = useState([])
  const [partidos, setPartidos] = useState([])
  const [tabla, setTabla] = useState([])
  const [estado, setEstado] = useState('Conectando con el backend...')

  useEffect(() => {
    async function cargarDatos() {
      try {
        const [clubesRes, partidosRes, tablaRes, healthRes] = await Promise.all([
          fetch('/api/clubes'),
          fetch('/api/partidos'),
          fetch('/api/tabla'),
          fetch('/api/health')
        ])

        const clubesData = await clubesRes.json()
        const partidosData = await partidosRes.json()
        const tablaData = await tablaRes.json()
        const healthData = await healthRes.json()

        setClubes(clubesData)
        setPartidos(partidosData)
        setTabla(tablaData)
        setEstado(healthData.mensaje)
      } catch (error) {
        setEstado('No se pudo conectar con el backend. Revisa que FastAPI esté encendido en el puerto 8000.')
      }
    }

    cargarDatos()
  }, [])

  return (
    <main className="app">
      <section className="hero">
        <p className="eyebrow">Proyecto DAW · API + React</p>
        <h1>Liga Paraguaya Fútbol</h1>
        <p className="heroText">
          Plataforma inicial para clubes, partidos, tabla de posiciones y datos base del fútbol paraguayo.
        </p>
        <div className="status">
          <span className="dot"></span>
          {estado}
        </div>
      </section>

      <section className="grid">
        <article className="card">
          <h2>Clubes</h2>
          <div className="cardsList">
            {clubes.map((club) => (
              <div className="miniCard" key={club.id}>
                <h3>{club.nombre}</h3>
                <p>{club.apodo}</p>
                <small>{club.ciudad} · {club.estadio}</small>
              </div>
            ))}
          </div>
        </article>

        <article className="card">
          <h2>Partidos</h2>
          <div className="cardsList">
            {partidos.map((partido) => (
              <div className="miniCard" key={partido.id}>
                <h3>{partido.local} vs {partido.visitante}</h3>
                <p>{partido.torneo}</p>
                <small>{partido.fecha} · {partido.estado}</small>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="card tableCard">
        <h2>Tabla de posiciones</h2>
        <div className="tableWrap">
          <table>
            <thead>
              <tr>
                <th>Pos</th>
                <th>Club</th>
                <th>PJ</th>
                <th>PG</th>
                <th>PE</th>
                <th>PP</th>
                <th>DG</th>
                <th>Pts</th>
              </tr>
            </thead>
            <tbody>
              {tabla.map((fila) => (
                <tr key={fila.club_id}>
                  <td>{fila.posicion}</td>
                  <td>{fila.club}</td>
                  <td>{fila.pj}</td>
                  <td>{fila.pg}</td>
                  <td>{fila.pe}</td>
                  <td>{fila.pp}</td>
                  <td>{fila.dg}</td>
                  <td><strong>{fila.puntos}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}

export default App
