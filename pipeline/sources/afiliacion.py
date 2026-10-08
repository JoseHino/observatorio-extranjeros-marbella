# -*- coding: utf-8 -*-
"""IECA / BADEA - afiliaciones a la Seguridad Social por municipio de TRABAJO y
nacionalidad (consulta 861, operacion b3_291).

Solo distingue Espana / Extranjero / Total: el pais concreto no se publica por
municipio. Cuenta a quien trabaja en Marbella, viva donde viva.

Trampa (ya vista en Benahavis con la consulta 876): la dimension temporal va en
posicion de pagina, asi que hay que pedir UN periodo por llamada y con el id
NUMERICO de la jerarquia 3153; una lista con comas devuelve 0 filas sin error.
Por eso la descarga es incremental: se reutiliza lo ya publicado y solo se piden
los periodos nuevos y los tres ultimos (que el IECA puede revisar).
"""

from .comun import get_json, aviso

REST = ("https://www.juntadeandalucia.es/institutodeestadisticaycartografia/"
        "intranet/admin/rest/v1.0")
CONSULTA = "861"
JERARQUIA_TIEMPO = "3153"
NODOS = {"marbella": "2980", "malaga": "3023"}


def _periodos():
    j = get_json(f"{REST}/jerarquia/{JERARQUIA_TIEMPO}?consultaId={CONSULTA}&alias=D_TEMPORAL_0")
    hijos = j["data"]["children"]
    return [(h["cod"], h["id"]) for h in hijos]          # ("202609", 2240)


def _pide(nodo, id_periodo):
    j = get_json(f"{REST}/consulta/{CONSULTA}?D_TERRITORIO_0={nodo}&D_TEMPORAL_0={id_periodo}")
    out = {}
    for fila in j.get("data", []):
        nac = fila[1].get("des")
        v = fila[3].get("val")
        if v is not None:
            out[nac] = float(v)
    return out


def serie(previo=None):
    """{"x": ["2012-03", ...], "<ambito>_ext": [...], "<ambito>_total": [...]}.

    `previo` es el bloque ya publicado en data.js (o None)."""
    previo = previo or {}
    cache = {}
    for i, t in enumerate(previo.get("x", [])):
        cache[t] = {k: previo[k][i] for k in previo if k != "x"}
    # El calendario del IECA trae 16 meses de 2021-2023 rotulados como "1921-...",
    # "1922-...", "1923-..." (errata de la jerarquia) y sin dato detras: se
    # corrige el año y, si siguen vacios, se descartan al final.
    pers = [("20" + c[2:] if c.startswith("19") else c, pid) for c, pid in _periodos()]
    recientes = {c for c, _ in pers[-3:]}
    filas = {}
    for cod, pid in pers:
        t = f"{cod[:4]}-{cod[4:6]}"
        if t in cache and cod not in recientes and all(v is not None for v in cache[t].values()):
            filas[t] = cache[t]
            continue
        fila = {}
        for amb, nodo in NODOS.items():
            try:
                d = _pide(nodo, pid)
            except Exception as e:                                # noqa: BLE001
                aviso(f"IECA 861 {amb} {t}: {e}")
                d = {}
            fila[f"{amb}_ext"] = d.get("Extranjero")
            fila[f"{amb}_total"] = d.get("TOTAL")
        filas[t] = fila
    xs = sorted(t for t in filas if any(v is not None for v in filas[t].values()))
    claves = [f"{a}_{k}" for a in NODOS for k in ("ext", "total")]
    return dict({"x": xs}, **{k: [filas[t].get(k) for t in xs] for k in claves})
