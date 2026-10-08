# -*- coding: utf-8 -*-
"""Colector del Observatorio de Extranjeros Residentes de Marbella.

    python pipeline/build_data.py

Escribe data/data.js con las fuentes PUBLICAS. Los datos internos de la
Concejalia (padron municipal por pais y distrito, derecho a voto, eventos,
prensa) no se descargan: viven en data/concejalia.js y se actualizan a mano
con cada informe anual.

Reglas del kit que este fichero respeta:

  1. Solo lectura: GET contra fuentes publicas y nada mas.
  2. Un fallo de una fuente no tumba el panel: se registra en meta.fallos.
  3. Nunca se publica un data.js peor que el vigente (corte al 90 %).
"""

import datetime
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sources import ine, sepe, argos                        # noqa: E402
from sources.comun import escribir_js, paso, ok, aviso      # noqa: E402

# ---------------------------------------------------------------- Configuracion

MUNICIPIO = "Marbella"
INE_MUNICIPIO = "29069"

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SALIDA = os.path.join(RAIZ, "data", "data.js")

# INE - Censo anual de poblacion (op. 463), tabla 66431 "Malaga: poblacion por
# sexo y pais de nacionalidad (principales paises)". Dato a 1 de enero.
# El INE solo publica por municipio los paises "principales" de la provincia:
# Alemania o Italia, por ejemplo, van dentro de "Otros paises de Europa".
CENSO_TOTAL = "CENSO3767600"
CENSO_ESPANOLA = "CENSO3767596"
CENSO_EXTRANJERA = "CENSO29693515"
CENSO_EXT_HOMBRES = "CENSO29693581"
CENSO_EXT_MUJERES = "CENSO29693647"
CENSO_PAISES = {
    "Reino Unido": "CENSO3767587",
    "Marruecos": "CENSO3767571",
    "Colombia": "CENSO3767556",
    "Ucrania": "CENSO3767582",
    "Francia": "CENSO3767594",
    "Venezuela": "CENSO3767550",
    "Argentina": "CENSO3767559",
    "Rumanía": "CENSO3767585",
    "China": "CENSO3767547",
    "Ecuador": "CENSO3767554",
    "Cuba": "CENSO3767563",
    "Perú": "CENSO3767552",
    "Bolivia": "CENSO3767558",
    "Rep. Dominicana": "CENSO3767560",
    "Otros de Europa": "CENSO6946718",
    "Otros de América": "CENSO6946716",
    "Otros de África": "CENSO6946717",
    "Otros de Asia": "CENSO6946715",
    "Oceanía": "CENSO32544651",
}
# INE - Cifras oficiales de poblacion (padron), op. 22, tabla 2882. Para el peso
# de la poblacion extranjera antes de 2021, cuando aun no existia el Censo anual.
DPOP_TOTAL = "DPOP13669"

ANIO_INI = 2013
HOY = datetime.date.today()
ANIOS_SEPE = list(range(ANIO_INI, HOY.year + 1))


# ------------------------------------------------------------------ Recoleccion

