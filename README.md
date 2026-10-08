# Observatorio de Extranjeros Residentes · Marbella

Cuadro de mando para la Concejalía de Extranjeros Residentes del Ayuntamiento de Marbella.

**Web:** https://josehino.github.io/observatorio-extranjeros-marbella/

## Secciones

- **Población**: padrón municipal por continente y nacionalidad (2024–2025), serie oficial del INE (2013–2025) y nacidos en el extranjero frente a nacionalidad extranjera.
- **Barrios**: mapa de las 79 secciones censales (% y número de extranjeros, cambio 2022–2025, % en 2015 y renta media) y comparativa por distrito.
- **Distritos y voto**: empadronados por distrito y electorado extranjero potencial para las municipales de 2027.
- **Llegadas y salidas**: llegadas desde el extranjero, salidas, saldo exterior e interior y matrimonios con cónyuge extranjero.
- **Empleo**: extranjeros afiliados que trabajan en Marbella (IECA, mensual desde 2012), paro y contratos de extranjeros (Argos) y su peso en el paro (SEPE).
- **Visitantes**: turistas internacionales por mes y país (INE, teléfonos móviles) y turistas por cada residente de su país.
- **Actividad**: los 98 eventos de 2023–2025 con filtros por año, mes, tipo y comunidad, y descarga en CSV.
- **Prensa**: impactos en medios de 2025.
- **Provincia**: extranjeros con residencia en vigor (OPI) y peso de los extranjeros residentes en la compra de vivienda (Ministerio de Vivienda), provincia de Málaga.
- **Calidad del dato**: cobertura por año e incoherencias encontradas en los documentos de origen.

## Datos

| Fichero | Origen | Actualización |
|---|---|---|
| `data/data.js` | INE, IECA, Argos (SAE), SEPE, Dataestur, OPI, Ministerio de Vivienda | Automática: Action el día 3 de cada mes (`pipeline/build_data.py`) |
| `data/concejalia.js` | Informes anuales de la Concejalía | A mano, una vez al año |
| `data/secciones.js` | Cartografía de secciones censales del INE (1-1-2025) | Si el INE cambia el seccionado |
| `pipeline/codigos_ine.json` | Códigos de serie del INE (secciones, país de nacimiento, migraciones) | Junto con `secciones.js` |

La primera ejecución del colector tarda unos 20 minutos (la afiliación del IECA se pide periodo a periodo); las siguientes reutilizan lo publicado y solo piden los meses nuevos.

Montado sobre el kit común de observatorios (`assets/` no se toca).
