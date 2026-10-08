# -*- coding: utf-8 -*-
"""Argos (Servicio Andaluz de Empleo) - "Las personas extranjeras en el mercado
de trabajo andaluz", informe anual.

Es la UNICA fuente publica que da, por municipio, el paro registrado y los
contratos de personas extranjeras. Viene en PDF: la tabla municipal de Malaga
trae, por fila, poblacion extranjera, contratos a personas extranjeras en el
año y paro registrado extranjero a 31 de diciembre.

Las ediciones ya leidas se dejan fijas en HISTORICO (no cambian una vez
publicadas). En cada ejecucion se mira la pagina de publicaciones y, si hay una
edicion nueva, se descarga y se extrae la fila de Marbella. Requiere PyMuPDF.
"""

import re

from .comun import get, aviso, ok

PUBLICACIONES = ("https://www.juntadeandalucia.es/servicioandaluzdeempleo/web/"
                 "argos/web/es/ARGOS/Publicaciones/publicaciones.html")
PDF = ("https://www.juntadeandalucia.es/servicioandaluzdeempleo/web/argos/web/"
       "es/ARGOS/Publicaciones/pdf/")

# año: (poblacion extranjera, contratos a extranjeros, paro extranjero 31-dic)
# Leido de cada edicion (tabla "Malaga - tablas provinciales y municipales").
HISTORICO = {
    "2013": (39500, 13895, 3344),
    "2014": (35155, 13528, 2988),
    "2015": (33931, 14529, 2679),
    "2016": (33446, 15911, 2476),
    "2017": (33228, 17113, 2573),
    "2018": (33451, 18274, 2336),
    "2019": (35253, 18644, 2451),
    "2020": (38693, 11281, 3941),
    "2021": (38769, 15802, 2161),
    "2022": (41141, 18775, 1800),
    "2023": (46094, 17182, 1766),
    "2024": (48257, 17557, 1565),
    "2025": (49813, 18662, 1503),
}
ENLACES = {
    "2025": "20260714_extranjeros_2025.pdf",
}


def _n(s):
    return int(s.replace(".", "").strip())


def _fila_marbella(pdf_bytes):
    import fitz  # PyMuPDF

    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    for pag in doc:
        lineas = [x.strip() for x in pag.get_text().split("\n")]
        if "Marbella" not in lineas:
            continue
        if not any("PARO" in x.upper() for x in lineas[:20]):
            continue
        k = lineas.index("Marbella")
        try:
            return tuple(_n(v) for v in lineas[k + 1:k + 4])
        except ValueError:
            continue
    return None


def ediciones_publicadas():
    html = get(PUBLICACIONES).decode("utf-8", errors="replace")
    out = {}
    for f, anio in re.findall(r"(\d{8}_extranjeros_(\d{4})(?:_\d)?\.pdf)", html):
        out[anio] = f
    return out


def serie_marbella():
    tabla = dict(HISTORICO)
    try:
        nuevas = {a: f for a, f in ediciones_publicadas().items() if a not in tabla}
    except Exception as e:                                        # noqa: BLE001
        aviso(f"Argos: no se pudo leer la pagina de publicaciones ({e})")
        nuevas = {}
    for anio, fichero in sorted(nuevas.items()):
        try:
            fila = _fila_marbella(get(PDF + fichero))
        except Exception as e:                                    # noqa: BLE001
            aviso(f"Argos {anio}: {e}")
            continue
        if fila:
            tabla[anio] = fila
            ENLACES[anio] = fichero
            ok(f"Argos {anio}: edicion nueva leida {fila}")
        else:
            aviso(f"Argos {anio}: no se encontro la fila de Marbella")
    xs = sorted(tabla)
    return {
        "x": xs,
        "poblacion": [tabla[a][0] for a in xs],
        "contratos": [tabla[a][1] for a in xs],
        "paro": [tabla[a][2] for a in xs],
        "pdf": PDF + ENLACES[max(ENLACES)],
    }
