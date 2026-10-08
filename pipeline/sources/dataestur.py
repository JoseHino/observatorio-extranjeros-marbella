# -*- coding: utf-8 -*-
"""Dataestur (SEGITTUR) - turistas internacionales por municipio de destino y
pais de residencia, de la estadistica experimental del INE de medicion del
turismo con telefonos moviles.

No son residentes: son visitantes que pasan al menos una noche. Estadistica
experimental, con su propia definicion de turista. Publica con retraso (a
octubre de 2026 el ultimo mes es diciembre de 2025).

CSV en latin-1 con ';', sin declararlo. Intercala filas "Total ..." de agregado.
"""

import csv
import datetime
import io
from urllib.parse import quote

from .comun import get

BASE = "https://www.dataestur.es/API-SEGITTUR-v2/TURISMO_RECEPTOR_MUN_PAIS_DL"


def receptor(municipio="Marbella", provincia="Málaga"):
    hoy = datetime.date.today()
    q = (f"{quote('desde (año)')}=2019&{quote('desde (mes)')}=7"
         f"&{quote('hasta (año)')}={hoy.year}&{quote('hasta (mes)')}={hoy.month}"
         f"&Provincia={quote(provincia)}")
    txt = get(f"{BASE}?{q}", timeout=300).decode("latin-1")
    total, pais = {}, {}
    for f in csv.DictReader(io.StringIO(txt), delimiter=";"):
        if (f.get("MUNICIPIO_DESTINO") or "").strip() != municipio:
            continue
        try:
            t = f"{int(f['AÑO'])}-{int(f['MES']):02d}"
            v = int(float(f["TURISTAS"]))
        except (KeyError, ValueError, TypeError):
            continue
        p = (f.get("PAIS_ORIGEN") or "").strip()
        if p == "Total":
            total[t] = v
        elif not p.lower().startswith("total"):
            pais.setdefault(p, {})[t] = v
    xs = sorted(total)
    if not xs:
        raise ValueError("Dataestur no devolvio filas para " + municipio)
    # Ranking del ultimo año natural completo y del anterior, por pais.
    anios = sorted({t[:4] for t in xs if sum(1 for u in xs if u[:4] == t[:4]) == 12})
    ranking = {}
    for a in anios[-2:]:
        ranking[a] = sorted(((p, sum(v for t, v in m.items() if t[:4] == a)) for p, m in pais.items()),
                            key=lambda r: -r[1])[:20]
    return {"x": xs, "v": [total[t] for t in xs], "ranking": ranking,
            "anios_completos": anios}
