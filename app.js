/* ============================================================================
   app.js — Observatorio de Extranjeros Residentes · Marbella
   Declaración de secciones, KPI y tarjetas. assets/ es el kit y no se toca.

   Dos orígenes de datos:
     window.DATOS       data/data.js        fuentes públicas (INE, Argos, SEPE),
                                            lo escribe pipeline/build_data.py
     window.CONCEJALIA  data/concejalia.js  datos internos de la Concejalía,
                                            se actualiza a mano cada año
   ========================================================================== */
(function () {
  'use strict';

  var D = window.DATOS || {};
  var C = window.CONCEJALIA || {};
  var F = Obs.fmt;
  var esc = Obs.esc;

  /* ------------------------------------------------------------ Utilidades */
  var ult = function (a) { return a && a.length ? a[a.length - 1] : null; };
  var pen = function (a) { return a && a.length > 1 ? a[a.length - 2] : null; };
  var varPct = function (c, p) { return (c == null || p == null || !p) ? null : (c - p) / p * 100; };
  var suma = function (a) { return (a || []).reduce(function (s, v) { return s + (v || 0); }, 0); };
  var MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  var MESES_L = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto',
                 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  /* ---------------------------------------------------------------- Fuentes */
  var FUENTE_CENSO = { txt: 'INE · Censo anual de población', url: 'https://www.ine.es/jaxiT3/Tabla.htm?t=66431' };
  var FUENTE_DPOP = { txt: 'INE · Cifras oficiales de población', url: 'https://www.ine.es/jaxiT3/Tabla.htm?t=2882' };
  var FUENTE_ARGOS = { txt: 'Observatorio Argos (SAE) · Personas extranjeras en el mercado de trabajo',
    url: (D.argos && D.argos.pdf) || 'https://www.juntadeandalucia.es/servicioandaluzdeempleo/web/argos/web/es/ARGOS/Publicaciones/publicaciones.html' };
  var FUENTE_SEPE = { txt: 'SEPE · Paro registrado por municipios', url: 'https://www.sepe.es/HomeSepe/que-es-el-sepe/estadisticas/datos-estadisticos/municipios.html' };
  var FUENTE_CONC = { txt: 'Concejalía de Extranjeros Residentes · informes anuales', url: 'https://www.marbella.es/' };

  var CHIP_ANUAL = { txt: 'Anual', tipo: 'live' };
  var CHIP_INTERNO = { txt: 'Dato interno', tipo: 'brand' };
  var CHIP_MENSUAL = { txt: 'Mensual', tipo: 'live' };

  /* --------------------------------------------------- Datos derivados --- */
  var P = C.padron || { totales: [], continentes: {}, paises: {}, etiquetas: [] };
  var iU = (P.totales || []).length - 1;                 /* último informe */
  var CONT = Object.keys(P.continentes || {});

  /* Todas las nacionalidades del padrón municipal, con su continente. */
  var PAISES = [];
  CONT.forEach(function (ct) {
    (P.paises[ct] || []).forEach(function (r) {
      PAISES.push({ nombre: r[0], cont: ct, v: r.slice(1) });
    });
  });
  var esOtros = function (n) { return /^Otros/.test(n); };
  var nNacionalidades = PAISES.filter(function (p) { return !esOtros(p.nombre) && p.v[iU]; }).length;

  /* Serie larga de población extranjera: Argos (= padrón INE) 2013-2020 y
     Censo anual del INE desde 2021. Para 2021+ los dos coinciden. */
  var A = D.argos || { x: [] };
  var CS = D.censo || { x: [] };
  var serieLarga = (function () {
    var m = {};
    (A.x || []).forEach(function (t, i) { m[t] = A.poblacion[i]; });
    (CS.x || []).forEach(function (t, i) { if (CS.extranjera[i] != null) m[t] = CS.extranjera[i]; });
    var xs = Object.keys(m).sort();
    var tot = {};
    var pt = D.padron_total || { x: [], v: [] };
    pt.x.forEach(function (t, i) { tot[t] = pt.v[i]; });
    (CS.x || []).forEach(function (t, i) { if (CS.total[i] != null) tot[t] = CS.total[i]; });
    return {
      x: xs,
      v: xs.map(function (t) { return m[t]; }),
      pct: xs.map(function (t) { return tot[t] ? +(m[t] / tot[t] * 100).toFixed(2) : null; })
    };
  })();

  /* Paro total del SEPE a 31 de diciembre de cada año, para el peso del paro
     extranjero (Argos lo da también a 31 de diciembre). */
  var paroDic = (function () {
    var pt = D.paro_total || { x: [], v: [] };
    var m = {};
    pt.x.forEach(function (t, i) { if (/-12$/.test(t)) m[t.slice(0, 4)] = pt.v[i]; });
    return m;
  })();

  /* ============================================================ Secciones */
  var SECCIONES = [];

  /* ------------------------------------------------------- 1. Población -- */
  SECCIONES.push({
    id: 'poblacion', nombre: 'Población',
    titulo: 'Población extranjera residente',
    desc: 'Cuántos extranjeros viven en Marbella, de dónde vienen y cómo evoluciona su número. Se combinan dos fuentes que <b>miden cosas distintas</b>: el padrón municipal que gestiona el Ayuntamiento (inscripciones vigentes en la fecha del informe) y el Censo anual del INE (población a 1 de enero, después de depurar inscripciones caducadas o no confirmadas).',
    render: function () {
      var tU = P.totales[iU], tP = P.totales[iU - 1];
      var ineU = ult(CS.extranjera), ineTot = ult(CS.total);
      var gap = tP != null && ineU != null ? tP - ineU : null;

      var kpis = CONT.filter(function (ct) { return ct !== 'Oceanía'; }).map(function (ct) {
        var v = P.continentes[ct];
        return { label: ct + ' (' + P.etiquetas[iU] + ')', valor: v[iU], delta: varPct(v[iU], v[iU - 1]), deltaRef: 'vs ' + P.etiquetas[iU - 1] };
      });

      var opCont = [{ v: 'Todas', txt: 'Todas' }].concat(CONT.map(function (c) { return { v: c, txt: c }; }));
      var ranking = function (ct) {
        var l = PAISES.filter(function (p) { return (ct === 'Todas' || p.cont === ct) && !esOtros(p.nombre) && p.v[iU]; })
          .sort(function (a, b) { return b.v[iU] - a.v[iU]; }).slice(0, 15);
        return { type: 'barh', x: l.map(function (p) { return p.nombre; }), yFormat: 'num', xLabel: 'Nacionalidad',
          series: [{ name: 'Empadronados ' + P.etiquetas[iU], data: l.map(function (p) { return p.v[iU]; }) }] };
      };
      var crecen = PAISES.filter(function (p) { return !esOtros(p.nombre) && p.v[iU] != null && p.v[iU - 1] != null; })
        .map(function (p) { return { n: p.nombre, d: p.v[iU] - p.v[iU - 1] }; })
        .sort(function (a, b) { return b.d - a.d; }).slice(0, 15);

      var PRINC = ['Reino Unido', 'Marruecos', 'Colombia', 'Ucrania', 'Francia', 'Venezuela'];
      var anios = (CS.x || []);

      return {
        nota: 'A 3 de diciembre de 2024 el padrón municipal contaba <b>' + F.num(tP) + '</b> extranjeros; un mes después, a 1 de enero de 2025, el INE contaba <b>' + F.num(ineU) + '</b>. La diferencia (' + F.num(gap) + ' personas) no es un error: el INE descuenta las inscripciones de extranjeros no comunitarios sin residencia permanente que no se han renovado cada dos años y las que no tienen señales de vida administrativa. El padrón municipal es la cifra de gestión; la del INE, la oficial y comparable con otros municipios.',
        hero: {
          valor: tU, label: 'Extranjeros empadronados en Marbella · padrón municipal a 23 de noviembre de 2025',
          extra: [
            { label: 'Altas netas en el último año', valor: tU - tP, formato: function (v) { return '+' + F.num(v) + ' <small style="font-size:13px;color:var(--ink-mut)">(' + F.signo(varPct(tU, tP), 1) + ' %)</small>'; } },
            { label: 'Peso en la población (INE, 1-1-' + ult(CS.x) + ')', valor: ineTot ? ineU / ineTot * 100 : null, formato: function (v) { return F.pct(v, 1); } },
            { label: 'Nacionalidades distintas', valor: nNacionalidades }
          ]
        },
        kpis: kpis,
        cards: [
          {
            titulo: 'Población extranjera de Marbella', sub: 'Personas de nacionalidad extranjera a 1 de enero de cada año',
            chips: [CHIP_ANUAL], fuente: FUENTE_CENSO, ancho: 'full',
            nota: 'Hasta 2020, padrón continuo del INE (recogido en los informes de Argos); desde 2021, Censo anual de población del INE. Es la serie oficial, inferior al padrón municipal de gestión.',
            spec: { type: 'bar', xType: 'anual', x: serieLarga.x, yFormat: 'num', xLabel: 'Año',
              series: [{ name: 'Población extranjera', data: serieLarga.v }] }
          },
          {
            titulo: 'Peso de la población extranjera', sub: 'Porcentaje sobre la población total del municipio',
            chips: [CHIP_ANUAL], fuente: FUENTE_DPOP,
            spec: { type: 'line', xType: 'anual', x: serieLarga.x, yFormat: 'pct', xLabel: 'Año', desdeCero: false,
              series: [{ name: '% extranjeros', data: serieLarga.pct }] }
          },
          {
            titulo: 'Empadronados por continente', sub: 'Padrón municipal · ' + P.etiquetas.join(' frente a '),
            chips: [CHIP_INTERNO], fuente: FUENTE_CONC,
            spec: { type: 'bar', xType: 'cat', x: CONT, yFormat: 'num', xLabel: 'Continente', xTodas: true,
              series: P.etiquetas.map(function (e, i) {
                return { name: e, data: CONT.map(function (c) { return P.continentes[c][i]; }) };
              }) }
          },
          {
            titulo: 'Nacionalidades con más empadronados', sub: 'Padrón municipal · ' + P.etiquetas[iU] + ' · 15 primeras',
            chips: [CHIP_INTERNO], fuente: FUENTE_CONC, alto: 'tall',
            control: { label: 'Continente', valor: 'Todas', opciones: opCont, spec: ranking },
            spec: ranking('Todas')
          },
          {
            titulo: 'Nacionalidades que más crecen', sub: 'Altas netas en el padrón municipal entre ' + P.etiquetas.join(' y '),
            chips: [CHIP_INTERNO], fuente: FUENTE_CONC, alto: 'tall',
            spec: { type: 'barh', x: crecen.map(function (c) { return c.n; }), yFormat: 'num', xLabel: 'Nacionalidad',
              series: [{ name: 'Altas netas', data: crecen.map(function (c) { return c.d; }) }] }
          },
          {
            titulo: 'Principales nacionalidades según el INE', sub: 'Población a 1 de enero · serie oficial',
            chips: [CHIP_ANUAL], fuente: FUENTE_CENSO,
            nota: 'El INE solo publica por municipio las nacionalidades principales de la provincia: Italia, Alemania, Suecia o Rusia van dentro de "Otros países de Europa".',
            spec: { type: 'line', xType: 'anual', x: anios, yFormat: 'num', xLabel: 'Año', desdeCero: false,
              series: PRINC.filter(function (n) { return (CS.paises || {})[n]; }).map(function (n) { return { name: n, data: CS.paises[n] }; }) }
          },
          {
            titulo: 'Mujeres y hombres extranjeros', sub: 'Población extranjera a 1 de enero por sexo',
            chips: [CHIP_ANUAL], fuente: FUENTE_CENSO,
            spec: { type: 'stack', xType: 'anual', x: anios, yFormat: 'num', xLabel: 'Año',
              series: [{ name: 'Mujeres', data: CS.ext_mujeres }, { name: 'Hombres', data: CS.ext_hombres }] }
          }
        ]
      };
    }
  });

  /* ------------------------------------------------ 2. Distritos y voto -- */
  var DI = C.distritos || { nombres: [], valores: [[], []], fechas: [] };
  var V = C.voto || { ue: [], acuerdoUnico: [], reciprocidad: [], distritos: {} };
  SECCIONES.push({
    id: 'distritos', nombre: 'Distritos y voto',
    titulo: 'Reparto por distritos y derecho a voto',
    desc: 'Dónde viven los extranjeros empadronados y cuántos podrían votar en las elecciones municipales de 2027. El número de votantes es una <b>estimación máxima</b>: resta un 20 % de menores (criterio del Negociado de Padrón), pero no descuenta a quien no cumple los años de residencia que exigen el Reino Unido y Noruega (3) o los acuerdos de reciprocidad (5), ni a quien no ha pedido la inscripción en el censo electoral.',
    render: function () {
      var u = DI.valores.length - 1;
      var kpis = DI.nombres.map(function (n, i) {
        return { label: n + ' (' + DI.fechas[u] + ')', valor: DI.valores[u][i], delta: varPct(DI.valores[u][i], DI.valores[u - 1][i]), deltaRef: 'vs ' + DI.fechas[u - 1] };
      });
      var sum = function (l) { return l.reduce(function (s, r) { return s + r[1]; }, 0); };
      var g = [
        { n: 'Unión Europea (26 países)', e: sum(V.ue) },
        { n: 'Reino Unido y Noruega', e: sum(V.acuerdoUnico) },
        { n: 'Acuerdos de reciprocidad', e: sum(V.reciprocidad) }
      ];
      var totE = g.reduce(function (s, x) { return s + x.e; }, 0);
      var todos = V.ue.concat(V.acuerdoUnico, V.reciprocidad).slice().sort(function (a, b) { return b[1] - a[1]; }).slice(0, 15);
      var est = V.estimacion || 0.8;

      return {
        kpis: kpis,
        cards: [
          {
            titulo: 'Extranjeros empadronados por distrito', sub: DI.fechas.join(' frente a '),
            chips: [CHIP_INTERNO], fuente: FUENTE_CONC,
            spec: { type: 'bar', xType: 'cat', x: DI.nombres, yFormat: 'num', xLabel: 'Distrito', xTodas: true,
              series: DI.fechas.map(function (f, i) { return { name: f, data: DI.valores[i] }; }) }
          },
          {
            titulo: 'Reparto entre distritos', sub: 'Porcentaje de los extranjeros empadronados · ' + DI.fechas[u],
            chips: [CHIP_INTERNO], fuente: FUENTE_CONC,
            spec: { type: 'donut', x: DI.nombres, yFormat: 'pct',
              series: [{ name: 'Cuota', data: DI.valores[u].map(function (v) { return +(v / suma(DI.valores[u]) * 100).toFixed(1); }) }] }
          },
          {
            titulo: 'Electorado extranjero potencial · municipales 2027', sub: 'Empadronados de países con derecho a voto y votantes estimados (máximo) · nov 2025',
            chips: [CHIP_INTERNO], fuente: FUENTE_CONC, ancho: 'full',
            nota: F.num(totE) + ' empadronados de países con derecho a voto; como máximo ' + F.num(Math.round(totE * est)) + ' votantes una vez descontados los menores.',
            spec: { type: 'bar', xType: 'cat', xTodas: true, x: g.map(function (x) { return x.n; }), yFormat: 'num', xLabel: 'Grupo',
              series: [{ name: 'Empadronados', data: g.map(function (x) { return x.e; }) },
                       { name: 'Votantes estimados (máx.)', data: g.map(function (x) { return Math.round(x.e * est); }) }] }
          },
          {
            titulo: 'Electorado potencial por distrito', sub: 'Empadronados de países con derecho a voto · nov 2025',
            chips: [CHIP_INTERNO], fuente: FUENTE_CONC,
            nota: 'El desglose por distritos del informe no incluye Croacia, Noruega ni Cabo Verde (401 personas en total).',
            spec: { type: 'stack', xType: 'cat', x: DI.nombres, yFormat: 'num', xLabel: 'Distrito', xTodas: true,
              series: [{ name: 'Unión Europea', data: V.distritos.ue }, { name: 'Reino Unido', data: V.distritos.reinoUnido },
                       { name: 'Reciprocidad', data: V.distritos.reciprocidad }] }
          },
          {
            titulo: 'Nacionalidades con más electores potenciales', sub: 'Empadronados con derecho a voto en las municipales · nov 2025',
            chips: [CHIP_INTERNO], fuente: FUENTE_CONC, alto: 'tall',
            spec: { type: 'barh', x: todos.map(function (r) { return r[0]; }), yFormat: 'num', xLabel: 'Nacionalidad',
              series: [{ name: 'Empadronados', data: todos.map(function (r) { return r[1]; }) }] }
          }
        ]
      };
    }
  });

  /* ----------------------------------------------------------- 3. Empleo -- */
  SECCIONES.push({
    id: 'empleo', nombre: 'Empleo',
    titulo: 'Extranjeros y mercado de trabajo',
    desc: 'Paro registrado y contratación de personas extranjeras en Marbella. El paro registrado cuenta a las personas inscritas como demandantes en las oficinas de empleo a 31 de diciembre: <b>no es la tasa de paro de la EPA</b>. Por eso el indicador de esta sección es el peso de los extranjeros dentro del paro registrado del municipio, no una tasa.',
    render: function () {
      var xs = A.x || [];
      var peso = xs.map(function (t, i) { return paroDic[t] ? +(A.paro[i] / paroDic[t] * 100).toFixed(1) : null; });
      var ratio = xs.map(function (t, i) {
        var j = serieLarga.x.indexOf(t);
        return j >= 0 && serieLarga.v[j] ? +(A.paro[i] / serieLarga.v[j] * 100).toFixed(2) : null;
      });
      return {
        kpis: [
          { label: 'Paro registrado extranjero (31-12-' + ult(xs) + ')', valor: ult(A.paro), delta: varPct(ult(A.paro), pen(A.paro)), deltaRef: 'interanual', invertir: true, serie: A.paro },
          { label: 'Contratos a extranjeros en ' + ult(xs), valor: ult(A.contratos), delta: varPct(ult(A.contratos), pen(A.contratos)), deltaRef: 'interanual', serie: A.contratos },
          { label: 'Peso en el paro total del municipio', valor: ult(peso), unidad: '%', dec: 1, formato: F.num, serie: peso.filter(function (v) { return v != null; }) },
          { label: 'Parados por cada 100 extranjeros', valor: ult(ratio), dec: 1, formato: F.num, serie: ratio }
        ],
        cards: [
          {
            titulo: 'Paro registrado de personas extranjeras', sub: 'Demandantes parados a 31 de diciembre',
            chips: [CHIP_ANUAL], fuente: FUENTE_ARGOS,
            spec: { type: 'bar', xType: 'anual', x: xs, yFormat: 'num', xLabel: 'Año', series: [{ name: 'Paro extranjero', data: A.paro }] }
          },
          {
            titulo: 'Contratos a personas extranjeras', sub: 'Contratos registrados en el año en Marbella',
            chips: [CHIP_ANUAL], fuente: FUENTE_ARGOS,
            spec: { type: 'bar', xType: 'anual', x: xs, yFormat: 'num', xLabel: 'Año', series: [{ name: 'Contratos', data: A.contratos }] }
          },
          {
            titulo: 'Peso de los extranjeros en el paro registrado', sub: 'Paro extranjero sobre paro total a 31 de diciembre',
            chips: [CHIP_ANUAL], fuente: FUENTE_SEPE,
            nota: 'Paro extranjero de Argos y paro total del SEPE, ambos a 31 de diciembre. Los ficheros del SEPE de 2013 y 2020 no traen el mes de diciembre, de ahí los huecos.',
            spec: { type: 'line', xType: 'anual', x: xs, yFormat: 'pct', xLabel: 'Año', desdeCero: true, series: [{ name: '% del paro total', data: peso }] }
          },
          {
            titulo: 'Parados por cada 100 extranjeros residentes', sub: 'Paro extranjero a 31-dic sobre población extranjera a 1-ene',
            chips: [CHIP_ANUAL], fuente: FUENTE_ARGOS,
            nota: 'Es una ratio sobre toda la población extranjera (incluidos menores y jubilados), no una tasa de paro.',
            spec: { type: 'line', xType: 'anual', x: xs, yFormat: 'dec1', xLabel: 'Año', desdeCero: true, series: [{ name: 'Parados por 100', data: ratio }] }
          },
          {
            titulo: 'Paro registrado total del municipio', sub: 'Todas las nacionalidades · último día de cada mes',
            chips: [CHIP_MENSUAL], fuente: FUENTE_SEPE, ancho: 'full',
            spec: { type: 'line', xType: 'mes', x: (D.paro_total || {}).x, yFormat: 'num', series: [{ name: 'Paro registrado', data: (D.paro_total || {}).v }] }
          }
        ]
      };
    }
  });

  /* ---------------------------------------------- 4. Actividad (eventos) -- */
  var EV = (C.eventos || []).map(function (e) {
    return {
      anio: e.f.slice(0, 4), mes: e.sinFecha ? null : +e.f.slice(5, 7), dia: e.sinFecha ? null : +e.f.slice(8, 10),
      f: e.f, fin: e.fin, t: e.t, l: e.l, tipo: e.tipo, com: e.com, aprox: !!e.aprox, sinFecha: !!e.sinFecha, nota: e.nota
    };
  });
  var TIPOS = C.tipos || {};
  var ANIOS_EV = EV.map(function (e) { return e.anio; }).filter(function (v, i, a) { return a.indexOf(v) === i; }).sort();
  var cuenta = function (lista, clave) {
    var m = {};
    lista.forEach(function (e) { var k = e[clave]; if (k != null) m[k] = (m[k] || 0) + 1; });
    return m;
  };
  var COMS = (function () {
    var m = cuenta(EV, 'com');
    return Object.keys(m).sort(function (a, b) { return m[b] - m[a] || a.localeCompare(b); });
  })();
  var FILTRO = { anio: 'todos', mes: 'todos', tipo: 'todos', com: 'todos' };
  var pasa = function (e, ign) {
    return (ign === 'anio' || FILTRO.anio === 'todos' || e.anio === FILTRO.anio) &&
      (ign === 'mes' || FILTRO.mes === 'todos' || String(e.mes) === FILTRO.mes) &&
      (ign === 'tipo' || FILTRO.tipo === 'todos' || e.tipo === FILTRO.tipo) &&
      (ign === 'com' || FILTRO.com === 'todos' || e.com === FILTRO.com);
  };
  /* Orden cronológico; los actos sin fecha, al final de su año. */
  var porFecha = function (a, b) {
    var ka = a.sinFecha ? a.anio + '-99' : a.f, kb = b.sinFecha ? b.anio + '-99' : b.f;
    return ka < kb ? -1 : ka > kb ? 1 : 0;
  };
  var fechaTxt = function (e) {
    if (e.sinFecha) return 'Sin fecha (' + e.anio + ')';
    var d = e.dia + ' ' + MESES[e.mes - 1] + ' ' + e.anio;
    if (e.fin) {
      var m2 = +e.fin.slice(5, 7), d2 = +e.fin.slice(8, 10);
      d = m2 === e.mes ? e.dia + '–' + d2 + ' ' + MESES[e.mes - 1] + ' ' + e.anio
                       : e.dia + ' ' + MESES[e.mes - 1] + ' – ' + d2 + ' ' + MESES[m2 - 1] + ' ' + e.anio;
    }
    return d + (e.aprox ? ' <span class="ev-aprox" title="Fecha aproximada: la fuente no da el día">aprox.</span>' : '');
  };
  var sel = function (clave, etiqueta, opciones) {
    return '<label class="obs-card-ctrl"><span>' + etiqueta + '</span><select class="obs-select" data-evf="' + clave + '">' +
      opciones.map(function (o) {
        return '<option value="' + esc(o.v) + '"' + (String(FILTRO[clave]) === String(o.v) ? ' selected' : '') + '>' + esc(o.txt) + '</option>';
      }).join('') + '</select></label>';
  };

  SECCIONES.push({
    id: 'eventos', nombre: 'Actividad',
    titulo: 'Eventos y acciones de la Concejalía',
    desc: 'Todos los actos de las relaciones anuales de la Concejalía (' + ANIOS_EV.join(', ') + '), clasificados por tipo y por la comunidad a la que van dirigidos. Los filtros se aplican a todas las gráficas y al listado; cada gráfica ignora el filtro de su propio eje para que se pueda comparar.',
    render: function () {
      var sel_ = EV.filter(function (e) { return pasa(e); });
      var filtros = '<div class="ev-filtros">' +
        sel('anio', 'Año', [{ v: 'todos', txt: 'Todos' }].concat(ANIOS_EV.map(function (a) { return { v: a, txt: a }; }))) +
        sel('mes', 'Mes', [{ v: 'todos', txt: 'Todos' }].concat(MESES_L.map(function (m, i) { return { v: String(i + 1), txt: m }; }))) +
        sel('tipo', 'Tipo', [{ v: 'todos', txt: 'Todos' }].concat(Object.keys(TIPOS).map(function (k) { return { v: k, txt: TIPOS[k] }; }))) +
        sel('com', 'Comunidad', [{ v: 'todos', txt: 'Todas' }].concat(COMS.map(function (c) { return { v: c, txt: c }; }))) +
        '<button type="button" class="obs-btn" data-ev-reset>Quitar filtros</button>' +
        '</div>';

      /* Eventos por mes: una serie por año (ignora el filtro de mes). */
      var porMesBase = EV.filter(function (e) { return pasa(e, 'mes') && e.mes; });
      var aniosMes = FILTRO.anio === 'todos' ? ANIOS_EV : [FILTRO.anio];
      var serMes = aniosMes.map(function (a) {
        return { name: a, data: MESES.map(function (_, i) {
          return porMesBase.filter(function (e) { return e.anio === a && e.mes === i + 1; }).length;
        }) };
      });
      /* Por año y tipo (ignora el filtro de año). */
      var baseAnio = EV.filter(function (e) { return pasa(e, 'anio'); });
      var tiposPresentes = Object.keys(TIPOS);
      var serAnio = tiposPresentes.map(function (k) {
        return { name: TIPOS[k], data: ANIOS_EV.map(function (a) {
          return baseAnio.filter(function (e) { return e.anio === a && e.tipo === k; }).length;
        }) };
      }).filter(function (s) { return suma(s.data) > 0; });
      /* Por tipo (ignora el filtro de tipo). */
      var mT = cuenta(EV.filter(function (e) { return pasa(e, 'tipo'); }), 'tipo');
      var kT = Object.keys(TIPOS).filter(function (k) { return mT[k]; }).sort(function (a, b) { return mT[b] - mT[a]; });
      /* Por comunidad (ignora el filtro de comunidad). */
      var mC = cuenta(EV.filter(function (e) { return pasa(e, 'com'); }), 'com');
      var kC = Object.keys(mC).sort(function (a, b) { return mC[b] - mC[a] || a.localeCompare(b); }).slice(0, 15);

      var nComs = Object.keys(cuenta(sel_, 'com')).length;
      var mesesAct = Object.keys(cuenta(sel_.filter(function (e) { return e.mes; }), 'mes')).length;

      /* Listado */
      var orden = sel_.slice().sort(porFecha);
      var filas = orden.map(function (e) {
        return '<tr><td>' + fechaTxt(e) + '</td><td class="ev-t">' + esc(e.t) +
          (e.nota ? ' <span class="ev-nota" title="' + esc(e.nota) + '">corregido</span>' : '') + '</td><td>' + esc(e.com) +
          '</td><td>' + esc(TIPOS[e.tipo] || e.tipo) + '</td><td>' + esc(e.l || '') + '</td></tr>';
      }).join('');
      var listado = '<div class="obs-grid cols-1" style="margin-top:16px"><article class="obs-card">' +
        '<div class="obs-card-head"><div class="t"><h3>Listado de eventos</h3><div class="cs">' + orden.length + ' actos con los filtros aplicados · ordenados por fecha</div></div>' +
        '<div class="obs-card-tools"><button type="button" class="obs-icon-btn" data-ev-csv title="Descargar el listado en CSV">' + Obs.icono.csv() + '</button></div></div>' +
        '<div class="ev-lista">' + (orden.length
          ? '<table class="obs-table ev-tabla"><thead><tr><th>Fecha</th><th>Acto</th><th>Comunidad</th><th>Tipo</th><th>Lugar</th></tr></thead><tbody>' + filas + '</tbody></table>'
          : '<p class="ev-vacio">Ningún acto cumple los filtros elegidos.</p>') + '</div>' +
        '<div class="obs-card-foot"><span class="obs-chip brand">Dato interno</span><span>Fuente: relaciones anuales de eventos de la Concejalía. "aprox." = la fuente no da el día; "corregido" = fecha corregida respecto al documento (pasar el ratón para ver el motivo).</span></div>' +
        '</article></div>';

      return {
        nota: filtros,
        kpis: [
          { label: 'Actos con los filtros aplicados', valor: sel_.length },
          { label: 'Comunidades distintas', valor: nComs },
          { label: 'Meses con actividad', valor: mesesAct },
          { label: 'Elecciones consulares acogidas', valor: sel_.filter(function (e) { return e.tipo === 'elecciones'; }).length }
        ],
        cards: [
          {
            titulo: 'Actos por mes', sub: FILTRO.anio === 'todos' ? 'Comparación entre años' : 'Año ' + FILTRO.anio,
            chips: [CHIP_INTERNO], fuente: FUENTE_CONC, ancho: 'full',
            spec: { type: 'bar', xType: 'cat', x: MESES, yFormat: 'num', xLabel: 'Mes', xTodas: true, series: serMes,
              vacioTxt: 'Ningún acto con fecha cumple los filtros.' }
          },
          {
            titulo: 'Actos por año y tipo', sub: 'Número de actos de cada relación anual',
            chips: [CHIP_INTERNO], fuente: FUENTE_CONC, ancho: 'full',
            spec: { type: 'stack', xType: 'cat', x: ANIOS_EV, yFormat: 'num', xLabel: 'Año', xTodas: true, series: serAnio,
              vacioTxt: 'Ningún acto cumple los filtros.' }
          },
          {
            titulo: 'Actos por tipo', sub: 'Reparto con los filtros aplicados',
            chips: [CHIP_INTERNO], fuente: FUENTE_CONC,
            spec: { type: 'barh', x: kT.map(function (k) { return TIPOS[k]; }), yFormat: 'num', xLabel: 'Tipo',
              series: [{ name: 'Actos', data: kT.map(function (k) { return mT[k]; }) }], vacioTxt: 'Ningún acto cumple los filtros.' }
          },
          {
            titulo: 'Comunidades con más actos', sub: 'Las 15 primeras con los filtros aplicados',
            chips: [CHIP_INTERNO], fuente: FUENTE_CONC, alto: 'tall',
            spec: { type: 'barh', x: kC, yFormat: 'num', xLabel: 'Comunidad',
              series: [{ name: 'Actos', data: kC.map(function (k) { return mC[k]; }) }], vacioTxt: 'Ningún acto cumple los filtros.' }
          }
        ],
        extra: listado
      };
    }
  });

  /* Filtros de eventos: un listener delegado (nunca onclick en el marcado). */
  document.addEventListener('change', function (ev) {
    var s = ev.target.closest && ev.target.closest('select[data-evf]');
    if (!s) return;
    FILTRO[s.getAttribute('data-evf')] = s.value;
    Obs.refrescar('eventos');
  });
  document.addEventListener('click', function (ev) {
    if (ev.target.closest && ev.target.closest('[data-ev-reset]')) {
      FILTRO = { anio: 'todos', mes: 'todos', tipo: 'todos', com: 'todos' };
      Obs.refrescar('eventos');
      return;
    }
    if (ev.target.closest && ev.target.closest('[data-ev-csv]')) {
      var l = EV.filter(function (e) { return pasa(e); }).sort(porFecha);
      var q = function (s) { return '"' + String(s == null ? '' : s).replace(/"/g, '""') + '"'; };
      var csv = ['Fecha;Fin;Fecha aproximada;Acto;Comunidad;Tipo;Lugar;Nota'].concat(l.map(function (e) {
        return [e.sinFecha ? e.anio : e.f, e.fin || '', e.aprox ? 'sí' : '', q(e.t), q(e.com), q(TIPOS[e.tipo]), q(e.l), q(e.nota)].join(';');
      })).join('\r\n');
      var a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
      a.download = 'eventos_concejalia_extranjeros.csv';
      document.body.appendChild(a); a.click(); a.remove();
    }
  });

  /* ----------------------------------------------------------- 5. Prensa -- */
  var PR = C.prensa || [];
  SECCIONES.push({
    id: 'prensa', nombre: 'Prensa',
    titulo: 'Presencia en medios · 2025',
    desc: 'Noticias y entrevistas recogidas en el anexo de prensa de la Concejalía. Solo existe para 2025: es un indicador a mantener cada año para poder compararlo.',
    render: function () {
      var mM = cuenta(PR, 'medio');
      var kM = Object.keys(mM).sort(function (a, b) { return mM[b] - mM[a] || a.localeCompare(b); });
      var porMes = MESES.map(function (_, i) { return PR.filter(function (p) { return +p.f.slice(5, 7) === i + 1; }).length; });
      var idi = { es: 'Español', en: 'Inglés', de: 'Alemán' };
      var filas = PR.map(function (p) {
        var m = +p.f.slice(5, 7);
        return '<tr><td>' + (p.aprox ? MESES[m - 1] + ' 2025 <span class="ev-aprox">aprox.</span>' : (+p.f.slice(8, 10)) + ' ' + MESES[m - 1] + ' 2025') +
          '</td><td>' + esc(p.medio) + '</td><td>' + esc(idi[p.idioma] || p.idioma) + '</td><td class="ev-t">' + esc(p.tema) + '</td></tr>';
      }).join('');
      return {
        kpis: [
          { label: 'Impactos en prensa', valor: PR.length },
          { label: 'Medios distintos', valor: kM.length },
          { label: 'En inglés o alemán', valor: PR.filter(function (p) { return p.idioma !== 'es'; }).length },
          { label: 'Día de Europa (9 de mayo)', valor: PR.filter(function (p) { return /Europ/.test(p.tema); }).length }
        ],
        cards: [
          {
            titulo: 'Impactos por medio', sub: 'Noticias y entrevistas de 2025',
            chips: [CHIP_INTERNO], fuente: FUENTE_CONC,
            spec: { type: 'barh', x: kM, yFormat: 'num', xLabel: 'Medio', series: [{ name: 'Impactos', data: kM.map(function (k) { return mM[k]; }) }] }
          },
          {
            titulo: 'Impactos por mes', sub: '2025',
            chips: [CHIP_INTERNO], fuente: FUENTE_CONC,
            spec: { type: 'bar', xType: 'cat', x: MESES, yFormat: 'num', xLabel: 'Mes', xTodas: true, series: [{ name: 'Impactos', data: porMes }] }
          }
        ],
        extra: '<div class="obs-grid cols-1" style="margin-top:16px"><article class="obs-card"><div class="obs-card-head"><div class="t"><h3>Relación de noticias</h3><div class="cs">Anexo de prensa 2025</div></div></div>' +
          '<div class="ev-lista"><table class="obs-table ev-tabla"><thead><tr><th>Fecha</th><th>Medio</th><th>Idioma</th><th>Tema</th></tr></thead><tbody>' + filas + '</tbody></table></div>' +
          '<div class="obs-card-foot"><span class="obs-chip brand">Dato interno</span><span>Fuente: anexo de prensa 2025 de la Concejalía. Las piezas sin fecha en el recorte se sitúan en su mes aproximado.</span></div></article></div>'
      };
    }
  });

  /* ------------------------------------------------- 6. Calidad del dato -- */
  SECCIONES.push({
    id: 'calidad', nombre: 'Calidad del dato',
    titulo: 'Cobertura y calidad de los datos',
    desc: 'Qué años cubre cada indicador y qué incoherencias se han encontrado en los documentos de la Concejalía al montar el observatorio. Corregirlas en origen evita que un mismo dato aparezca con dos cifras distintas.',
    render: function () {
      var si = '<span class="cov si">Sí</span>', no = '<span class="cov no">—</span>';
      var cov = [
        ['Eventos y acciones', si, si, si, 'Concejalía'],
        ['Empadronados por país y continente', no, si, si, 'Concejalía'],
        ['Empadronados por distrito', no, si, si, 'Concejalía (2024: solo total)'],
        ['Derecho a voto (y por distrito)', no, no, si, 'Concejalía'],
        ['Impactos en prensa', no, no, si, 'Concejalía'],
        ['Consultas atendidas (NIE, padrón, ayudas…)', no, no, no, 'No se registran en cifras'],
        ['Población extranjera oficial y por nacionalidad', si, si, si, 'INE (2013–' + (ult(serieLarga.x) || '') + ')'],
        ['Paro y contratos de extranjeros', si, si, si, 'Argos (2013–' + (ult(A.x) || '') + ')']
      ];
      var tabla = '<table class="obs-table ev-tabla"><thead><tr><th>Indicador</th><th>2023</th><th>2024</th><th>2025</th><th>Origen</th></tr></thead><tbody>' +
        cov.map(function (r) { return '<tr><td>' + r[0] + '</td><td>' + r[1] + '</td><td>' + r[2] + '</td><td>' + r[3] + '</td><td>' + r[4] + '</td></tr>'; }).join('') +
        '</tbody></table>';
      var inc = '<ol class="ev-inc">' + (C.incidencias || []).map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ol>';
      var reco = '<ol class="ev-inc">' +
        '<li>Llevar los eventos en una sola hoja con columnas fijas (fecha, acto, comunidad, tipo, lugar, asistentes, coste) en vez de un texto por año.</li>' +
        '<li>Registrar cada mes el número de consultas atendidas por tipo (NIE/TIE, padrón, ayudas sociales, Patronato, asociaciones). Hoy es la actividad principal de la oficina y no se mide.</li>' +
        '<li>Pedir al Padrón el mismo corte (por país y por distrito) en la misma fecha cada año, por ejemplo el 1 de enero, para que sea comparable con el INE.</li>' +
        '<li>Mantener el anexo de prensa todos los años.</li></ol>';
      var bloque = function (t, sub, html) {
        return '<article class="obs-card"><div class="obs-card-head"><div class="t"><h3>' + t + '</h3><div class="cs">' + sub + '</div></div></div><div class="ev-lista ev-texto">' + html + '</div></article>';
      };
      return {
        extra: '<div class="obs-grid cols-1">' +
          bloque('Años cubiertos por cada indicador', 'Solo los eventos tienen los tres años en los datos internos; las fuentes públicas dan series largas', tabla) +
          bloque('Incoherencias encontradas en los documentos', 'El observatorio usa en cada caso la tabla completa por país y deja aquí la otra cifra', inc) +
          bloque('Recomendaciones para el próximo informe', 'Para que el observatorio se actualice sin retrabajo', reco) +
          '</div>'
      };
    }
  });

  /* ----------------------------------------------------------- Arranque -- */
  Obs.init({
    titulo: 'Observatorio de Extranjeros Residentes · Marbella',
    subtitulo: 'Concejalía de Extranjeros Residentes · población, distritos, empleo y actividad',
    secciones: SECCIONES,
    actualizado: (D.meta || {}).actualizado,
    icono: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>',
    fuentes: [FUENTE_CENSO, FUENTE_DPOP, FUENTE_ARGOS, FUENTE_SEPE, FUENTE_CONC],
    metodologia: 'Las fuentes públicas (INE, Argos, SEPE) las descarga cada mes un proceso automático (<code>pipeline/build_data.py</code>). ' +
      'Los datos internos de la Concejalía (padrón municipal por país y distrito, voto, eventos y prensa) se transcriben de sus informes anuales a <code>data/concejalia.js</code>. ' +
      'Cada tarjeta indica su origen y permite ver los datos en tabla y descargarlos.',
    pie: 'El padrón municipal y el Censo del INE miden cosas distintas y no deben sumarse ni restarse sin decirlo. ' +
      'El paro registrado no es la tasa de paro de la EPA. Los votantes estimados son un máximo.'
  });

  Obs.estado('Último dato del INE: 1 de enero de ' + ((D.meta || {}).ultimo_censo || '—') +
    ' · padrón municipal: ' + (P.etiquetas[iU] || '—'), 'live');

})();
