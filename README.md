# Observatorio de Extranjeros Residentes · Marbella

Cuadro de mando para la Concejalía de Extranjeros Residentes del Ayuntamiento de Marbella.

**Web:** https://josehino.github.io/observatorio-extranjeros-marbella/

## Secciones

- **Población**: padrón municipal por continente y nacionalidad (2024–2025) y serie oficial del INE (2013–2025).
- **Distritos y voto**: empadronados por distrito y electorado extranjero potencial para las municipales de 2027.
- **Empleo**: paro registrado y contratos de personas extranjeras (Argos/SAE, 2013–2025) y su peso en el paro del municipio (SEPE).
- **Actividad**: los 98 eventos de 2023–2025 con filtros por año, mes, tipo y comunidad, y descarga en CSV.
- **Prensa**: impactos en medios de 2025.
- **Calidad del dato**: cobertura por año e incoherencias encontradas en los documentos de origen.

## Datos

| Fichero | Origen | Actualización |
|---|---|---|
| `data/data.js` | INE (Censo anual y cifras de padrón), Argos (SAE), SEPE | Automática: Action el día 3 de cada mes (`pipeline/build_data.py`) |
| `data/concejalia.js` | Informes anuales de la Concejalía | A mano, una vez al año |

Montado sobre el kit común de observatorios (`assets/` no se toca).
