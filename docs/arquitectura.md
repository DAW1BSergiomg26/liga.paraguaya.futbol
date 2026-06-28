# liga.paraguaya.futbol

Proyecto para construir una plataforma de datos, análisis, crónicas y seguimiento de la Liga Paraguaya de Fútbol.

## Objetivo

Crear una web profesional con:

- clubes paraguayos
- partidos
- resultados
- tabla de posiciones
- estadísticas
- crónicas deportivas
- análisis táctico
- jugadores revelación
- contenido generado con IA

## Fuentes

- Base propia en JSON/CSV
- SoccerData como laboratorio auxiliar
- ESPN/Sofascore si están disponibles
- Carga manual controlada cuando no exista fuente fiable

## Estado actual

- SoccerData instalado correctamente.
- ESPN probado con Premier League.
- Paraguay no aparece configurado por defecto en SoccerData.
- Se inicia base propia paraguaya.

## Laboratorio SoccerData

La carpeta soccerdata-base/ se usa solo como laboratorio local para probar la librería SoccerData.

No se sube al repositorio principal porque es código de terceros.
El proyecto liga.paraguaya.futbol tendrá su propia arquitectura, datos y backend.

Conclusiones de prueba:

- SoccerData se instaló correctamente.
- ESPN funciona como fuente de datos.
- FBref puede fallar por CAPTCHA, bloqueo o timeout.
- La liga paraguaya no viene configurada por defecto.
- Se usará una base propia JSON/CSV para clubes, partidos y torneos paraguayos.
