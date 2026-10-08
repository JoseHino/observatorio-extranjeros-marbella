# -*- coding: utf-8 -*-
"""IECA / BADEA - Instituto de Estadistica y Cartografia de Andalucia.

API REST de consultas (`.../intranet/admin/rest/v1.0/consulta/{id}`). Tiene CORS
abierto, asi que sirve tanto para el colector como, si hiciera falta, para pedir
el ultimo dato desde el propio navegador.

Cada consulta se identifica por un `idConsulta` y se filtra por los codigos de
nodo de su jerarquia territorial (no por el codigo INE del municipio). Esos
codigos NO son transferibles entre consultas: hay que sacarlos de la consulta
concreta. Los de uso frecuente se dejan anotados abajo.
"""

from .comun import get_json, aviso

REST = ("https://www.juntadeandalucia.es/institutodeestadisticaycartografia/"
        "intranet/admin/rest/v1.0")

# Consultas ya verificadas en observatorios anteriores.
CONSULTA_PARO_ANUAL = "37016"      # paro registrado, media anual por municipio
CONSULTA_AFILIACION = "876"        # afiliacion a la S. Social por municipio de residencia
                                   # mensual desde jul-2021; trimestral desde 2012

# Nodos territoriales de la consulta 876 (jerarquia 163). Ejemplos reales.
NODOS_876 = {"marbella": "2980", "malaga": "3023", "andalucia": "3143"}


def consulta(id_consulta, **filtros):
    """Lanza una consulta BADEA. Los filtros se pasan tal cual como parametros
    (p. ej. D_TERRITORIO_0="2980")."""
    q = "&".join(f"{k}={v}" for k, v in filtros.items())
    url = f"{REST}/consulta/{id_consulta}" + (f"?{q}" if q else "")
    try:
        return get_json(url)
    except Exception as e:                                        # noqa: BLE001
        aviso(f"BADEA consulta {id_consulta}: {e}")
        return {}


def filas(j):
    """Normaliza la respuesta a una lista de filas; cada fila es una lista de
    celdas {des, val}. BADEA anida las dimensiones, asi que conviene mirar las
    descripciones (`des`) en lugar de fiarse de la posicion."""
    return j.get("data", []) if isinstance(j, dict) else []


def valor(fila):
    """Primera celda con valor numerico de la fila."""
    for c in fila:
        if isinstance(c, dict) and c.get("val") is not None:
            return c["val"]
    return None


def descripciones(fila):
    return [c.get("des") for c in fila if isinstance(c, dict)]


def serie_anual(j, *contiene):
    """Extrae {"x": ["2024", ...], "v": [...]} quedandose con las filas cuyas
    descripciones contengan todos los textos indicados."""
    out = {}
    for f in filas(j):
        des = [d or "" for d in descripciones(f)]
        if not all(any(c.lower() in d.lower() for d in des) for c in contiene):
            continue
        anio = next((d for d in des if d.isdigit() and len(d) == 4), None)
        v = valor(f)
        if anio and v is not None:
            out[anio] = v
    xs = sorted(out)
    return {"x": xs, "v": [out[t] for t in xs]}
