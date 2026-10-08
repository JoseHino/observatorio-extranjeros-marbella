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

from sources import ine, sepe, argos, afiliacion, dataestur, opi, mivau   # noqa: E402
from sources.comun import escribir_js, paso, ok, aviso      # noqa: E402

# ---------------------------------------------------------------- Configuracion

MUNICIPIO = "Marbella"
INE_MUNICIPIO = "29069"

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SALIDA = os.path.join(RAIZ, "data", "data.js")

# Codigos de serie de Tempus3 localizados una vez (secciones censales, pais de
# nacimiento, migraciones). Buscarlos en cada ejecucion costaria minutos.
with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "codigos_ine.json"), encoding="utf-8") as _f:
    CODIGOS = json.load(_f)

PREVIO = None    # data.js vigente; lo rellena main() para las descargas incrementales

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

    # --- INE: nacidos en el extranjero, migraciones, matrimonios -----------
    paso("INE - pais de nacimiento, migraciones y matrimonios")
    nac = {}
    for nombre, cod in CODIGOS["nacimiento"].items():
        s = ine.anual(cod)
        if s["x"]:
            nac.setdefault("x", s["x"])
            nac[nombre] = _alinear(s, nac["x"])
    if nac:
        datos["nacimiento"] = nac
        ok(f"pais de nacimiento: {len(nac) - 1} series, {nac['x'][0]}-{nac['x'][-1]}")
    else:
        fallos.append("INE pais de nacimiento")

    mig = {}
    for clave, cod in CODIGOS["migraciones"].items():
        s = ine.anual(cod)
        if s["x"]:
            mig.setdefault("x", s["x"])
            mig[clave] = _alinear(s, mig["x"])
    if mig:
        datos["migraciones"] = mig
        ok(f"migraciones: {mig['x'][0]}-{mig['x'][-1]}")
    else:
        fallos.append("INE migraciones")

    s = ine.anual(CODIGOS["matrimonios_mixtos"])
    if s["x"]:
        datos["matrimonios_mixtos"] = s
        ok(f"matrimonios mixtos: {s['x'][0]}-{s['x'][-1]}")

    # --- INE: secciones censales (Censo anual + Atlas de renta) -------------
    paso("INE - secciones censales")
    sec = {}
    for codsec, c in CODIGOS["secciones_censo"].items():
        t, e = ine.anual(c.get("tot", "")), ine.anual(c.get("ext", ""))
        if t["x"] and e["x"]:
            sec[codsec] = {"x": t["x"], "tot": t["v"], "ext": _alinear(e, t["x"])}
    adrh = {}
    for codsec, c in CODIGOS["adrh_espanola"].items():
        s = ine.anual(c)
        if s["x"]:
            adrh.setdefault(codsec, {})["x"] = s["x"]
            adrh[codsec]["pct_ext"] = [round(100 - v, 1) for v in s["v"]]
    for codsec, c in CODIGOS["adrh_renta"].items():
        s = ine.anual(c)
        if s["x"]:
            adrh.setdefault(codsec, {})["renta"] = dict(zip(s["x"], s["v"]))
    if sec:
        datos["secciones"] = {"censo": sec, "adrh": adrh}
        ok(f"{len(sec)} secciones del Censo, {len(adrh)} del Atlas de renta")
    else:
        fallos.append("INE secciones")
    s = ine.anual(CODIGOS["adrh_renta_municipio"])
    if s["x"]:
        datos["renta_municipio"] = s

    # --- IECA: afiliacion por municipio de trabajo y nacionalidad ----------
    paso("IECA - afiliaciones de extranjeros (municipio de trabajo)")
    try:
        af = afiliacion.serie((PREVIO or {}).get("afiliacion"))
        datos["afiliacion"] = af
        ok(f"afiliacion: {af['x'][0]} - {af['x'][-1]}")
    except Exception as e:                                        # noqa: BLE001
        fallos.append(f"IECA afiliacion: {e}")
        aviso(str(e))
        if (PREVIO or {}).get("afiliacion"):
            datos["afiliacion"] = PREVIO["afiliacion"]

    # --- Dataestur: turistas internacionales --------------------------------
    paso("Dataestur - turistas internacionales (INE moviles)")
    try:
        tu = dataestur.receptor()
        datos["turismo"] = tu
        ok(f"turistas: {tu['x'][0]} - {tu['x'][-1]}")
    except Exception as e:                                        # noqa: BLE001
        fallos.append(f"Dataestur: {e}")
        aviso(str(e))
        if (PREVIO or {}).get("turismo"):
            datos["turismo"] = PREVIO["turismo"]

    # --- Contexto provincial ------------------------------------------------
    paso("OPI - documentacion de residencia en vigor (provincia)")
    try:
        datos["residencia"] = opi.residencia()
        ok(f"residencia: ultima fecha {datos['residencia']['fecha_ultima']}")
    except Exception as e:                                        # noqa: BLE001
        fallos.append(f"OPI: {e}")
        aviso(str(e))
        if (PREVIO or {}).get("residencia"):
            datos["residencia"] = PREVIO["residencia"]

    paso("MIVAU - vivienda comprada por extranjeros residentes (provincia)")
    try:
        datos["vivienda"] = mivau.vivienda()
        ok(f"vivienda: {datos['vivienda']['x'][0]} - {datos['vivienda']['x'][-1]}")
    except Exception as e:                                        # noqa: BLE001
        fallos.append(f"MIVAU: {e}")
        aviso(str(e))
        if (PREVIO or {}).get("vivienda"):
            datos["vivienda"] = PREVIO["vivienda"]

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
    global PREVIO
    print(f"== Observatorio de Extranjeros de {MUNICIPIO} - recoleccion ==")
    previo = PREVIO = _vigente()
    datos, fallos = recoger()

    nuevos = _contar_valores(datos)
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
