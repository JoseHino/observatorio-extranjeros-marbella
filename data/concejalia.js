/* ============================================================================
   concejalia.js — Datos INTERNOS de la Concejalía de Extranjeros Residentes.
   Se edita a mano con cada informe anual (no lo toca el colector).

   Origen: carpeta "3 INDICADORES/Extranjeros" de la Concejalía
     2023  Relación de eventos (xlsx + pdf)
     2024  Relación de eventos (docx) · Informe de empadronados a 03-12-2024 (pdf)
     2025  Informe anual 2025 (empadronados a 23-11-2025, distritos, voto,
           eventos) · Anexo de prensa 2025

   Cómo añadir un año: sumar sus eventos a EVENTOS, una columna a cada fila de
   PADRON (y su fecha a padron.fechas) y una fila a distritos.
   ========================================================================== */
window.CONCEJALIA = {

  /* ----------------------------------------------------------- Eventos ----
     f: fecha (AAAA-MM-DD) · fin: último día si dura varios · aprox: la fuente
     no da el día exacto (se toma la fecha habitual del acto) · sinFecha: la
     fuente no da fecha ni mes · nota: corrección respecto al documento.
     tipo: fiesta · elecciones · consular · asociaciones · charlas ·
           institucional · cultura                                           */
  tipos: {
    fiesta:        'Fiestas y días nacionales',
    elecciones:    'Elecciones consulares',
    consular:      'Trámites y visitas consulares',
    asociaciones:  'Reuniones con asociaciones',
    charlas:       'Charlas e información',
    institucional: 'Actos institucionales',
    cultura:       'Cultura, solidaridad y otros'
  },

  eventos: [
    /* -------------------------------------------------------------- 2023 */
    { f:'2023-02-03', t:'Día de la Independencia de Sri Lanka (75 aniversario)', l:'Delegación de Extranjeros (PFCM)', tipo:'fiesta', com:'Sri Lanka' },
    { f:'2023-02-05', t:'Elecciones de Ecuador', l:'Palacio de Ferias y Congresos', tipo:'elecciones', com:'Ecuador' },
    { f:'2023-02-13', t:'Reunión anual de la asociación nórdica AHN', l:'Sala Gregorio García (PFCM)', tipo:'asociaciones', com:'Países nórdicos' },
    { f:'2023-03-03', t:'Día Nacional de Bulgaria (Asociación Marbella-Bulgaria 2013)', l:'Delegación de Extranjeros (PFCM)', tipo:'fiesta', com:'Bulgaria' },
    { f:'2023-03-17', fin:'2023-03-18', t:"St Patrick's Day", l:'Glorieta de la Fontanilla', tipo:'fiesta', com:'Irlanda' },
    { f:'2023-03-20', t:'Encuentro AHN: información sobre voto por correo', l:'Vigil de Quiñones', tipo:'charlas', com:'Países nórdicos' },
    { f:'2023-03-23', t:'Cena solidaria a favor de Turquía', l:'La Scala', tipo:'cultura', com:'Turquía' },
    { f:'2023-03-25', t:'Bulgaria canta y baila', l:'Glorieta de la Fontanilla', tipo:'fiesta', com:'Bulgaria' },
    { f:'2023-03-30', t:'Simposio astronómico', l:'Parque de la Constitución y Escuela de Música', tipo:'cultura', com:'Alemania' },
    { f:'2023-04-02', t:'Elecciones de Bulgaria', l:'Palacio de Ferias y Congresos', tipo:'elecciones', com:'Bulgaria' },
    { f:'2023-04-14', t:'Desayuno con la alcaldesa', l:'The Beach House', tipo:'institucional', com:'Internacional' },
    { f:'2023-05-09', t:'Día de Europa', l:'Parque de la Represa', tipo:'institucional', com:'Unión Europea', nota:'El Excel de 2023 lo fecha el 9 de marzo; el PDF dice martes 9 de mayo.' },
    { f:'2023-06-16', t:'Inauguración de Twisted Art Gallery', l:'Puerto Banús', tipo:'cultura', com:'Internacional' },
    { f:'2023-06-22', fin:'2023-06-25', t:'Fiesta Gaucha', l:'Parque Maribel Notario', tipo:'fiesta', com:'Argentina' },
    { f:'2023-07-01', t:'Día Nacional de Venezuela', l:'Glorieta de la Fontanilla', tipo:'fiesta', com:'Venezuela' },
    { f:'2023-07-07', fin:'2023-07-08', t:'Marbella Fashion Show', l:'Avda. Lola Flores, Puerto Banús', tipo:'cultura', com:'Internacional' },
    { f:'2023-07-08', t:'Procesión de la Virgen de El Quinche', l:'El Calvario', tipo:'fiesta', com:'Ecuador' },
    { f:'2023-07-08', t:'Embajada de Filipinas: trámites consulares', l:'Delegación de Extranjeros (PFCM)', tipo:'consular', com:'Filipinas' },
    { f:'2023-07-22', t:'Aniversario de las asociaciones filipinas FIL-AN, FISPA y KASAMA', l:'Carpa de San Pedro Alcántara', tipo:'asociaciones', com:'Filipinas' },
    { f:'2023-07-30', fin:'2023-08-01', t:'Festival Kuwait-España', l:'Jardín de Europa, Puerto Banús', tipo:'fiesta', com:'Kuwait' },
    { f:'2023-08-19', t:'Festividad de la Virgen del Cisne', l:'Parque de la Represa', tipo:'fiesta', com:'Ecuador' },
    { f:'2023-09-09', t:'20 aniversario del Colegio Sueco de Marbella', l:'Colegio Sueco', tipo:'institucional', com:'Países nórdicos' },
    { f:'2023-09-09', t:'Primer aniversario de Gudfil (comunidad filipina)', l:'Hall del Palacio de Congresos', tipo:'asociaciones', com:'Filipinas' },
    { f:'2023-10-03', t:'Día de la Reunificación de Alemania', l:'Glorieta de la Fontanilla', tipo:'fiesta', com:'Alemania' },
    { f:'2023-10-05', fin:'2023-10-06', t:'Festival EuroGeorgia', l:'Sala Gregorio García (PFCM)', tipo:'fiesta', com:'Georgia' },
    { f:'2023-10-05', fin:'2023-10-08', t:'Oktoberfest', l:'Glorieta de la Fontanilla', tipo:'fiesta', com:'Alemania' },
    { f:'2023-10-13', t:'Concierto pro Ucrania "Unión y Paz"', l:'Auditorio del Palacio de Congresos', tipo:'cultura', com:'Ucrania' },
    { f:'2023-10-15', t:'Elecciones presidenciales de Ecuador', l:'Palacio de Ferias y Congresos', tipo:'elecciones', com:'Ecuador' },
    { f:'2023-10-22', t:'Reunión de la Asociación Senegalesa', l:'Sala Gregorio García (PFCM)', tipo:'asociaciones', com:'Senegal' },
    { f:'2023-11-09', t:'Exposición SWEA (mujeres suecas empresarias)', l:'Hall del Palacio de Congresos', tipo:'cultura', com:'Países nórdicos' },
    { f:'2023-11-10', t:'Reunión AHN', l:'Delegación de Extranjeros (PFCM)', tipo:'asociaciones', com:'Países nórdicos' },
    { f:'2023-11-11', t:'San Martín', l:'Las Chapas', tipo:'fiesta', com:'Países Bajos' },
    { f:'2023-11-14', t:'MIUC: jornada de empadronamiento', l:'MIUC', tipo:'charlas', com:'Internacional' },
    { f:'2023-11-21', t:'Reunión AHN', l:'Sala Gregorio García (PFCM)', tipo:'asociaciones', com:'Países nórdicos' },
    { f:'2023-11-25', t:'Embajada de Filipinas: trámites consulares', l:'Sala Gregorio García (PFCM)', tipo:'consular', com:'Filipinas' },
    { f:'2023-11-28', fin:'2023-11-30', t:'Guinness World Record: 55 horas de entrevistas (Clara Kronborg)', l:'Marbella', tipo:'cultura', com:'Países nórdicos' },
    { f:'2023-12-01', t:'Reunión AHN', l:'Delegación de Extranjeros (PFCM)', tipo:'asociaciones', com:'Países nórdicos' },
    { f:'2023-12-13', t:'Santa Lucía', l:'Plaza de la Iglesia de la Encarnación', tipo:'fiesta', com:'Países nórdicos' },
    { f:'2023', sinFecha:true, t:'Grabación de programas con RTVM (Marbella Internacional)', l:'RTV Marbella', tipo:'charlas', com:'Internacional' },

    /* -------------------------------------------------------------- 2024 */
    { f:'2024-02-15', fin:'2024-02-19', t:'Cartel por la Paz: exposición del Colegio Alemán', l:'Sala Gregorio García (PFCM)', tipo:'cultura', com:'Alemania' },
    { f:'2024-02-17', t:'Jornadas Leonísticas Andaluzas y Extremeñas (Club de Leones de lengua alemana)', l:'Sala Gregorio García (PFCM)', tipo:'asociaciones', com:'Alemania' },
    { f:'2024-02-17', t:'Visita guiada al Casco Antiguo (Jornadas Leonísticas)', l:'Casco Antiguo', tipo:'cultura', com:'Alemania' },
    { f:'2024-03-08', fin:'2024-03-10', t:'Guinness World Record', l:'Puerto Banús', tipo:'cultura', com:'Internacional' },
    { f:'2024-03-15', t:'Día Nacional de Irlanda: recepción a la comunidad irlandesa', l:'Ayuntamiento', tipo:'institucional', com:'Irlanda' },
    { f:'2024-03-16', t:'Bulgaria baila y canta (Asociación Marbella-Bulgaria 2013)', l:'Glorieta de la Fontanilla', tipo:'fiesta', com:'Bulgaria' },
    { f:'2024-03-17', t:"St Patrick's Day", l:'Glorieta de la Fontanilla', tipo:'fiesta', com:'Irlanda' },
    { f:'2024-03-21', t:'Recepción al cónsul de Rumanía', l:'Ayuntamiento', tipo:'consular', com:'Rumanía' },
    { f:'2024-03-24', t:'Elecciones presidenciales de Senegal', l:'Palacio de Ferias y Congresos', tipo:'elecciones', com:'Senegal' },
    { f:'2024-04-04', t:'Desayuno de trabajo de las concejalías de Extranjeros de la Costa del Sol', l:'Marbella', tipo:'institucional', com:'Internacional' },
    { f:'2024-05-09', t:'Día de Europa', l:'Ayuntamiento', tipo:'institucional', com:'Unión Europea', nota:'La relación de 2024 dice "martes 9 de mayo", copiado de 2023; en 2024 fue jueves.' },
    { f:'2024-06-09', t:'Elecciones europeas: mesa de Rumanía', l:'Palacio de Ferias y Congresos', tipo:'elecciones', com:'Rumanía' },
    { f:'2024-06-09', t:'Elecciones europeas: mesa de Bulgaria', l:'Palacio de Ferias y Congresos', tipo:'elecciones', com:'Bulgaria' },
    { f:'2024-06-09', t:'Teatro infantil del Consulado de Rumanía', l:'Palacio de Ferias y Congresos', tipo:'cultura', com:'Rumanía' },
    { f:'2024-07-06', t:'Día Nacional de Venezuela', l:'Glorieta de la Fontanilla', tipo:'fiesta', com:'Venezuela' },
    { f:'2024-07-11', fin:'2024-07-12', t:'Marbella Fashion Show', l:'Avda. Lola Flores, Puerto Banús', tipo:'cultura', com:'Internacional' },
    { f:'2024-08-17', t:'Festividad de la Virgen del Cisne', l:'Parque de la Represa', tipo:'fiesta', com:'Ecuador' },
    { f:'2024-08-25', t:'Día de la Independencia de Ucrania', l:'Marbella', tipo:'fiesta', com:'Ucrania' },
    { f:'2024-09-13', t:'Simposio astronómico', l:'Parque de la Constitución', tipo:'cultura', com:'Alemania' },
    { f:'2024-10-03', t:'Día de la Reunificación de Alemania', l:'Glorieta de la Fontanilla', tipo:'fiesta', com:'Alemania' },
    { f:'2024-10-05', t:'Encuentro UNMS', l:'The Harbour', tipo:'asociaciones', com:'Internacional' },
    { f:'2024-10-05', t:'Trámites consulares de Filipinas', l:'Delegación de Extranjeros (PFCM)', tipo:'consular', com:'Filipinas' },
    { f:'2024-10-11', fin:'2024-10-13', t:'Día de la Hispanidad', l:'Marbella', tipo:'fiesta', com:'Hispanoamérica' },
    { f:'2024-10-13', t:'Teatro "La cabra y los tres cabritillos" (Consulado de Rumanía)', l:'Auditorio del Palacio de Congresos', tipo:'cultura', com:'Rumanía' },
    { f:'2024-10-27', t:'Elecciones de Bulgaria', l:'Palacio de Ferias y Congresos', tipo:'elecciones', com:'Bulgaria' },
    { f:'2024-11-11', t:'San Martín', l:'Las Chapas', tipo:'fiesta', com:'Países Bajos' },
    { f:'2024-11-17', t:'Elecciones de Senegal', l:'Palacio de Ferias y Congresos', tipo:'elecciones', com:'Senegal' },
    { f:'2024-11-19', t:'SWEA Expo', l:'Palacio de Ferias y Congresos', tipo:'cultura', com:'Países nórdicos' },
    { f:'2024-11-21', aprox:true, t:'Beaujolais Nouveau', l:'Marbella', tipo:'fiesta', com:'Francia' },
    { f:'2024-12-13', t:'Santa Lucía', l:'Plaza de la Iglesia de la Encarnación', tipo:'fiesta', com:'Países nórdicos' },
    { f:'2024-12-22', t:'Mercadillo de Navidad de Ucrania', l:'Marbella', tipo:'cultura', com:'Ucrania' },

    /* -------------------------------------------------------------- 2025 */
    { f:'2025-01-12', t:'20 aniversario del Club de Leones de Marbella (lengua alemana)', l:'Golf & Country Club Marbella', tipo:'asociaciones', com:'Alemania' },
    { f:'2025-01-15', t:'Encuentro de la comunidad extranjera con José Carlos Pozo (Universidad de Málaga)', l:'Oficinas de la Delegación', tipo:'charlas', com:'Internacional' },
    { f:'2025-02-04', aprox:true, t:'Día Nacional de Sri Lanka: recepción', l:'Palacio de Ferias y Congresos', tipo:'fiesta', com:'Sri Lanka' },
    { f:'2025-02-09', t:'Elecciones presidenciales de Ecuador', l:'Palacio de Ferias y Congresos', tipo:'elecciones', com:'Ecuador' },
    { f:'2025-02-14', t:'Reunión anual AHN (nórdicos)', l:'Sala Gregorio García (PFCM)', tipo:'asociaciones', com:'Países nórdicos' },
    { f:'2025-03-01', t:'Día Nacional de Bulgaria y 10 aniversario de la Escuela Búlgara', l:'Palacio de Ferias y Congresos', tipo:'fiesta', com:'Bulgaria' },
    { f:'2025-03-15', fin:'2025-03-16', t:"Día Nacional de Irlanda (St Patrick's Day)", l:'Glorieta de la Fontanilla', tipo:'fiesta', com:'Irlanda' },
    { f:'2025-03-16', t:'Concierto "Los Iankovers" a beneficio de Ucrania (Maydan)', l:'Bulevar de San Pedro Alcántara', tipo:'cultura', com:'Ucrania' },
    { f:'2025-03-27', t:'Charla sobre el padrón para la comunidad nórdica (SWEA)', l:'Marbella', tipo:'charlas', com:'Países nórdicos' },
    { f:'2025-04-04', t:'Charla con el cónsul general del Reino Unido', l:'Sala Gregorio García (PFCM)', tipo:'consular', com:'Reino Unido' },
    { f:'2025-04-04', fin:'2025-04-06', t:'Fiesta Gaucha', l:'Parque Arroyo de la Represa', tipo:'fiesta', com:'Argentina' },
    { f:'2025-04-13', t:'Elecciones presidenciales de Ecuador (segunda vuelta)', l:'Palacio de Ferias y Congresos', tipo:'elecciones', com:'Ecuador' },
    { f:'2025-05-08', t:'Conferencia de la Guardia Civil sobre normativa de tráfico (en inglés)', l:'Hospital Real de la Misericordia', tipo:'charlas', com:'Internacional' },
    { f:'2025-05-09', t:'Día de Europa y reconocimiento a emprendedores extranjeros', l:'Hospital Real de la Misericordia', tipo:'institucional', com:'Unión Europea' },
    { f:'2025-05-10', t:'Día Nacional de Paraguay', l:'Glorieta de la Fontanilla', tipo:'fiesta', com:'Paraguay' },
    { f:'2025-05-16', fin:'2025-05-18', t:'I Festival Cubano de Marbella', l:'Glorieta de la Fontanilla', tipo:'fiesta', com:'Cuba' },
    { f:'2025-07-05', t:'Día Nacional de Venezuela', l:'Glorieta de la Fontanilla', tipo:'fiesta', com:'Venezuela' },
    { f:'2025-07-10', fin:'2025-07-11', t:'Marbella Fashion Show', l:'Puerto Banús', tipo:'cultura', com:'Internacional' },
    { f:'2025-08-16', t:'Festividad de la Virgen del Cisne / Día Nacional de Ecuador', l:'Arroyo de la Represa', tipo:'fiesta', com:'Ecuador' },
    { f:'2025-08-24', t:'Día de la Independencia de Ucrania', l:'Templete de la Alameda', tipo:'fiesta', com:'Ucrania', nota:'El informe dice 24 de julio; el Día de la Independencia de Ucrania es el 24 de agosto.' },
    { f:'2025-09-04', t:'Simposio astronómico', l:'Escuela de Música y Parque de la Constitución', tipo:'cultura', com:'Alemania' },
    { f:'2025-10-03', t:'Día de la Reunificación de Alemania', l:'Glorieta de la Fontanilla', tipo:'fiesta', com:'Alemania' },
    { f:'2025-10-04', fin:'2025-10-05', t:'Oktoberfest', l:'Glorieta de la Fontanilla', tipo:'fiesta', com:'Alemania' },
    { f:'2025-10-10', fin:'2025-10-13', t:'Festival de la Hispanidad (diez países)', l:'Marbella', tipo:'fiesta', com:'Hispanoamérica' },
    { f:'2025-11-06', t:'SWEA Expo', l:'Palacio de Ferias y Congresos', tipo:'cultura', com:'Países nórdicos' },
    { f:'2025-11-11', t:'San Martín', l:'Las Chapas', tipo:'fiesta', com:'Países Bajos' },
    { f:'2025-11-20', aprox:true, t:'Beaujolais Nouveau', l:'Marbella', tipo:'fiesta', com:'Francia' },
    { f:'2025-12-13', t:'Santa Lucía', l:'Plaza de la Iglesia de la Encarnación', tipo:'fiesta', com:'Países nórdicos' }
  ],

  /* ---------------------------------------------- Padrón municipal ----
     Empadronados extranjeros por nacionalidad. Una columna por informe.
     Totales oficiales del informe (incluyen Palestina y apátridas, que el
     informe resta del reparto por continentes).                          */
  padron: {
    fechas: ['2024-12-03', '2025-11-23'],
    etiquetas: ['dic 2024', 'nov 2025'],
    totales: [55579, 61434],
    excluidos: [[11, 3], [16, 6]],      /* [Palestina, apátridas] */
    continentes: {
      'Europa':  [29454, 32061],
      'América': [13861, 15770],
      'África':  [6769, 7348],
      'Asia':    [5405, 6148],
      'Oceanía': [76, 85]
    },
    paises: {
      'Europa': [
        ['Reino Unido',5299,5607],['Ucrania',4827,5170],['Rusia',3206,3365],['Italia',2581,2814],
        ['Alemania',1850,2046],['Suecia',1779,2007],['Rumanía',1560,1680],['Francia',1389,1563],
        ['Países Bajos',1088,1213],['Bélgica',690,744],['Irlanda',639,730],['Bulgaria',517,552],
        ['Polonia',487,576],['Hungría',368,402],['Portugal',355,399],['Noruega',299,328],
        ['Dinamarca',291,347],['Suiza',239,263],['Lituania',235,272],['Finlandia',231,259],
        ['Estonia',188,220],['Letonia',172,214],['Bielorrusia',149,151],['Serbia',145,157],
        ['Austria',142,159],['República Checa',110,124],['Eslovaquia',102,113],['Albania',90,100],
        ['Turquía',83,118],['Moldavia',60,64],['Croacia',55,65],['Grecia',49,51],['Islandia',42,43],
        ['Chipre',28,31],['Malta',25,28],['Luxemburgo',24,22],['Eslovenia',22,27],
        ['Bosnia y Herzegovina',11,10],['Macedonia del Norte',8,8],['Montenegro',8,8],
        ['Otros países de Europa',5,5],['Andorra',4,4],['Liechtenstein',1,1],['San Marino',1,1]
      ],
      'América': [
        ['Colombia',4297,5057],['Paraguay',2256,2601],['Venezuela',1478,1694],['Argentina',1357,1460],
        ['Brasil',723,788],['Ecuador',634,684],['Estados Unidos',560,705],['Cuba',442,463],
        ['Nicaragua',387,418],['Perú',300,350],['Honduras',295,308],['Bolivia',222,228],
        ['Canadá',185,213],['México',178,223],['Chile',174,200],['República Dominicana',132,122],
        ['Uruguay',109,106],['Panamá',28,23],['El Salvador',26,29],['Guatemala',25,30],
        ['Costa Rica',19,22],['Granada',7,9],['San Cristóbal y Nieves',7,7],['Haití',5,5],
        ['Dominica',4,12],['Santa Lucía',4,4],['Bahamas',2,2],['Jamaica',2,2],
        ['Trinidad y Tobago',2,2],['Otros países de América',1,3]
      ],
      'África': [
        ['Marruecos',5398,5794],['Senegal',702,814],['Ghana',160,182],['Egipto',99,114],
        ['Argelia',94,120],['Nigeria',65,61],['Libia',41,46],['Gambia',28,23],['Túnez',27,26],
        ['Sudáfrica',26,26],['Mauritania',17,19],['Kenia',15,18],['Sudán',13,14],['Camerún',10,10],
        ['Cabo Verde',9,8],['Etiopía',9,9],['Costa de Marfil',6,5],['Angola',5,5],['Guinea',5,8],
        ['Tanzania',5,5],['Guinea Ecuatorial',4,3],['Mozambique',4,5],['Zimbabue',4,5],['Benín',3,3],
        ['Congo',3,4],['Malí',3,4],['Burkina Faso',2,2],['Gabón',2,2],['Liberia',2,2],
        ['Sierra Leona',2,3],['Uganda',2,4],['Mauricio',1,1],['Otros países de África',1,2],
        ['R. D. del Congo',1,1],['Togo',1,null]
      ],
      'Asia': [
        ['Filipinas',2061,2379],['China',969,1046],['Irán',630,716],['India',165,184],
        ['Pakistán',132,178],['Siria',127,133],['Kazajistán',123,131],['Israel',115,127],
        ['Bangladés',112,141],['Sri Lanka',105,118],['Arabia Saudí',97,109],['Líbano',89,94],
        ['Tailandia',85,95],['Indonesia',67,85],['Kuwait',63,65],['Irak',62,65],['Georgia',56,68],
        ['Jordania',53,59],['Armenia',43,54],['Vietnam',42,42],['Japón',41,43],['Nepal',38,61],
        ['Uzbekistán',32,39],['Kirguistán',18,31],['Corea del Sur',14,14],['Catar',13,13],
        ['Azerbaiyán',12,12],['Baréin',10,10],['Birmania',6,6],['Emiratos Árabes Unidos',5,7],
        ['Malasia',5,5],['Singapur',4,5],['Yemen',4,5],['Afganistán',3,3],['Camboya',2,2],
        ['Otros países de Asia',2,3]
      ],
      'Oceanía': [
        ['Australia',56,61],['Nueva Zelanda',19,21],['Vanuatu',1,3]
      ]
    }
  },

  /* ------------------------------------------------------ Distritos ---- */
  distritos: {
    nombres: ['Marbella', 'San Pedro Alcántara', 'Nueva Andalucía', 'Las Chapas'],
    fechas: ['dic 2024', 'dic 2025'],
    valores: [[15368, 13351, 17498, 9362], [16797, 14767, 19417, 10453]]
  },

  /* ---------------------------------------- Derecho a voto (2025) ------
     Municipales 2027. "Votantes estimados" = empadronados − 20 % (menores),
     criterio del Negociado de Padrón. Es un MÁXIMO: Reino Unido y Noruega
     exigen 3 años de residencia legal y los acuerdos de reciprocidad, 5.   */
  voto: {
    estimacion: 0.8,
    ue: [
      ['Alemania',2046],['Austria',159],['Bélgica',744],['Bulgaria',552],['Chipre',31],['Croacia',65],
      ['Dinamarca',347],['Eslovaquia',113],['Eslovenia',27],['Estonia',220],['Finlandia',259],
      ['Francia',1563],['Grecia',51],['Hungría',402],['Irlanda',730],['Italia',2814],['Letonia',214],
      ['Lituania',272],['Luxemburgo',22],['Malta',28],['Países Bajos',1213],['Polonia',576],
      ['Portugal',399],['República Checa',124],['Rumanía',1680],['Suecia',2007]
    ],
    acuerdoUnico: [['Reino Unido',5607],['Noruega',328]],
    reciprocidad: [
      ['Colombia',5057],['Paraguay',2601],['Ecuador',684],['Perú',350],['Bolivia',228],['Chile',200],
      ['Islandia',43],['Nueva Zelanda',21],['Corea del Sur',14],['Cabo Verde',8],['Burkina Faso',2],
      ['Trinidad y Tobago',2]
    ],
    /* Desglose por distrito del informe: [Marbella, San Pedro, N. Andalucía, Las Chapas].
       La tabla de la UE del informe incluye al Reino Unido y omite Croacia;
       la de acuerdos omite Noruega y Cabo Verde. Aquí se separa el Reino Unido. */
    distritos: {
      ue:           [3279, 2715, 6466, 4127],
      reinoUnido:   [582, 1106, 2253, 1666],
      reciprocidad: [4213, 2997, 1183, 809]
    }
  },

  /* -------------------------------------------------- Prensa 2025 ----- */
  prensa: [
    { f:'2025-02-04', aprox:true, medio:'marbella.es', idioma:'es', tema:'Reunión con la asociación de Sri Lanka por el día de su independencia' },
    { f:'2025-02-26', aprox:true, medio:'marbella.es', idioma:'es', tema:'El Ayuntamiento respalda el Día Nacional de Bulgaria (1 de marzo)' },
    { f:'2025-03-12', medio:'marbella.es', idioma:'es', tema:'Presentación de más de una decena de eventos hasta mayo con las comunidades internacionales' },
    { f:'2025-03-12', medio:'Marbella24horas', idioma:'es', tema:'La delegación de Extranjeros impulsa una decena de eventos' },
    { f:'2025-03-15', aprox:true, medio:'Marbella Sur (edición alemana)', idioma:'de', tema:'Entrevista a la alcaldesa sobre la ITB de Berlín' },
    { f:'2025-03-15', aprox:true, medio:'Sur in English', idioma:'en', tema:'Entrevista a la alcaldesa sobre la relación con los residentes extranjeros' },
    { f:'2025-05-09', medio:'marbella.es', idioma:'es', tema:'Día de Europa: acto institucional y reconocimiento a emprendedores' },
    { f:'2025-05-09', medio:'marbella.es (inglés)', idioma:'en', tema:'Europe Day institutional event and recognition of entrepreneurs' },
    { f:'2025-05-09', medio:'Diario Sur', idioma:'es', tema:'Marbella conmemora el Día de Europa' },
    { f:'2025-05-09', medio:'Área Costa del Sol', idioma:'es', tema:'Día de Europa con homenaje a emprendedores locales' },
    { f:'2025-05-09', medio:'Marbella24horas', idioma:'es', tema:'Día de Europa con reconocimientos a emprendedores' },
    { f:'2025-05-12', medio:'Sur in English', idioma:'en', tema:'Europe Day event in recognition of foreign entrepreneurs' },
    { f:'2025-08-12', medio:'COPE Marbella', idioma:'es', tema:'Entrevista a la concejala en "La Mañana de la Costa"' },
    { f:'2025-10-04', medio:'marbella.es', idioma:'es', tema:'Programación del Día de la Hispanidad' },
    { f:'2025-10-08', medio:'marbella.es', idioma:'es', tema:'Diez países en el Festival de la Hispanidad (10-13 de octubre)' },
    { f:'2025-10-12', medio:'marbella.es', idioma:'es', tema:'Marbella celebra el Festival de la Hispanidad' }
  ],

  /* ------------------------------------------- Calidad del dato ------ */
  incidencias: [
    'Informe 2025: Italia figura con 2.819 empadronados en la tabla comparativa y con 2.814 en la tabla de Europa y en la de derecho a voto. A 3-12-2024 la comparativa dice 2.585 y el informe de 2024, 2.581.',
    'Informe 2025: Rumanía figura con 1.608 en la tabla comparativa y con 1.680 en la tabla de Europa, la de voto y la de distritos.',
    'Informe 2025: Estados Unidos figura con 638 en la tabla comparativa y con 705 en la tabla de América.',
    'Informe 2025: Bulgaria figura con 552 en la tabla de Europa y con 546 en la tabla de voto por distritos.',
    'Informe 2025: la tabla de voto por distritos de la UE (22.194) incluye al Reino Unido y no incluye Croacia; la de acuerdos de reciprocidad por distritos (14.809) no incluye Noruega ni Cabo Verde. Los totales correctos son 16.658 (UE) y 15.145 (acuerdos, con Reino Unido y Noruega).',
    'Informe 2025: Palestina aparece con 0 en la tabla de Asia, aunque la nota del informe resta 16 personas de esa nacionalidad.',
    'Informe 2025: el Día de la Independencia de Ucrania aparece el "24 de julio"; es el 24 de agosto.',
    'Eventos 2023: el Excel fecha el Día de Europa el 9 de marzo (fue el 9 de mayo) y deja sin rellenar la hoja de recuentos mensuales.',
    'Eventos 2024: hay dos relaciones (un borrador de 21 actos archivado en la carpeta de 2023 y la definitiva de 31). Se usa la definitiva. El fichero de la definitiva está dañado y Word no lo abre.',
    'Algunos actos no tienen fecha en la fuente (Beaujolais Nouveau, Día de Sri Lanka 2025, grabaciones con RTVM). Se les asigna la fecha habitual y se marcan como aproximados.',
    'Las relaciones de eventos no registran asistentes, coste ni organizador, y no hay registro numérico de las consultas atendidas (NIE, padrón, ayudas, etc.).'
  ]
};
