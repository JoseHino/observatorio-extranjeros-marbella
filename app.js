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
  var FUENTE_NAC = { txt: 'INE · Censo anual: país de nacimiento', url: 'https://www.ine.es/jaxiT3/Tabla.htm?t=66430' };
  var FUENTE_MIG = { txt: 'INE · Estadística de Migraciones y Cambios de Residencia', url: 'https://www.ine.es/jaxiT3/Tabla.htm?t=69767' };
  var FUENTE_MAT = { txt: 'INE · Estadística de Matrimonios', url: 'https://www.ine.es/jaxiT3/Tabla.htm?t=53668' };
  var FUENTE_SEC = { txt: 'INE · Censo anual por sección censal', url: 'https://www.ine.es/jaxiT3/Tabla.htm?t=69214' };
  var FUENTE_ADRH = { txt: 'INE · Atlas de distribución de renta de los hogares', url: 'https://www.ine.es/jaxiT3/Tabla.htm?t=31114' };
  var FUENTE_AFIL = { txt: 'IECA · Afiliaciones por municipio de trabajo y nacionalidad',
    url: 'https://www.juntadeandalucia.es/institutodeestadisticaycartografia/badea/operaciones/consulta/anual/861?CodOper=b3_291&codConsulta=861' };
  var FUENTE_TUR = { txt: 'INE · Medición del turismo con teléfonos móviles (vía Dataestur)', url: 'https://www.dataestur.es/' };
  var FUENTE_OPI = { txt: 'Observatorio Permanente de la Inmigración · documentación de residencia', url: 'https://www.inclusion.gob.es/web/opi/estadisticas/catalogo/stock_documentacion' };
  var FUENTE_MIVAU = { txt: 'Ministerio de Vivienda · transacciones inmobiliarias', url: 'https://apps.fomento.gob.es/BoletinOnline2/?nivel=2&orden=34000000' };
  var CHIP_TRIM = { txt: 'Trimestral', tipo: 'live' };
  var CHIP_PROV = { txt: 'Provincia de Málaga', tipo: 'warn' };
  var CHIP_EXP = { txt: 'Experimental', tipo: 'warn' };

  /* Distritos censales del INE: la numeración coincide con la de los cuatro
     distritos municipales (comprobado por la posición de sus secciones). */
  var DIST = { '01': 'Marbella', '02': 'San Pedro Alcántara', '03': 'Nueva Andalucía', '04': 'Las Chapas' };

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

  /* País de nacimiento (INE): nacidos fuera = total − nacidos en España. */
  var NAC = (function () {
    var n = D.nacimiento || { x: [] };
    var xs = n.x || [];
    var fuera = xs.map(function (_, i) {
      return n.Total && n['España'] && n.Total[i] != null && n['España'][i] != null ? n.Total[i] - n['España'][i] : null;
    });
    var u = xs.length - 1, cu = (CS.x || []).indexOf(xs[u]);
    var alias = function (k) { return k === 'República Dominicana' ? 'Rep. Dominicana' : k; };
    var comparar = Object.keys(n).filter(function (k) {
      return k !== 'x' && k !== 'Total' && k !== 'España' && !/^Otros/.test(k) && (CS.paises || {})[alias(k)];
    }).map(function (k) { return [k, n[k][u], cu >= 0 ? CS.paises[alias(k)][cu] : null]; })
      .sort(function (a, b) { return (b[1] || 0) - (a[1] || 0); });
    return { x: xs, nacidosFuera: fuera, comparar: comparar,
      pct: n.Total ? fuera[u] / n.Total[u] * 100 : null, ultimo: fuera[u] };
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
            { label: 'Nacionalidades distintas', valor: nNacionalidades },
            { label: 'Nacidos en el extranjero (INE)', valor: NAC.ultimo, formato: function (v) { return F.num(v) + ' <small style="font-size:13px;color:var(--ink-mut)">(' + F.pct(NAC.pct, 1) + ')</small>'; } }
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
          },
          {
            titulo: 'Nacidos en el extranjero y de nacionalidad extranjera', sub: 'Población a 1 de enero · dos formas de contar a la población de origen extranjero',
            chips: [CHIP_ANUAL], fuente: FUENTE_NAC, ancho: 'full',
            nota: 'La diferencia entre las dos líneas son, sobre todo, personas nacidas fuera que ya tienen la nacionalidad española.',
            spec: { type: 'line', xType: 'anual', x: NAC.x, yFormat: 'num', xLabel: 'Año', desdeCero: false,
              series: [{ name: 'Nacidos en el extranjero', data: NAC.nacidosFuera },
                       { name: 'Nacionalidad extranjera', data: NAC.x.map(function (t) { var i = (CS.x || []).indexOf(t); return i >= 0 ? CS.extranjera[i] : null; }) }] }
          },
          {
            titulo: 'País de nacimiento frente a nacionalidad', sub: 'Población a 1 de enero de ' + ult(NAC.x) + ' · principales países que publica el INE',
            chips: [CHIP_ANUAL], fuente: FUENTE_NAC, ancho: 'full', alto: 'tall',
            nota: 'Cuando la barra de nacidos supera a la de nacionalidad, hay residentes de ese origen que ya son españoles.',
            spec: { type: 'barh', x: NAC.comparar.map(function (r) { return r[0]; }), yFormat: 'num', xLabel: 'País',
              series: [{ name: 'Nacidos en el país', data: NAC.comparar.map(function (r) { return r[1]; }) },
                       { name: 'Con su nacionalidad', data: NAC.comparar.map(function (r) { return r[2]; }) }] }
          }
        ]
      };
    }
  });

  /* --------------------------------------------- 1b. Barrios (secciones) -- */
  var SECC = (function () {
    var s = (D.secciones || {}), cen = s.censo || {}, ad = s.adrh || {};
    var filas = {};
    Object.keys(cen).forEach(function (k) {
      var c = cen[k], n = c.x.length - 1;
      var pctDe = function (i) { return c.tot[i] ? c.ext[i] / c.tot[i] * 100 : null; };
      filas[k] = {
        sec: k, dist: k.slice(0, 2), anio: c.x[n], x: c.x,
        tot: c.tot[n], ext: c.ext[n], pct: pctDe(n),
        pctIni: pctDe(0), anioIni: c.x[0]
      };
    });
    Object.keys(ad).forEach(function (k) {
      var a = ad[k], f = filas[k] || (filas[k] = { sec: k, dist: k.slice(0, 2) });
      if (a.x && a.pct_ext) {
        var i15 = a.x.indexOf('2015');
        f.adrh15 = i15 >= 0 ? a.pct_ext[i15] : null;
        f.adrhUlt = a.pct_ext[a.pct_ext.length - 1];
        f.adrhAnio = a.x[a.x.length - 1];
      }
      if (a.renta) {
        var ks = Object.keys(a.renta).sort();
        f.renta = a.renta[ks[ks.length - 1]]; f.rentaAnio = ks[ks.length - 1];
      }
    });
    /* Agregado por distrito censal, año a año. */
    var anios = [];
    Object.keys(cen).forEach(function (k) { cen[k].x.forEach(function (t) { if (anios.indexOf(t) < 0) anios.push(t); }); });
    anios.sort();
    var porDist = {};
    Object.keys(DIST).forEach(function (d) {
      porDist[d] = anios.map(function (t) {
        var e = 0, tt = 0;
        Object.keys(cen).forEach(function (k) {
          if (k.slice(0, 2) !== d) return;
          var i = cen[k].x.indexOf(t);
          if (i >= 0) { e += cen[k].ext[i] || 0; tt += cen[k].tot[i] || 0; }
        });
        return { ext: e, tot: tt };
      });
    });
    return { filas: filas, anios: anios, porDist: porDist };
  })();

  var IND_MAPA = {
    pct:    { txt: '% de extranjeros (Censo, 1 de enero de ' + (ult(SECC.anios) || '') + ')', f: function (r) { return r.pct; }, fmt: function (v) { return F.pct(v, 1); }, tipo: 'seq' },
    ext:    { txt: 'Número de extranjeros (Censo ' + (ult(SECC.anios) || '') + ')', f: function (r) { return r.ext; }, fmt: function (v) { return F.num(v); }, tipo: 'seq' },
    dif:    { txt: 'Cambio del % de extranjeros ' + (SECC.anios[0] || '') + '–' + (ult(SECC.anios) || '') + ' (puntos)', f: function (r) { return r.pct != null && r.pctIni != null ? r.pct - r.pctIni : null; }, fmt: function (v) { return F.signo(v, 1) + ' p.p.'; }, tipo: 'div' },
    adrh15: { txt: '% de extranjeros en 2015 (Atlas de renta)', f: function (r) { return r.adrh15; }, fmt: function (v) { return F.pct(v, 1); }, tipo: 'seq' },
    renta:  { txt: 'Renta neta media por persona (Atlas de renta)', f: function (r) { return r.renta; }, fmt: function (v) { return F.eur(v); }, tipo: 'seq' }
  };
  var COL_SEQ = ['#e3f1f5', '#a9d6e3', '#62b0c9', '#24839f', '#0b4f63'];
  var COL_DIV = ['#2a78d6', '#9cc3ef', '#e9ecef', '#f5b08f', '#eb6834'];
  var MAPA = { ind: 'pct', mapa: null, capa: null, tiles: null };

  function cortes(vals, tipo) {
    var v = vals.filter(function (x) { return x != null && isFinite(x); }).sort(function (a, b) { return a - b; });
    if (!v.length) return [];
    if (tipo === 'div') {
      var m = Math.max(Math.abs(v[0]), Math.abs(v[v.length - 1])) || 1;
      return [-m * 0.6, -m * 0.2, m * 0.2, m * 0.6];
    }
    return [0.2, 0.4, 0.6, 0.8].map(function (q) { return v[Math.min(v.length - 1, Math.floor(q * v.length))]; });
  }
  function clase(v, cs) { var i = 0; while (i < cs.length && v >= cs[i]) i++; return i; }

  function pintarMapa() {
    var host = document.getElementById('mb-mapa');
    if (!host || !window.L || !window.SECCIONES) return;
    var oscuro = document.documentElement.getAttribute('data-theme') === 'dark' ||
      (!document.documentElement.getAttribute('data-theme') && matchMedia('(prefers-color-scheme: dark)').matches);
    if (!MAPA.mapa || MAPA.mapa.getContainer() !== host) {
      MAPA.mapa = L.map(host, { scrollWheelZoom: false, zoomControl: true, attributionControl: true });
      MAPA.tiles = null; MAPA.capa = null; MAPA.encuadrado = false;
    }
    var url = 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_' + (oscuro ? 'Dark' : 'Light') + '_Gray_Base/MapServer/tile/{z}/{y}/{x}';
    if (MAPA.tiles) MAPA.mapa.removeLayer(MAPA.tiles);
    MAPA.tiles = L.tileLayer(url, { maxZoom: 16, attribution: 'Teselas &copy; Esri · Secciones censales &copy; INE' }).addTo(MAPA.mapa);
    var ind = IND_MAPA[MAPA.ind];
    var vals = Object.keys(SECC.filas).map(function (k) { return ind.f(SECC.filas[k]); });
    var cs = cortes(vals, ind.tipo), pal = ind.tipo === 'div' ? COL_DIV : COL_SEQ;
    if (MAPA.capa) MAPA.mapa.removeLayer(MAPA.capa);
    var borde = oscuro ? '#131a24' : '#ffffff';
    MAPA.capa = L.geoJSON(window.SECCIONES, {
      style: function (f) {
        var r = SECC.filas[f.properties.sec] || {}, v = ind.f(r);
        return { color: borde, weight: 1, fillOpacity: v == null ? 0.15 : 0.78,
                 fillColor: v == null ? '#9aa5b1' : pal[clase(v, cs)] };
      },
      onEachFeature: function (f, capa) {
        var r = SECC.filas[f.properties.sec] || {};
        capa.bindTooltip('<b>Sección ' + esc(f.properties.sec) + '</b> · distrito ' + esc(DIST[r.dist] || r.dist || '') +
          '<br>Población: ' + F.num(r.tot) + ' · extranjeros: ' + F.num(r.ext) + ' (' + F.pct(r.pct, 1) + ')' +
          '<br>Cambio ' + esc(r.anioIni || '') + '–' + esc(r.anio || '') + ': ' + (r.pct != null && r.pctIni != null ? F.signo(r.pct - r.pctIni, 1) + ' p.p.' : '—') +
          '<br>% extranjeros 2015 (Atlas): ' + F.pct(r.adrh15, 1) +
          '<br>Renta neta por persona ' + esc(r.rentaAnio || '') + ': ' + F.eur(r.renta),
          { sticky: true, className: 'mb-tip' });
        capa.on('mouseover', function () { capa.setStyle({ weight: 2.5, color: oscuro ? '#e8edf3' : '#0f1b2d' }); });
        capa.on('mouseout', function () { MAPA.capa.resetStyle(capa); });
      }
    }).addTo(MAPA.mapa);
    if (!MAPA.encuadrado) { MAPA.mapa.fitBounds(MAPA.capa.getBounds(), { padding: [10, 10] }); MAPA.encuadrado = true; }
    var ley = document.getElementById('mb-ley');
    if (ley) {
      var et = [];
      for (var i = 0; i < pal.length; i++) {
        var a = i === 0 ? null : cs[i - 1], b = i < cs.length ? cs[i] : null;
        et.push('<span><i style="background:' + pal[i] + '"></i>' + (a == null ? '< ' + ind.fmt(b) : (b == null ? '≥ ' + ind.fmt(a) : ind.fmt(a))) + '</span>');
      }
      ley.innerHTML = et.join('');
    }
    setTimeout(function () { if (MAPA.mapa) MAPA.mapa.invalidateSize(); }, 60);
  }
  var _repAnt = Obs.mapasRepintar;
  Obs.mapasRepintar = function () { if (_repAnt) _repAnt(); if (MAPA.mapa && document.getElementById('mb-mapa')) pintarMapa(); };
  document.addEventListener('change', function (ev) {
    var s = ev.target.closest && ev.target.closest('select[data-mapa-ind]');
    if (!s) return;
    MAPA.ind = s.value; pintarMapa();
  });

  SECCIONES.push({
    id: 'barrios', nombre: 'Barrios',
    titulo: 'Dónde viven: mapa por secciones censales',
    desc: 'Las ' + Object.keys(SECC.filas).length + ' secciones censales de Marbella con la población extranjera del Censo anual del INE y, para ver la evolución larga y el nivel de renta, el Atlas de distribución de renta del INE. Pase el ratón por cada sección para ver su ficha.',
    render: function () {
      var fs = Object.keys(SECC.filas).map(function (k) { return SECC.filas[k]; }).filter(function (r) { return r.pct != null; });
      var top = fs.slice().sort(function (a, b) { return b.pct - a.pct; }).slice(0, 15);
      var sube = fs.filter(function (r) { return r.pctIni != null; }).sort(function (a, b) { return (b.pct - b.pctIni) - (a.pct - a.pctIni); }).slice(0, 15);
      var ultA = SECC.anios.length - 1;
      var dKeys = Object.keys(DIST);
      var distPct = dKeys.map(function (d) { return { name: DIST[d], data: SECC.porDist[d].map(function (o) { return o.tot ? +(o.ext / o.tot * 100).toFixed(1) : null; }) }; });
      var distU = dKeys.map(function (d) { return SECC.porDist[d][ultA]; });
      var opciones = Object.keys(IND_MAPA).map(function (k) {
        return '<option value="' + k + '"' + (k === MAPA.ind ? ' selected' : '') + '>' + esc(IND_MAPA[k].txt) + '</option>';
      }).join('');
      /* Clase propia y no .obs-card: el kit empareja sus tarjetas por posición y
         una .obs-card de más desplazaría el dibujo de las gráficas. */
      var mapa = '<div class="obs-grid cols-1"><article class="mb-card">' +
        '<div class="obs-card-head"><div class="t"><h3>Mapa por secciones censales</h3><div class="cs">Elija el indicador que colorea el mapa</div></div>' +
        '<label class="obs-card-ctrl"><span>Indicador</span><select class="obs-select" data-mapa-ind style="max-width:min(380px,60vw)">' + opciones + '</select></label></div>' +
        '<div class="mb-pie"><span class="mb-ley" id="mb-ley"></span></div>' +
        '<div class="mb-mapa" id="mb-mapa"></div>' +
        '<div class="obs-card-foot"><span class="obs-chip live">Anual</span><span>Fuente: <a href="' + FUENTE_SEC.url + '" target="_blank" rel="noopener">INE · Censo anual por sección censal</a>, <a href="' + FUENTE_ADRH.url + '" target="_blank" rel="noopener">INE · Atlas de distribución de renta</a> y cartografía de secciones del INE (1-1-2025). Colores por quintiles: cada tramo agrupa un 20 % de las secciones.</span></div>' +
        '</article></div>';
      setTimeout(pintarMapa, 0);
      var padron = (C.distritos && C.distritos.valores) ? C.distritos : null;
      return {
        nota: mapa,
        kpis: dKeys.map(function (d, i) {
          var o = distU[i], p = SECC.porDist[d][0];
          /* Sin delta: el kit lo rotula en % y aquí el cambio es en puntos. */
          return { label: DIST[d] + ' · % extranjeros (' + SECC.anios[ultA] + ')', valor: o.tot ? o.ext / o.tot * 100 : null, dec: 1, unidad: '%', formato: F.num,
                   serie: SECC.porDist[d].map(function (x) { return x.tot ? x.ext / x.tot * 100 : null; }) };
        }),
        cards: [
          {
            titulo: 'Secciones con más peso de población extranjera', sub: '% de extranjeros a 1 de enero de ' + SECC.anios[ultA] + ' · 15 primeras',
            chips: [CHIP_ANUAL], fuente: FUENTE_SEC, alto: 'tall',
            spec: { type: 'barh', x: top.map(function (r) { return r.sec + ' · ' + DIST[r.dist]; }), yFormat: 'pct', xLabel: 'Sección',
              series: [{ name: '% extranjeros', data: top.map(function (r) { return +r.pct.toFixed(1); }) }] }
          },
          {
            titulo: 'Secciones donde más ha crecido', sub: 'Cambio del % de extranjeros entre ' + SECC.anios[0] + ' y ' + SECC.anios[ultA] + ' (puntos)',
            chips: [CHIP_ANUAL], fuente: FUENTE_SEC, alto: 'tall',
            spec: { type: 'barh', x: sube.map(function (r) { return r.sec + ' · ' + DIST[r.dist]; }), yFormat: 'dec1', xLabel: 'Sección',
              series: [{ name: 'Puntos', data: sube.map(function (r) { return +(r.pct - r.pctIni).toFixed(1); }) }] }
          },
          {
            titulo: 'Peso de la población extranjera por distrito', sub: 'Suma de las secciones de cada distrito · Censo anual del INE',
            chips: [CHIP_ANUAL], fuente: FUENTE_SEC,
            spec: { type: 'line', xType: 'anual', x: SECC.anios, yFormat: 'pct', xLabel: 'Año', desdeCero: false, series: distPct }
          },
          {
            titulo: 'Extranjeros por distrito: INE frente a padrón municipal', sub: 'INE a 1-1-' + SECC.anios[ultA] + ' · padrón municipal a ' + (padron ? padron.fechas[padron.valores.length - 2] : '—'),
            chips: [CHIP_ANUAL, CHIP_INTERNO], fuente: FUENTE_SEC,
            nota: 'Conceptos distintos: el INE depura las inscripciones caducadas. La comparación muestra en qué distrito es mayor la diferencia.',
            spec: { type: 'bar', xType: 'cat', x: dKeys.map(function (d) { return DIST[d]; }), yFormat: 'num', xLabel: 'Distrito', xTodas: true,
              series: [{ name: 'INE 1-1-' + SECC.anios[ultA], data: distU.map(function (o) { return o.ext; }) }].concat(
                padron ? [{ name: 'Padrón ' + padron.fechas[padron.valores.length - 2], data: padron.valores[padron.valores.length - 2] }] : []) }
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

  /* ------------------------------------------------ 2b. Movimientos ----- */
  var MG = D.migraciones || { x: [] };
  var MM = D.matrimonios_mixtos || { x: [], v: [] };
  SECCIONES.push({
    id: 'movimientos', nombre: 'Llegadas y salidas',
    titulo: 'Llegadas, salidas y saldo migratorio',
    desc: 'Altas y bajas en el padrón por cambio de residencia (Estadística de Migraciones y Cambios de Residencia del INE). El <b>saldo exterior</b> es la diferencia entre quienes llegan desde otro país y quienes se van al extranjero; el <b>saldo interior</b>, entre quienes llegan desde otro municipio de España y quienes se van a otro municipio. Incluye a personas de cualquier nacionalidad.',
    render: function () {
      var u = (MG.x || []).length - 1;
      var k = function (c) { return (MG[c] || [])[u]; };
      var kp = function (c) { return (MG[c] || [])[u - 1]; };
      return {
        kpis: [
          { label: 'Llegadas desde el extranjero (' + MG.x[u] + ')', valor: k('inmig_extranjero'), delta: varPct(k('inmig_extranjero'), kp('inmig_extranjero')), deltaRef: 'vs ' + MG.x[u - 1], serie: MG.inmig_extranjero },
          { label: 'Salidas al extranjero (' + MG.x[u] + ')', valor: k('emig_extranjero'), delta: varPct(k('emig_extranjero'), kp('emig_extranjero')), deltaRef: 'vs ' + MG.x[u - 1], invertir: true, serie: MG.emig_extranjero },
          { label: 'Saldo con el extranjero', valor: k('saldo_exterior'), formato: function (v) { return F.signo(v, 0); }, serie: MG.saldo_exterior },
          { label: 'Saldo con el resto de España', valor: k('saldo_interior'), formato: function (v) { return F.signo(v, 0); }, serie: MG.saldo_interior }
        ],
        cards: [
          {
            titulo: 'Llegadas desde el extranjero y salidas al extranjero', sub: 'Personas que cambian su residencia, por año',
            chips: [CHIP_ANUAL], fuente: FUENTE_MIG,
            spec: { type: 'bar', xType: 'anual', x: MG.x, yFormat: 'num', xLabel: 'Año', xTodas: true,
              series: [{ name: 'Llegadas', data: MG.inmig_extranjero }, { name: 'Salidas', data: MG.emig_extranjero }] }
          },
          {
            titulo: 'Saldo migratorio exterior e interior', sub: 'Marbella gana población con el extranjero y la pierde con el resto de España',
            chips: [CHIP_ANUAL], fuente: FUENTE_MIG,
            /* El kit arranca las barras en cero; con saldos negativos hay que
               bajar el suelo del eje o el saldo interior no se ve. */
            spec: { type: 'bar', xType: 'anual', x: MG.x, yFormat: 'num', xLabel: 'Año', xTodas: true,
              yMin: Math.min(0, Math.floor(Math.min.apply(null, (MG.saldo_interior || [0]).concat(MG.saldo_exterior || [0])) / 1000) * 1000),
              series: [{ name: 'Saldo exterior', data: MG.saldo_exterior }, { name: 'Saldo interior', data: MG.saldo_interior }] }
          },
          {
            titulo: 'Llegadas desde otros municipios de España', sub: 'Por nacionalidad de quien se empadrona en Marbella',
            chips: [CHIP_ANUAL], fuente: FUENTE_MIG,
            spec: { type: 'stack', xType: 'anual', x: MG.x, yFormat: 'num', xLabel: 'Año', xTodas: true,
              series: [{ name: 'Española', data: MG.inmig_intermun_espanola }, { name: 'Extranjera', data: MG.inmig_intermun_extranjera }] }
          },
          {
            titulo: 'Matrimonios con al menos un cónyuge extranjero', sub: 'Matrimonios de residentes en Marbella, por año',
            chips: [CHIP_ANUAL], fuente: FUENTE_MAT,
            spec: { type: 'bar', xType: 'anual', x: MM.x, yFormat: 'num', xLabel: 'Año', xTodas: true, series: [{ name: 'Matrimonios', data: MM.v }] }
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
      var AF = D.afiliacion || { x: [] };
      var afPct = function (amb) { return (AF.x || []).map(function (_, i) { var e = AF[amb + '_ext'][i], t = AF[amb + '_total'][i]; return e != null && t ? +(e / t * 100).toFixed(1) : null; }); };
      var afIdx12 = (AF.x || []).indexOf((function () { var t = ult(AF.x) || ''; return (+t.slice(0, 4) - 1) + t.slice(4); })());
      return {
        kpis: [
          { label: 'Extranjeros afiliados que trabajan en Marbella (' + Obs.periodo(ult(AF.x), 'mes') + ')', valor: ult(AF.marbella_ext),
            delta: afIdx12 >= 0 ? varPct(ult(AF.marbella_ext), AF.marbella_ext[afIdx12]) : null, deltaRef: 'interanual', serie: (AF.marbella_ext || []).slice(-24) },
          { label: 'Peso de los extranjeros en los afiliados', valor: ult(afPct('marbella')), unidad: '%', dec: 1, formato: F.num, serie: afPct('marbella').slice(-24) },
          { label: 'Paro registrado extranjero (31-12-' + ult(xs) + ')', valor: ult(A.paro), delta: varPct(ult(A.paro), pen(A.paro)), deltaRef: 'interanual', invertir: true, serie: A.paro },
          { label: 'Contratos a extranjeros en ' + ult(xs), valor: ult(A.contratos), delta: varPct(ult(A.contratos), pen(A.contratos)), deltaRef: 'interanual', serie: A.contratos },
        ],
        cards: [
          {
            titulo: 'Extranjeros afiliados a la Seguridad Social que trabajan en Marbella', sub: 'Afiliaciones a último día de cada periodo · trimestral hasta 2021 y mensual después',
            chips: [CHIP_MENSUAL], fuente: FUENTE_AFIL, ancho: 'full',
            nota: 'Cuenta a quien trabaja en Marbella, viva donde viva, y solo distingue españoles y extranjeros: el país de nacionalidad no se publica por municipio.',
            spec: { type: 'area', xType: 'mes', x: AF.x, yFormat: 'num', series: [{ name: 'Afiliados extranjeros', data: AF.marbella_ext }] }
          },
          {
            titulo: 'Peso de los extranjeros entre los afiliados', sub: 'Marbella frente al conjunto de la provincia de Málaga',
            chips: [CHIP_MENSUAL], fuente: FUENTE_AFIL, ancho: 'full',
            spec: { type: 'line', xType: 'mes', x: AF.x, yFormat: 'pct', desdeCero: false,
              series: [{ name: 'Marbella', data: afPct('marbella') }, { name: 'Provincia de Málaga', data: afPct('malaga') }] }
          },
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

  /* ------------------------------------------------- 3b. Visitantes ----- */
  var TU = D.turismo || { x: [], v: [], ranking: {}, anios_completos: [] };
  /* Nombres de Dataestur que no coinciden con los del padrón municipal. */
  var ALIAS_TUR = { 'Estados Unidos de América': 'Estados Unidos' };
  SECCIONES.push({
    id: 'visitantes', nombre: 'Visitantes',
    titulo: 'Turistas internacionales en Marbella',
    desc: 'Turistas residentes en el extranjero que pasan al menos una noche en Marbella, según la estadística experimental del INE que los estima a partir de la posición de los teléfonos móviles. <b>No son residentes</b>: sirve para ver qué comunidades, además de vivir aquí, visitan la ciudad, y en qué proporción.',
    render: function () {
      var anios = TU.anios_completos || [];
      var aU = anios[anios.length - 1], aP = anios[anios.length - 2];
      var rk = (TU.ranking || {})[aU] || [];
      var rkP = {};
      ((TU.ranking || {})[aP] || []).forEach(function (r) { rkP[r[0]] = r[1]; });
      var totAnio = function (a) { return TU.x.reduce(function (s, t, i) { return t.slice(0, 4) === a ? s + (TU.v[i] || 0) : s; }, 0); };
      var padronDe = {};
      PAISES.forEach(function (p) { padronDe[p.nombre] = p.v[iU]; });
      var ratio = rk.map(function (r) { var res = padronDe[ALIAS_TUR[r[0]] || r[0]]; return res ? [r[0], +(r[1] / res).toFixed(1)] : null; })
        .filter(Boolean).sort(function (a, b) { return b[1] - a[1]; }).slice(0, 15);
      return {
        kpis: [
          { label: 'Turistas internacionales en ' + aU, valor: aU ? totAnio(aU) : null, delta: varPct(totAnio(aU), totAnio(aP)), deltaRef: 'vs ' + aP },
          { label: 'Primer mercado en ' + aU, valor: rk[0] ? rk[0][0] : '—', formato: function (v) { return esc(v); } },
          { label: 'Turistas de ' + (rk[0] ? rk[0][0] : '—'), valor: rk[0] ? rk[0][1] : null, delta: rk[0] ? varPct(rk[0][1], rkP[rk[0][0]]) : null, deltaRef: 'vs ' + aP },
          { label: 'Último mes publicado', valor: ult(TU.x), formato: function (v) { return Obs.periodo(v, 'mes'); } }
        ],
        cards: [
          {
            titulo: 'Turistas internacionales por mes', sub: 'Desde julio de 2019',
            chips: [CHIP_MENSUAL, CHIP_EXP], fuente: FUENTE_TUR, ancho: 'full',
            nota: 'La fuente publica con retraso: el último mes disponible es ' + Obs.periodo(ult(TU.x), 'mes') + '.',
            spec: { type: 'line', xType: 'mes', x: TU.x, yFormat: 'num', series: [{ name: 'Turistas', data: TU.v }] }
          },
          {
            titulo: 'Países de origen de los turistas', sub: 'Turistas en ' + aU + ' · 15 primeros',
            chips: [CHIP_ANUAL, CHIP_EXP], fuente: FUENTE_TUR, alto: 'tall',
            spec: { type: 'barh', x: rk.slice(0, 15).map(function (r) { return r[0]; }), yFormat: 'num', xLabel: 'País',
              series: [{ name: 'Turistas ' + aU, data: rk.slice(0, 15).map(function (r) { return r[1]; }) }] }
          },
          {
            titulo: 'Turistas por cada vecino empadronado de ese país', sub: 'Turistas en ' + aU + ' entre empadronados (padrón municipal ' + P.etiquetas[iU] + ') · entre los 20 primeros mercados',
            chips: [CHIP_ANUAL, CHIP_INTERNO], fuente: FUENTE_TUR, alto: 'tall',
            nota: 'Una cifra alta indica una comunidad más de visita que de residencia; una baja, más asentada.',
            spec: { type: 'barh', x: ratio.map(function (r) { return r[0]; }), yFormat: 'dec1', xLabel: 'País',
              series: [{ name: 'Turistas por residente', data: ratio.map(function (r) { return r[1]; }) }] }
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

  /* --------------------------------------------- 5b. Contexto provincial -- */
  var RS = D.residencia || { x: [], tipos: {}, paises: {} };
  var VV = D.vivienda || { x: [] };
  SECCIONES.push({
    id: 'contexto', nombre: 'Provincia',
    titulo: 'Contexto: provincia de Málaga',
    desc: 'Dos indicadores que <b>no se publican por municipio</b> y que ayudan a situar a Marbella: las personas extranjeras con documentación de residencia en vigor (Observatorio Permanente de la Inmigración) y el peso de los extranjeros residentes en el dinero que se gasta en comprar vivienda (Ministerio de Vivienda). Son datos de toda la provincia.',
    render: function () {
      var T = RS.tipos || {};
      var ps = Object.keys(RS.paises || {}).filter(function (k) { return k !== 'Otras nacionalidades' && RS.paises[k]; })
        .sort(function (a, b) { return RS.paises[b] - RS.paises[a]; }).slice(0, 15);
      var u4 = function (a) { return a && a.length > 4 ? a[a.length - 5] : null; };
      return {
        kpis: [
          { label: 'Con residencia en vigor (' + Obs.periodo(ult(RS.x), 'mes') + ')', valor: ult(T.Total), delta: varPct(ult(T.Total), u4(T.Total)), deltaRef: 'interanual', serie: T.Total },
          { label: 'Certificado de registro (UE)', valor: ult(T['Certificado de registro']), delta: varPct(ult(T['Certificado de registro']), u4(T['Certificado de registro'])), deltaRef: 'interanual' },
          { label: 'Autorización de residencia', valor: ult(T['Autorización']), delta: varPct(ult(T['Autorización']), u4(T['Autorización'])), deltaRef: 'interanual' },
          { label: 'Peso extranjero en el valor de la vivienda', valor: ult(VV.peso_malaga), unidad: '%', dec: 1, formato: F.num, serie: VV.peso_malaga }
        ],
        cards: [
          {
            titulo: 'Extranjeros con documentación de residencia en vigor', sub: 'Provincia de Málaga, por tipo de documento · último día de cada trimestre',
            chips: [CHIP_TRIM, CHIP_PROV], fuente: FUENTE_OPI, ancho: 'full',
            nota: 'Certificado de registro: ciudadanos de la UE y sus familias. TIE-Acuerdo de Retirada: británicos residentes antes del Brexit. Autorización: resto de nacionalidades.',
            spec: { type: 'stack', xType: 'mes', x: RS.x, yFormat: 'num',
              series: ['Certificado de registro', 'TIE-Acuerdo de Retirada', 'Autorización'].filter(function (k) { return T[k]; })
                .map(function (k) { return { name: k, data: T[k] }; }) }
          },
          {
            titulo: 'Nacionalidades con más residentes documentados', sub: 'Provincia de Málaga · ' + Obs.periodo(ult(RS.x), 'mes'),
            chips: [CHIP_TRIM, CHIP_PROV], fuente: FUENTE_OPI, alto: 'tall',
            spec: { type: 'barh', x: ps, yFormat: 'num', xLabel: 'Nacionalidad', series: [{ name: 'Personas', data: ps.map(function (k) { return RS.paises[k]; }) }] }
          },
          {
            titulo: 'Peso de los extranjeros residentes en la compra de vivienda', sub: '% del valor de las compraventas de vivienda libre',
            chips: [CHIP_TRIM, CHIP_PROV], fuente: FUENTE_MIVAU, alto: 'tall',
            nota: 'Solo extranjeros residentes en España; las compras de no residentes (muy relevantes en Marbella) no se desglosan.',
            spec: { type: 'line', xType: 'trim', x: VV.x, yFormat: 'pct', desdeCero: false,
              series: [{ name: 'Provincia de Málaga', data: VV.peso_malaga }, { name: 'España', data: VV.peso_espana }] }
          },
          {
            titulo: 'Precio medio de la vivienda comprada', sub: 'Provincia de Málaga · euros por compraventa de vivienda libre',
            chips: [CHIP_TRIM, CHIP_PROV], fuente: FUENTE_MIVAU, ancho: 'full',
            spec: { type: 'line', xType: 'trim', x: VV.x, yFormat: 'eur', desdeCero: false,
              series: [{ name: 'Extranjeros residentes', data: VV.medio_extr_malaga }, { name: 'Todos los compradores', data: VV.medio_total_malaga }] }
          }
        ]
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
        ['Paro y contratos de extranjeros', si, si, si, 'Argos (2013–' + (ult(A.x) || '') + ')'],
        ['Nacidos en el extranjero', si, si, si, 'INE (2021–' + (ult(NAC.x) || '') + ')'],
        ['Extranjeros por sección censal (mapa)', si, si, si, 'INE Censo (2022–' + (ult(SECC.anios) || '') + ') y Atlas de renta (2015–2023)'],
        ['Llegadas, salidas y saldo migratorio', si, si, no, 'INE (2021–' + (ult(MG.x) || '') + ')'],
        ['Trabajadores extranjeros afiliados', si, si, si, 'IECA (2012–' + (ult((D.afiliacion || {}).x) || '').slice(0, 4) + ', mensual)'],
        ['Turistas internacionales por país', si, si, si, 'INE móviles / Dataestur (2019–' + (ult(TU.x) || '').slice(0, 4) + ')'],
        ['Residencia en vigor y compra de vivienda', si, si, si, 'Solo provincia de Málaga (OPI, Ministerio de Vivienda)'],
        ['Electores extranjeros inscritos (CERE)', no, no, no, 'No es público: lo tiene el Ayuntamiento'],
        ['Alumnado extranjero por centro', no, no, no, 'Pedir a la Delegación de Educación']
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
    subtitulo: 'Concejalía de Extranjeros Residentes · población, barrios, movimientos, empleo y actividad',
    secciones: SECCIONES,
    actualizado: (D.meta || {}).actualizado,
    icono: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>',
    fuentes: [FUENTE_CENSO, FUENTE_NAC, FUENTE_SEC, FUENTE_ADRH, FUENTE_MIG, FUENTE_MAT, FUENTE_DPOP, FUENTE_AFIL, FUENTE_ARGOS, FUENTE_SEPE, FUENTE_TUR, FUENTE_OPI, FUENTE_MIVAU, FUENTE_CONC],
    metodologia: 'Las fuentes públicas (INE, IECA, Argos, SEPE, Dataestur, OPI y Ministerio de Vivienda) las descarga cada mes un proceso automático (<code>pipeline/build_data.py</code>). ' +
      'Los datos internos de la Concejalía (padrón municipal por país y distrito, voto, eventos y prensa) se transcriben de sus informes anuales a <code>data/concejalia.js</code>. ' +
      'Cada tarjeta indica su origen y permite ver los datos en tabla y descargarlos.',
    pie: 'El padrón municipal y el Censo del INE miden cosas distintas y no deben sumarse ni restarse sin decirlo. ' +
      'El paro registrado no es la tasa de paro de la EPA. Los votantes estimados son un máximo.'
  });

  Obs.estado('Último dato del INE: 1 de enero de ' + ((D.meta || {}).ultimo_censo || '—') +
    ' · padrón municipal: ' + (P.etiquetas[iU] || '—'), 'live');

})();
