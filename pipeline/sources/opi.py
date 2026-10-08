# -*- coding: utf-8 -*-
"""Observatorio Permanente de la Inmigracion (Ministerio de Inclusion) -
personas extranjeras con documentacion de residencia en vigor, por provincia.

El dato NO baja a municipio: es la provincia de Malaga, como contexto. Se lee el
fichero PC-Axis completo (~50 MB) de OPIbase. Dimensiones:
  STUB    = Provincia, Clase de documentacion, Tipo de documentacion
  HEADING = Principales paises de nacionalidad, Sexo, Fecha
La matriz DATA va por filas de STUB y, dentro de cada fila, el HEADING con la
ultima variable (Fecha) moviendose mas rapido.
"""

import re

from .comun import get

PX = ("https://expinterweb.inclusion.gob.es/jaxiPx/files/_px/es/px/"
      "stock_documentacion/l0/TD_PV_SX_PNDAD_TIPO.px")
WEB = ("https://www.inclusion.gob.es/web/opi/estadisticas/catalogo/stock_documentacion")


def _valores(meta, var):
    m = re.search(r'VALUES\("' + re.escape(var) + r'"\)=(.*?);', meta, re.S)
    return re.findall(r'"([^"]*)"', m.group(1))


def _lista(meta, clave):
    m = re.search(clave + r"=(.*?);", meta, re.S)
    return re.findall(r'"([^"]*)"', m.group(1))


def residencia(provincia="Málaga"):
    txt = get(PX, timeout=600).decode("cp1252", errors="replace")
    i = txt.find("DATA=")
    meta, datos = txt[:i], txt[i + 5:]
    stub, head = _lista(meta, "STUB"), _lista(meta, "HEADING")
    vals = {v: _valores(meta, v) for v in stub + head}
    ncols = 1
    for v in head:
        ncols *= len(vals[v])

    def fila(prov, clase, tipo):
        idx = 0
        for var, val in zip(stub, (prov, clase, tipo)):
            idx = idx * len(vals[var]) + vals[var].index(val)
        return idx

    tokens = datos.replace(";", " ").split()
    nac, sexo, fecha = vals[head[0]], vals[head[1]], vals[head[2]]
    tipo_var = stub[2]

    def celda(r, n, s, f):
        c = (n * len(sexo) + s) * len(fecha) + f
        tok = tokens[r * ncols + c]
        try:
            return float(tok)
        except ValueError:
            return None                                   # "." / ".." = sin dato

    fechas_orden = sorted(range(len(fecha)), key=lambda k: fecha[k])
    x = [fecha[k][:7] for k in fechas_orden]
    out = {"x": x, "tipos": {}, "paises": {}, "fecha_ultima": fecha[fechas_orden[-1]]}
    for tipo in vals[tipo_var]:
        r = fila(provincia, "Total", tipo)
        out["tipos"][tipo] = [celda(r, 0, 0, k) for k in fechas_orden]
    r_tot = fila(provincia, "Total", "Total")
    ult = fechas_orden[-1]
    for n, nombre in enumerate(nac):
        if n == 0:
            continue
        out["paises"][nombre] = celda(r_tot, n, 0, ult)
    return out