def recoger():
    datos = {"meta": {
        "municipio": MUNICIPIO,
        "ine": INE_MUNICIPIO,
        "actualizado": datetime.datetime.now(datetime.timezone.utc)
                        .strftime("%Y-%m-%dT%H:%M:%SZ"),
    }}
    fallos = []

    # --- INE / Censo anual --------------------------------------------------
    paso("INE - Censo anual de poblacion (extranjeros)")
    censo = {}
    for clave, cod in (("total", CENSO_TOTAL), ("espanola", CENSO_ESPANOLA),
                       ("extranjera", CENSO_EXTRANJERA),
                       ("ext_hombres", CENSO_EXT_HOMBRES),
                       ("ext_mujeres", CENSO_EXT_MUJERES)):
        s = ine.anual(cod)
        if not s["x"]:
            fallos.append(f"INE {clave} ({cod})")
            continue
        censo.setdefault("x", s["x"])
        censo[clave] = _alinear(s, censo["x"])
        ok(f"{clave}: {s['x'][0]}-{s['x'][-1]}, ultimo {s['v'][-1]:,.0f}")
    paises = {}
    for nombre, cod in CENSO_PAISES.items():
        s = ine.anual(cod)
        if s["x"] and censo.get("x"):
            paises[nombre] = _alinear(s, censo["x"])
        else:
            fallos.append(f"INE pais {nombre}")
    if paises:
        censo["paises"] = paises
        ok(f"{len(paises)} nacionalidades / agrupaciones")
    if censo:
        datos["censo"] = censo

    s = ine.anual(DPOP_TOTAL)
    if s["x"]:
        datos["padron_total"] = s
        ok(f"poblacion oficial (padron): {s['x'][0]}-{s['x'][-1]}")
    else:
        fallos.append("INE DPOP total")

    # --- Argos / SAE --------------------------------------------------------
    paso("Argos (SAE) - Las personas extranjeras en el mercado de trabajo")
    try:
        a = argos.serie_marbella()
        datos["argos"] = a
        ok(f"{a['x'][0]}-{a['x'][-1]} ({len(a['x'])} ediciones)")
    except Exception as e:                                        # noqa: BLE001
        fallos.append(f"Argos: {e}")
        aviso(str(e))

    # --- SEPE ---------------------------------------------------------------
    paso("SEPE - paro registrado total del municipio")
    try:
        p = sepe.serie_municipal(ANIOS_SEPE, INE_MUNICIPIO, fichero=sepe.PARO)
        if p["x"]:
            datos["paro_total"] = {"x": p["x"], "v": p["municipio"]}
            ok(f"paro total: {p['x'][0]} - {p['x'][-1]}")
        else:
            fallos.append("SEPE paro")
    except Exception as e:                                        # noqa: BLE001
        fallos.append(f"SEPE paro: {e}")
        aviso(str(e))

    datos["meta"]["ultimo_censo"] = censo.get("x", [None])[-1]
    datos["meta"]["ultimo_argos"] = (datos.get("argos") or {}).get("x", [None])[-1]
    datos["meta"]["ultimo_paro"] = (datos.get("paro_total") or {}).get("x", [None])[-1]
    datos["meta"]["fallos"] = fallos
    return datos, fallos


def _alinear(s, xs):
    m = dict(zip(s["x"], s["v"]))
    return [m.get(t) for t in xs]


# --------------------------------------------------------------- Red de seguridad

def _contar_valores(obj):
    if isinstance(obj, dict):
        return sum(_contar_valores(v) for v in obj.values())
    if isinstance(obj, list):
        return sum(1 for v in obj if isinstance(v, (int, float)))
    return 0


def _vigente():
    if not os.path.exists(SALIDA):
        return None
    try:
        txt = open(SALIDA, encoding="utf-8").read()
        m = re.search(r"window\.\w+\s*=\s*(\{.*\});?\s*$", txt, re.S)
        return json.loads(m.group(1)) if m else None
    except Exception:                                             # noqa: BLE001
        return None


def main():
    print(f"== Observatorio de Extranjeros de {MUNICIPIO} - recoleccion ==")
    datos, fallos = recoger()

    nuevos = _contar_valores(datos)
    previo = _vigente()
    if previo is not None:
        antes = _contar_valores(previo)
        if antes and nuevos < antes * 0.9:
            aviso(f"ABORTADO: {nuevos} valores frente a {antes} publicados "
                  f"({nuevos / antes:.0%}). No se sobrescribe data.js.")
            return 1

    paso("Escritura")
    escribir_js(SALIDA, datos)
    if fallos:
        aviso(f"{len(fallos)} fuente(s) con incidencia: " + "; ".join(fallos))
    print(f"\nListo. {nuevos} valores.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
