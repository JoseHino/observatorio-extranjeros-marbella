# -*- coding: utf-8 -*-
"""Ministerio de Vivienda (MIVAU) - transacciones inmobiliarias de vivienda libre.

El desglose de extranjeros residentes en Espana solo existe por provincia y en
VALOR (miles de euros) y valor medio, no en numero de compraventas. Se usa como
contexto provincial: que parte del dinero que se gasta en vivienda libre en la
provincia de Malaga lo ponen extranjeros residentes.

Cada .XLS trae una hoja por grupo de años/trimestres; las filas son provincias y
la columna "TOTAL" es la vivienda libre (nueva + segunda mano).
"""

import io
import re

import xlrd

from .comun import get

BASE = "https://apps.fomento.gob.es/BoletinOnline2/sedal/"
VALOR_TOTAL = "34020110"        # valor de las transacciones de vivienda libre
VALOR_EXTR = "34020140"         # idem, extranjeros residentes en Espana
MEDIO_TOTAL = "34020150"        # valor medio
MEDIO_EXTR = "34020180"         # valor medio, extranjeros residentes
WEB = "https://apps.fomento.gob.es/BoletinOnline2/?nivel=2&orden=34000000"


def _norm(s):
    return re.sub(r"\s+", " ", str(s)).strip().lower()


def _serie(codigo, territorio):
    """Lee las dos maquetaciones que usa el Ministerio:
       A) una hoja por trimestre ("1t 2019") con columna "TOTAL";
       B) una hoja por grupo de años con una fila "Año AAAA" y debajo los
          trimestres "1º".."4º" en columnas."""
    libro = xlrd.open_workbook(file_contents=get(BASE + codigo + ".XLS"))
    out = {}
    for hoja in libro.sheets():
        m = re.match(r"(\d)t (\d{4})", hoja.name.strip())
        if m:
            out.update(_hoja_trimestre(hoja, territorio, f"{m.group(2)}T{m.group(1)}"))
        else:
            out.update(_hoja_anios(hoja, territorio))
    return out


def _hoja_anios(hoja, territorio):
    out, cols = {}, {}
    for r in range(min(hoja.nrows, 40)):
        fila = [_norm(c) for c in hoja.row_values(r)]
        if any(re.match(r"año \d{4}", c) for c in fila):
            anio = None
            trims = [_norm(c) for c in hoja.row_values(r + 2)]
            for c, v in enumerate(fila):
                mm = re.match(r"año (\d{4})", v)
                if mm:
                    anio = mm.group(1)
                q = re.match(r"(\d)", trims[c]) if c < len(trims) else None
                if anio and q:
                    cols[c] = f"{anio}T{q.group(1)}"
            break
    for r in range(hoja.nrows):
        fila = hoja.row_values(r)
        if len(fila) > 1 and _norm(fila[1]) == territorio:
            for c, t in cols.items():
                if isinstance(fila[c], float):
                    out[t] = fila[c]
            break
    return out


def _hoja_trimestre(hoja, territorio, trimestre):
    out = {}
    col_total = None
    for r in range(hoja.nrows):
        fila = [_norm(c) for c in hoja.row_values(r)]
        if col_total is None and "total" in fila and r < 30:
            col_total = fila.index("total")
        if col_total is not None and len(fila) > 1 and fila[1] == territorio:
            v = hoja.row_values(r)[col_total]
            if isinstance(v, float):
                out[trimestre] = v
            break
    return out


def vivienda(provincia="málaga"):
    res = {}
    for clave, cod in (("valor_total", VALOR_TOTAL), ("valor_extr", VALOR_EXTR),
                       ("medio_total", MEDIO_TOTAL), ("medio_extr", MEDIO_EXTR)):
        res[clave] = {"prov": _serie(cod, provincia), "esp": _serie(cod, "total nacional")}
    xs = sorted(set(res["valor_extr"]["prov"]) & set(res["valor_total"]["prov"]))
    if not xs:
        raise ValueError("MIVAU: no se encontraron trimestres comunes")

    def pct(amb):
        return [round(res["valor_extr"][amb][t] / res["valor_total"][amb][t] * 100, 1)
                if res["valor_total"][amb].get(t) and res["valor_extr"][amb].get(t) is not None else None
                for t in xs]
    return {
        "x": xs,
        "peso_malaga": pct("prov"), "peso_espana": pct("esp"),
        "valor_extr_malaga": [res["valor_extr"]["prov"].get(t) for t in xs],
        "medio_extr_malaga": [res["medio_extr"]["prov"].get(t) for t in xs],
        "medio_total_malaga": [res["medio_total"]["prov"].get(t) for t in xs],
    }
