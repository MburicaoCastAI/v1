/*
 * ============================================================================
 *  pronostico.js — el pronóstico del nivel del arroyo Mburicaó, en la página
 * ============================================================================
 *
 *  QUÉ HACE
 *    1. Busca en la página los bloques <div class="pronostico-mburicao">.
 *    2. Descarga el archivo forecast.json que indica su atributo data-url.
 *    3. Dibuja el nivel medido en las últimas horas, el pronóstico a 10, 20 y
 *       30 minutos, el rango donde se espera el nivel y el umbral de referencia.
 *    4. Cada 5 minutos vuelve a descargar el archivo; cada minuto actualiza el
 *       texto "hace N minutos".
 *
 *  CÓMO SE PONE EN UNA PÁGINA
 *    <div class="pronostico-mburicao"
 *         data-url="https://raw.githubusercontent.com/USUARIO/REPO/data/forecast.json"
 *         data-lang="es"></div>
 *    <script src="pronostico.js" defer></script>
 *
 *    data-lang puede ser "es" (español) o "en" (inglés).
 *
 *  POR QUÉ ESTÁ HECHO ASÍ
 *    - No usa ninguna librería. Es un solo archivo: nada externo que se caiga,
 *      cambie de versión o haya que actualizar.
 *    - Si algo falla (no hay internet, el archivo no existe, cambió el formato),
 *      muestra un mensaje dentro de su propio recuadro y NO rompe el resto de la
 *      página.
 *    - Todo texto que viene del JSON se "escapa" antes de ponerlo en la página.
 *      Así, aunque alguien lograra modificar el JSON, no podría meter código en la
 *      página del laboratorio.
 *
 *  DÓNDE VIVE EL ORIGINAL
 *    En el repositorio de la tesis: TESIS/1.Codigo/web/pronostico.js.
 *    La que está en la página del laboratorio (assets/js/pronostico.js) es una
 *    COPIA: los cambios se hacen en el original y se vuelve a copiar.
 *    Todo explicado paso a paso en docs/PUBLICACION.md.
 */
(function () {
  "use strict";

  // =========================================================== 1. AJUSTES ===

  const VERSION = "1.4";

  // El JSON trae un campo "version_formato". Si no coincide con este número, el
  // archivo cambió de estructura y esta página no sabe leerlo: se avisa en vez
  // de dibujar cualquier cosa.
  const FORMATO_QUE_SABE_LEER = 1;

  // GitHub guarda el archivo en caché 5 minutos, así que pedirlo más seguido no
  // trae nada nuevo. Ver docs/PUBLICACION.md §11.
  const RECARGAR_CADA_MIN = 5;

  // Si el pronóstico tiene más de esto, se muestra un aviso y el gráfico se
  // atenúa. El job corre cada 10 min: 30 min son tres corridas perdidas.
  const DESACTUALIZADO_DESDE_MIN = 30;

  // Paraguay usa UTC-3 todo el año desde octubre de 2024. Las horas se calculan
  // con este desfase fijo y no con la zona del navegador: así se ve la hora de
  // Asunción aunque la página se mire desde otro país.
  const ZONA_PARAGUAY_MIN = -180;

  // Si entre dos mediciones pasan más de 15 min, falta un dato: la línea se corta
  // en vez de unir los dos puntos como si hubiera habido medición en el medio.
  const HUECO_MAXIMO_MIN = 15;

  // El modelo trabaja con intervalos de 10 minutos que se nombran por su comienzo:
  // el "20:50" va de 20:50 a 21:00. En el gráfico cada valor se dibuja en el MEDIO de
  // su intervalo (20:55), que es donde corresponde un promedio de esos 10 minutos, y
  // en la tabla se escribe el intervalo entero. Antes se dibujaba en el comienzo y la
  // página parecía ir atrasada (duda del 14-sep).
  const INTERVALO_MIN = 10;

  // ============================================================ 2. TEXTOS ===

  const TEXTOS = {
    es: {
      titulo: "Pronóstico del nivel · próximos 30 minutos",
      cargando: "Cargando el pronóstico…",
      menosDeUnMin: "menos de 1 min",
      hace: function (duracion) { return "hace " + duracion; },
      actualizado: function (hora, hace) { return "Actualizado a las " + hora + " (" + hace + ")"; },
      ultimoDato: function (hora) { return "último dato medido: " + hora; },
      viejo: function (duracion) {
        return "El pronóstico no se actualiza desde hace " + duracion +
          ". Puede no reflejar lo que está pasando ahora.";
      },
      respaldo: "Pronóstico de respaldo: faltan datos recientes para usar el modelo, así " +
        "que se muestra el último nivel medido como estimación. No tiene rango de incertidumbre.",
      errorCarga: "No se pudo cargar el pronóstico en este momento. Se vuelve a intentar en unos minutos.",
      errorFormato: function (v) {
        return "El archivo del pronóstico tiene un formato nuevo (versión " + v +
          ") que esta página todavía no sabe leer.";
      },
      estadoRaro: function (e) { return "Estado del pronóstico no reconocido: " + e + "."; },
      colHora: "Hora",
      colNivel: "Nivel",
      colRango: "Rango probable (90 %)",
      colProb: "Prob. de superar el umbral",
      leyMedido: "Nivel medido",
      leyPronostico: "Pronóstico",
      leyRango: "Rango probable (90 %)",
      leyUmbral: "Umbral de referencia",
      marcaUltimo: "último dato",
      leyLluvia: "Lluvia detectada",
      tituloLluvia: "Lluvia detectada en la estación",
      sinLluvia: "sin lluvia en estas horas",
      lluviaAhora: function (min) { return "llueve ahora · " + min + " de los últimos 60 min"; },
      lluviaHace: function (duracion) { return "última lluvia hace " + duracion; },
      lluviaNada: "sin lluvia en las últimas horas",
      lluviaSinDato: "pluviómetro sin datos",
      notaLluvia: "La lluvia es la que mide el pluviómetro de la estación del arroyo, y se muestra " +
        "como referencia: el pronóstico se calcula solo con el nivel medido.",
      aviso: "Producto experimental de investigación (tesis de maestría, FIUNA). No es una alerta oficial.",
      notaIntervalos: "Cada nivel es el promedio de un intervalo de 10 minutos: el de la tabla " +
        "indica de qué hora a qué hora.",
      notaRango: "El rango probable contiene el nivel real 9 de cada 10 veces, en promedio a lo " +
        "largo del tiempo; no es una garantía para cada pronóstico.",
      notaUmbral: function (valor, pct, periodo) {
        return "Umbral de referencia (" + valor + "): nivel superado solo el " + pct +
          " % del tiempo" + (periodo ? " en los datos de " + periodo : "") +
          ". Es una referencia estadística, no un umbral oficial de alerta.";
      },
      aria: "Gráfico del nivel del arroyo: medido en las últimas horas y pronosticado para " +
        "los próximos 30 minutos. Los mismos valores están en la tabla de abajo.",
      coma: ",",
      meses: ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"],

      // --- panel de eventos (eventos.json) ---
      evTitulo: "Cómo se comportó el sistema en crecidas reales",
      evCargando: "Cargando los eventos…",
      evVacio: "Todavía no hay crecidas registradas para mostrar.",
      evElegir: "Elegí una crecida",
      evSubida: function (m) { return "subió " + m; },
      evPico: function (m) { return "pico " + m; },
      evCruzo: "cruzó el umbral",
      evNoCruzo: "no llegó al umbral",
      evLluvia: function (min) { return min + " min con lluvia detectada"; },
      evSinLluvia: "sin lluvia detectada en la estación",
      evLeyPronostico: "Lo que el sistema dijo 30 min antes",
      evErrorMedio: "Error medio",
      evErrorPico: "Error en el pico",
      evPersistencia: "Error sin modelo",
      evCobertura: "Dentro del rango",
      evAviso: "Aviso antes del pico",
      evSinAviso: "no avisó",
      evNoAplica: "—",
      evCentimetros: function (v) { return v + " cm"; },
      evMinutosAntes: function (v) { return v + " min antes"; },
      evOrigenOperacion: "Estos son los pronósticos tal como el sistema los publicó en ese " +
        "momento: están guardados en la base desde entonces y nadie los recalculó.",
      evOrigenReconstruccion: "Cuando ocurrió esta crecida el servicio todavía no estaba en " +
        "marcha. Los pronósticos se reconstruyeron después con el mismo código que corre en " +
        "producción, dándole al modelo en cada instante solo los datos que existían hasta ahí.",
      evNotaPersistencia: "«Error sin modelo» es el error de suponer que dentro de 30 minutos el " +
        "nivel va a ser el de ahora. Es la referencia contra la que se mide cualquier pronóstico " +
        "a corto plazo: el modelo sirve si le gana.",
      evNotaPico: "En crecidas de varios metros en menos de una hora el modelo llega tarde al " +
        "pico. El pluviómetro está dentro del cauce y no anticipa la lluvia que la provoca: el " +
        "sistema la ve recién cuando el agua ya está subiendo.",
      evNotaBanda: "Donde la banda toca el borde del gráfico es porque sigue más allá: en el pico " +
        "de una crecida el rango probable se abre mucho, y el gráfico está recortado para que la " +
        "crecida siga siendo legible.",
      evNotaAviso: function (cruce, p) {
        return "El umbral de referencia está apenas unos 10 cm por encima del nivel habitual, así " +
          "que en una crecida se cruza en los primeros minutos de la subida" +
          (typeof cruce === "number"
            ? " (acá el sistema ya había avisado " + cruce + " min antes de ese cruce)"
            : "") + ", y el agua sigue subiendo media hora o más. Por eso el aviso se cuenta " +
          "hasta el pico, que es cuando el agua está en su peor momento" +
          (typeof p === "number" ? ". La probabilidad más alta que dio durante esta crecida " +
            "fue " + p + " %" : "") + ".";
      },
      evNotaVentana: function (n) {
        return "Las cuentas son sobre los " + n + " intervalos de 10 minutos de esta ventana.";
      },
      evAria: "Gráfico de una crecida: el nivel que se midió y lo que el sistema había " +
        "pronosticado 30 minutos antes para cada momento.",
      evErrorCarga: "No se pudieron cargar los eventos en este momento."
    },
    en: {
      titulo: "Water level forecast · next 30 minutes",
      cargando: "Loading the forecast…",
      menosDeUnMin: "less than 1 min",
      hace: function (duracion) { return duracion + " ago"; },
      actualizado: function (hora, hace) { return "Updated at " + hora + " (" + hace + ")"; },
      ultimoDato: function (hora) { return "last measurement: " + hora; },
      viejo: function (duracion) {
        return "The forecast has not been updated for " + duracion +
          ". It may not reflect current conditions.";
      },
      respaldo: "Fallback forecast: there are not enough recent data to run the model, so the " +
        "last measured level is shown as the estimate. It has no uncertainty range.",
      errorCarga: "The forecast could not be loaded right now. It will retry in a few minutes.",
      errorFormato: function (v) {
        return "The forecast file uses a newer format (version " + v +
          ") that this page cannot read yet.";
      },
      estadoRaro: function (e) { return "Unrecognized forecast status: " + e + "."; },
      colHora: "Time",
      colNivel: "Level",
      colRango: "Likely range (90%)",
      colProb: "Prob. of exceeding the threshold",
      leyMedido: "Measured level",
      leyPronostico: "Forecast",
      leyRango: "Likely range (90%)",
      leyUmbral: "Reference threshold",
      marcaUltimo: "last data",
      leyLluvia: "Rain detected",
      tituloLluvia: "Rain detected at the station",
      sinLluvia: "no rain in these hours",
      lluviaAhora: function (min) { return "raining now · " + min + " of the last 60 min"; },
      lluviaHace: function (duracion) { return "last rain " + duracion + " ago"; },
      lluviaNada: "no rain in the last hours",
      lluviaSinDato: "rain gauge without data",
      notaLluvia: "Rain is measured by the stream station's rain gauge and shown for reference: " +
        "the forecast is computed from the measured level only.",
      aviso: "Experimental research product (master's thesis, FIUNA). Not an official warning.",
      notaIntervalos: "Each level is the average over a 10-minute interval: the table shows " +
        "from what time to what time.",
      notaRango: "The likely range contains the actual level 9 times out of 10 on average over " +
        "time; it is not a guarantee for each individual forecast.",
      notaUmbral: function (valor, pct, periodo) {
        return "Reference threshold (" + valor + "): a level exceeded only " + pct +
          "% of the time" + (periodo ? " in the " + periodo + " data" : "") +
          ". It is a statistical reference, not an official warning threshold.";
      },
      aria: "Chart of the stream level: measured over the last hours and forecast for the " +
        "next 30 minutes. The same values are in the table below.",
      coma: ".",
      meses: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],

      // --- events panel (eventos.json) ---
      evTitulo: "How the system performed during real flood events",
      evCargando: "Loading the events…",
      evVacio: "No flood events recorded yet.",
      evElegir: "Pick an event",
      evSubida: function (m) { return "rose " + m; },
      evPico: function (m) { return "peak " + m; },
      evCruzo: "crossed the threshold",
      evNoCruzo: "stayed below the threshold",
      evLluvia: function (min) { return min + " min with rain detected"; },
      evSinLluvia: "no rain detected at the station",
      evLeyPronostico: "What the system said 30 min earlier",
      evErrorMedio: "Mean error",
      evErrorPico: "Error at the peak",
      evPersistencia: "Error with no model",
      evCobertura: "Inside the range",
      evAviso: "Warning before the peak",
      evSinAviso: "no warning",
      evNotaAviso: function (cruce, p) {
        return "The reference threshold is only about 10 cm above the usual level, so in a " +
          "flood it is crossed within the first minutes of the rise" +
          (typeof cruce === "number"
            ? " (here the system had already warned " + cruce + " min before that)"
            : "") + ", while the water keeps rising for another half hour or more. That is " +
          "why the warning is counted up to the peak" +
          (typeof p === "number" ? ". The highest probability it gave during this event was " +
            p + " %" : "") + ".";
      },
      evNoAplica: "—",
      evCentimetros: function (v) { return v + " cm"; },
      evMinutosAntes: function (v) { return v + " min earlier"; },
      evOrigenOperacion: "These are the forecasts exactly as the system published them at the " +
        "time: they have been stored in the database ever since and nobody recomputed them.",
      evOrigenReconstruccion: "The service was not yet running when this event happened. The " +
        "forecasts were reconstructed afterwards with the same code that runs in production, " +
        "giving the model at each step only the data that existed up to that point.",
      evNotaPersistencia: "“Error with no model” is the error of assuming that in 30 minutes the " +
        "level will be the current one. It is the baseline any short-term forecast is measured " +
        "against: the model is worth having if it beats it.",
      evNotaPico: "In floods of several metres in under an hour the model reaches the peak late. " +
        "The rain gauge sits inside the channel and does not anticipate the rain that causes the " +
        "flood: the system only sees it once the water is already rising.",
      evNotaBanda: "Where the range touches the edge of the chart it continues beyond it: at the " +
        "peak of a flood the likely range widens a great deal, and the chart is clipped so that " +
        "the flood itself stays readable.",
      evNotaVentana: function (n) {
        return "The figures are computed over the " + n + " ten-minute intervals of this window.";
      },
      evAria: "Chart of one flood event: the level that was measured and what the system had " +
        "forecast 30 minutes earlier for each moment.",
      evErrorCarga: "The events could not be loaded right now."
    }
  };

  // ========================================================= 3. AYUDANTES ===

  /** Convierte texto en texto seguro para meter en HTML (evita inyectar código). */
  function escapar(valor) {
    return String(valor).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /** "2026-09-14T15:20:00-03:00" -> milisegundos. NaN si el texto no es una fecha. */
  function instante(texto) {
    return typeof texto === "string" ? Date.parse(texto) : NaN;
  }

  /** Milisegundos -> "15:20", en hora de Paraguay. */
  function hora(ms) {
    if (!isFinite(ms)) return "—";
    return new Date(ms + ZONA_PARAGUAY_MIN * 60000).toISOString().slice(11, 16);
  }

  /** 135 -> "2 h 15 min". */
  function duracion(min, t) {
    if (min < 1) return t.menosDeUnMin;
    if (min < 60) return min + " min";
    const h = Math.floor(min / 60), m = min % 60;
    return h + " h" + (m ? " " + m + " min" : "");
  }

  /** 0.4452 -> "0,445" (con coma en español). */
  function numero(v, decimales, t) {
    return v.toFixed(decimales).replace(".", t.coma);
  }

  function nivel(v, t) {
    return typeof v === "number" ? numero(v, 3, t) + " m" : "—";
  }

  function probabilidad(p) {
    if (typeof p !== "number") return "—";
    if (p < 0.01) return "&lt; 1 %";
    if (p > 0.99) return "&gt; 99 %";
    return Math.round(p * 100) + " %";
  }

  /** Paso "redondo" para las marcas del eje (0,01 / 0,02 / 0,025 / 0,05…). */
  function pasoRedondo(bruto) {
    const potencia = Math.pow(10, Math.floor(Math.log10(bruto)));
    const f = bruto / potencia;
    return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * potencia;
  }

  /** Qué detectó el pluviómetro; null si el JSON no trae el dato de la lluvia.
   *
   * El pluviómetro de la estación cuenta detecciones de agua sobre su superficie
   * y les asigna un valor fijo, así que lo que publica el JSON son los MINUTOS en
   * los que detectó agua en cada intervalo (`lluvia_min`: 0, 5 o 10), no una
   * cantidad de lluvia. Un `null` ahí es "no sé": el sensor no respondió, que no
   * es lo mismo que "no llovió".
   *
   * Los JSON de hasta el 12-oct traían `lluvia_mm` en vez de `lluvia_min`: ahí
   * esto devuelve null y la página no dibuja nada sobre la lluvia.
   */
  function estadoLluvia(d) {
    const puntos = (d.observado || [])
      .map(function (p) { return { x: instante(p.hora), min: p.lluvia_min }; })
      .filter(function (p) {
        return isFinite(p.x) && (typeof p.min === "number" || p.min === null);
      });
    if (!puntos.length) return null;

    const fin = instante(d.ultimo_dato);
    const nuevo = puntos[puntos.length - 1];
    const mojados = puntos.filter(function (p) { return p.min > 0; });
    const ultima = mojados.length ? mojados[mojados.length - 1] : null;
    return {
      bloques: puntos,
      // Hay franja si al menos un intervalo trae dato: con todos en null no hay
      // nada que dibujar, solo que avisar.
      franja: puntos.some(function (p) { return typeof p.min === "number"; }),
      sinDato: typeof nuevo.min !== "number",
      llueve: nuevo.min > 0,
      // Minutos con agua en la última hora. Es duración, no cantidad.
      minutosEnLaHora: puntos.reduce(function (suma, p) {
        return (typeof p.min === "number" && isFinite(fin) &&
          p.x > fin - 3600e3 && p.x <= fin) ? suma + p.min : suma;
      }, 0),
      // Desde el final del último intervalo con agua hasta el final del último
      // medido: los dos corren 10 minutos, así que la resta de los comienzos da
      // lo mismo y no hace falta sumarlos.
      desde: ultima && isFinite(fin) ? Math.round((fin - ultima.x) / 60000) : null
    };
  }

  /** La frase que acompaña a la hora, arriba del gráfico. null si no se muestra. */
  function textoLluvia(l, t) {
    if (!l) return null;
    if (l.sinDato) return t.lluviaSinDato;
    if (l.llueve) return t.lluviaAhora(l.minutosEnLaHora);
    if (l.desde !== null) return t.lluviaHace(duracion(l.desde, t));
    return t.lluviaNada;
  }

  // =========================================================== 4. GRÁFICO ===

  function grafico(d, t, ancho) {
    // El dibujo usa el ancho REAL disponible. Si fuera fijo (720), en un celular
    // el navegador lo achicaría entero, letras incluidas: los números de los ejes
    // quedaban de ~5 px, ilegibles (visto en la demo el 14-sep).
    const IZQ = 60, DER = 18, ARR = 22, ABA = 32;
    const MEDIO = INTERVALO_MIN * 30000;   // medio intervalo, en ms (ver INTERVALO_MIN)

    // Franja de lluvia debajo del nivel, con el mismo eje de tiempo. Solo si el JSON
    // trae el dato: los publicados antes del 12-oct no tienen "lluvia_min".
    const lluvia = estadoLluvia(d);
    const franja = !!(lluvia && lluvia.franja);
    const ALTO_LLUVIA = franja ? 24 : 0, SEPARACION = franja ? 26 : 0;
    const ALTO_BLOQUE = 14;

    const W = ancho;
    const H = Math.round(Math.min(340, Math.max(220, ancho * 0.4))) + ALTO_LLUVIA + SEPARACION;
    const BASE_NIVEL = H - ABA - ALTO_LLUVIA - SEPARACION;   // borde inferior del gráfico de nivel

    const medido = (d.observado || [])
      .map(function (p) { return { x: instante(p.hora) + MEDIO, y: p.nivel }; })
      .filter(function (p) { return isFinite(p.x) && typeof p.y === "number"; });
    const pronostico = (d.pronostico || [])
      .map(function (p) { return { x: instante(p.hora) + MEDIO, y: p.nivel, lo: p.min_90, hi: p.max_90 }; })
      .filter(function (p) { return isFinite(p.x) && typeof p.y === "number"; });
    if (!medido.length && !pronostico.length) return "";

    const umbral = d.umbral && typeof d.umbral.valor === "number" ? d.umbral.valor : null;
    // La línea vertical va en el medio del último intervalo medido: ahí termina la
    // línea azul, y coincide con la lectura más nueva (20:55 para el intervalo 20:50).
    const origen = instante(d.ultimo_dato) + MEDIO;
    // El pronóstico arranca en el último nivel medido.
    const inicio = medido.length ? medido[medido.length - 1] : null;
    const conBanda = pronostico.length > 0 && pronostico.every(function (p) {
      return typeof p.lo === "number" && typeof p.hi === "number";
    });

    // --- rango de los ejes ---------------------------------------------------
    const xs = medido.concat(pronostico).map(function (p) { return p.x; });
    let x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs);
    if (x1 - x0 < 3600e3) x0 = x1 - 3600e3;

    const ys = medido.concat(pronostico).map(function (p) { return p.y; });
    if (conBanda) pronostico.forEach(function (p) { ys.push(p.lo, p.hi); });
    if (umbral !== null) ys.push(umbral);   // se ve siempre cuánto falta para el umbral
    let y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys);
    const margen = Math.max(0.01, (y1 - y0) * 0.12);
    y0 -= margen; y1 += margen;

    const sx = function (x) { return IZQ + (x - x0) / (x1 - x0) * (W - IZQ - DER); };
    const sy = function (y) { return ARR + (y1 - y) / (y1 - y0) * (BASE_NIVEL - ARR); };
    const f1 = function (v) { return v.toFixed(1); };

    let svg = "";

    // --- rejilla y eje del nivel ---------------------------------------------
    const paso = pasoRedondo((y1 - y0) / 4);
    const decimales = paso < 0.01 ? 3 : 2;
    for (let k = Math.ceil(y0 / paso); k <= Math.floor(y1 / paso); k++) {
      const yy = f1(sy(k * paso));
      svg += '<line x1="' + IZQ + '" x2="' + (W - DER) + '" y1="' + yy + '" y2="' + yy + '" class="pm-rejilla"/>' +
        '<text x="' + (IZQ - 8) + '" y="' + yy + '" class="pm-eje" text-anchor="end" dominant-baseline="middle">' +
        numero(k * paso, decimales, t) + ' m</text>';
    }

    // --- eje del tiempo: una marca cada 30 min (cada hora si hay mucho tiempo o
    //     poco lugar, para que las horas no se encimen) ---------------------------
    const cada = ((x1 - x0) > 4 * 3600e3 || W < 480) ? 3600e3 : 1800e3;
    for (let k = Math.ceil(x0 / cada); k * cada <= x1; k++) {
      const xx = f1(sx(k * cada));
      svg += '<line x1="' + xx + '" x2="' + xx + '" y1="' + (H - ABA) + '" y2="' + (H - ABA + 5) + '" class="pm-rejilla"/>' +
        '<text x="' + xx + '" y="' + (H - 8) + '" class="pm-eje" text-anchor="middle">' + hora(k * cada) + '</text>';
    }

    // --- rango probable: un polígono entre el mínimo y el máximo del 90 % ---------
    if (conBanda) {
      const arriba = pronostico.map(function (p) { return [sx(p.x), sy(p.hi)]; });
      const abajo = pronostico.map(function (p) { return [sx(p.x), sy(p.lo)]; }).reverse();
      const puntos = (inicio ? [[sx(inicio.x), sy(inicio.y)]] : []).concat(arriba, abajo);
      svg += '<polygon class="pm-banda" points="' +
        puntos.map(function (q) { return f1(q[0]) + "," + f1(q[1]); }).join(" ") + '"/>';
    }

    // --- umbral de referencia ------------------------------------------------------
    if (umbral !== null) {
      const yu = sy(umbral);
      const yTexto = yu - ARR < 14 ? yu + 15 : yu - 6;
      svg += '<line x1="' + IZQ + '" x2="' + (W - DER) + '" y1="' + f1(yu) + '" y2="' + f1(yu) + '" class="pm-umbral"/>' +
        '<text x="' + (W - DER) + '" y="' + f1(yTexto) + '" text-anchor="end" class="pm-umbral-txt">' +
        escapar(t.leyUmbral) + " · " + nivel(umbral, t) + '</text>';
    }

    // --- línea vertical en el último dato -----------------------------------------
    if (isFinite(origen) && origen >= x0 && origen <= x1) {
      const xo = f1(sx(origen));
      svg += '<line x1="' + xo + '" x2="' + xo + '" y1="' + ARR + '" y2="' + (H - ABA) + '" class="pm-origen"/>' +
        '<text x="' + xo + '" y="' + (ARR - 7) + '" text-anchor="middle" class="pm-origen-txt">' +
        escapar(t.marcaUltimo) + '</text>';
    }

    // --- lluvia: un bloque en cada intervalo donde el sensor detectó agua --------
    // TODOS LOS BLOQUES TIENEN LA MISMA ALTURA, a propósito. El pluviómetro de la
    // estación detecta agua sobre su superficie; el número que entrega no es una
    // cantidad de lluvia (ADR-010, revisión del 2026-10-09). Barras de distinta
    // altura, como se dibujaban hasta el 12-oct, le hacían creer a quien mira que
    // había milímetros medidos. El ancho cubre los minutos detectados del
    // intervalo (5 o 10), que es duración: eso sí lo sabe el sensor.
    //
    // La lluvia es solo referencia: el modelo no la usa (R9).
    if (franja) {
      const arriba = BASE_NIVEL + SEPARACION, abajo = H - ABA;
      const porMinuto = (sx(x0 + 60000) - sx(x0));
      svg += '<text x="' + IZQ + '" y="' + (arriba - 9) + '" class="pm-eje">' + escapar(t.tituloLluvia) + "</text>" +
        '<line x1="' + IZQ + '" x2="' + (W - DER) + '" y1="' + abajo + '" y2="' + abajo + '" class="pm-rejilla"/>';
      let hubo = false;
      lluvia.bloques.forEach(function (p) {
        if (!(p.min > 0)) return;
        hubo = true;
        // El bloque arranca al comienzo del intervalo y se recorta en los bordes.
        // Con 5 minutos no se sabe cuál de las dos mitades fue, y no vale la pena
        // inventarlo: son ~5 px en un eje de tres horas.
        const izq = Math.max(sx(p.x), IZQ);
        const der = Math.min(sx(p.x) + p.min * porMinuto, W - DER);
        if (der - izq < 0.5) return;
        svg += '<rect class="pm-lluvia" x="' + f1(izq) + '" y="' + f1(abajo - ALTO_BLOQUE) +
          '" width="' + f1(der - izq) + '" height="' + ALTO_BLOQUE + '"/>';
      });
      if (!hubo) {
        const xm = isFinite(origen) ? (IZQ + sx(origen)) / 2 : (IZQ + W - DER) / 2;
        svg += '<text x="' + f1(xm) + '" y="' + f1(abajo - ALTO_BLOQUE / 2) + '" class="pm-eje" ' +
          'text-anchor="middle" dominant-baseline="middle">' + escapar(t.sinLluvia) + "</text>";
      }
    }

    // --- nivel medido: se corta donde falta un dato -----------------------------------
    let camino = "", anterior = null;
    medido.forEach(function (p) {
      const seguido = anterior && (p.x - anterior.x) <= HUECO_MAXIMO_MIN * 60000;
      camino += (seguido ? "L" : "M") + f1(sx(p.x)) + " " + f1(sy(p.y)) + " ";
      anterior = p;
    });
    if (camino) svg += '<path class="pm-medido" d="' + camino + '"/>';

    // --- pronóstico: línea punteada desde el último dato, y un punto por horizonte ---
    if (pronostico.length) {
      const puntos = (inicio ? [inicio] : []).concat(pronostico);
      svg += '<path class="pm-linea-pro" d="' + puntos.map(function (p, i) {
        return (i ? "L" : "M") + f1(sx(p.x)) + " " + f1(sy(p.y));
      }).join(" ") + '"/>';
      pronostico.forEach(function (p) {
        svg += '<circle class="pm-punto" r="4.5" cx="' + f1(sx(p.x)) + '" cy="' + f1(sy(p.y)) + '"/>';
      });
    }

    return '<svg class="pm-svg" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="' +
      escapar(t.aria) + '">' + svg + "</svg>";
  }

  function leyenda(t, conBanda, conLluvia) {
    const item = function (muestra, texto) {
      return '<li><svg width="26" height="12" aria-hidden="true">' + muestra + "</svg>" + escapar(texto) + "</li>";
    };
    return '<ul class="pm-leyenda">' +
      item('<line x1="1" x2="25" y1="6" y2="6" class="pm-medido"/>', t.leyMedido) +
      item('<line x1="1" x2="25" y1="6" y2="6" class="pm-linea-pro"/>', t.leyPronostico) +
      (conBanda ? item('<rect x="1" y="1" width="24" height="10" class="pm-banda"/>', t.leyRango) : "") +
      item('<line x1="1" x2="25" y1="6" y2="6" class="pm-umbral"/>', t.leyUmbral) +
      (conLluvia ? item('<rect x="3" y="2" width="20" height="8" rx="2" class="pm-lluvia"/>', t.leyLluvia) : "") +
      "</ul>";
  }

  function tabla(d, t, respaldo) {
    const filas = (d.pronostico || []).map(function (p) {
      const rango = (!respaldo && typeof p.min_90 === "number" && typeof p.max_90 === "number")
        ? nivel(p.min_90, t) + " – " + nivel(p.max_90, t) : "—";
      const desde = instante(p.hora);
      return "<tr><td>" + hora(desde) + "–" + hora(desde + INTERVALO_MIN * 60000) +
        ' <span class="pm-sutil">(+' + escapar(p.minutos) +
        " min)</span></td><td>" + nivel(p.nivel, t) + "</td><td>" + rango + "</td><td>" +
        (respaldo ? "—" : probabilidad(p.prob_umbral)) + "</td></tr>";
    }).join("");
    return '<div class="pm-tabla-caja"><table class="pm-tabla"><thead><tr><th>' + escapar(t.colHora) +
      "</th><th>" + escapar(t.colNivel) + "</th><th>" + escapar(t.colRango) + "</th><th>" +
      escapar(t.colProb) + "</th></tr></thead><tbody>" + filas + "</tbody></table></div>";
  }

  function notas(d, t, respaldo) {
    const u = d.umbral || {};
    const m = /^p(\d+)$/.exec(u.nombre || "");
    let html = '<p class="pm-nota"><strong>' + escapar(t.aviso) + "</strong></p>";
    html += '<p class="pm-nota">' + escapar(t.notaIntervalos) + "</p>";
    if (!respaldo) html += '<p class="pm-nota">' + escapar(t.notaRango) + "</p>";
    if (typeof u.valor === "number" && m) {
      html += '<p class="pm-nota">' + escapar(t.notaUmbral(nivel(u.valor, t), 100 - Number(m[1]), u.periodo)) + "</p>";
    }
    const lluvia = estadoLluvia(d);
    if (lluvia && lluvia.franja) html += '<p class="pm-nota">' + escapar(t.notaLluvia) + "</p>";
    return html;
  }

  // ========================================================= 5. TARJETA ===

  function contenido(estado, t, edadDemoMin, ancho) {
    const d = estado.datos;
    if (!d) {
      return '<p class="pm-error">' + escapar(t.errorCarga) + "</p>";
    }
    if (d.version_formato !== FORMATO_QUE_SABE_LEER) {
      return '<p class="pm-error">' + escapar(t.errorFormato(d.version_formato)) + "</p>";
    }

    const actualizado = instante(d.actualizado);
    // data-demo-edad-min: SOLO para la demo y las pruebas (ver web/demo/). Hace
    // de cuenta que "ahora" es tantos minutos después de la publicación.
    const ahora = edadDemoMin !== null ? actualizado + edadDemoMin * 60000 : Date.now();
    const edad = Math.max(0, Math.round((ahora - actualizado) / 60000));
    const viejo = !isFinite(edad) || edad > DESACTUALIZADO_DESDE_MIN;
    const respaldo = d.estado === "fallback_persistence";

    const lluvia = estadoLluvia(d);
    const chipLluvia = textoLluvia(lluvia, t);
    // "ultima_lectura" es la hora de la lectura más nueva que usó el modelo (20:55).
    // Los JSON anteriores al 15-sep no la traen: ahí se muestra "ultimo_dato", el
    // comienzo del intervalo (20:50), como antes.
    const ultima = typeof d.ultima_lectura === "string" ? d.ultima_lectura : d.ultimo_dato;
    let html = '<p class="pm-estado">' +
      escapar(t.actualizado(hora(actualizado), t.hace(duracion(edad, t)))) + " · " +
      escapar(t.ultimoDato(hora(instante(ultima)))) +
      (chipLluvia ? ' · <span class="pm-chip' + (lluvia.llueve ? " pm-chip-lluvia" : "") + '">' +
        (lluvia.llueve ? '<i class="fas fa-cloud-rain" aria-hidden="true"></i> ' : "") +
        escapar(chipLluvia) + "</span>" : "") + "</p>";

    if (viejo) html += '<p class="pm-alerta pm-alerta-viejo">' + escapar(t.viejo(duracion(edad, t))) + "</p>";
    if (respaldo) html += '<p class="pm-alerta">' + escapar(t.respaldo) + "</p>";
    else if (d.estado !== "ok") html += '<p class="pm-alerta">' + escapar(t.estadoRaro(d.estado)) + "</p>";

    html += '<div class="pm-grafico' + (viejo ? " pm-apagado" : "") + '">' + grafico(d, t, ancho) + "</div>";
    html += leyenda(t, !respaldo, !!(lluvia && lluvia.franja));
    html += tabla(d, t, respaldo);
    html += notas(d, t, respaldo);
    return html;
  }

  function montar(caja) {
    const t = TEXTOS[caja.getAttribute("data-lang") === "en" ? "en" : "es"];
    const url = caja.getAttribute("data-url");
    const demo = caja.getAttribute("data-demo-edad-min");
    const edadDemoMin = demo !== null && demo !== "" && isFinite(Number(demo)) ? Number(demo) : null;
    const estado = { datos: null };

    function anchoDisponible() {
      // 40 px = el relleno interno del recuadro (1,25rem de cada lado).
      return Math.max(300, Math.min(960, Math.round((caja.clientWidth || 760) - 40)));
    }

    function redibujar() {
      pintar(contenido(estado, t, edadDemoMin, anchoDisponible()));
    }

    function pintar(cuerpo) {
      caja.innerHTML = '<div class="pm-tarjeta"><h3 class="pm-titulo"><i class="fas fa-chart-line" aria-hidden="true"></i> ' +
        escapar(t.titulo) + '</h3><div class="pm-cuerpo">' + cuerpo + "</div></div>";
    }

    function descargar() {
      // cache: "no-store" evita la caché DEL NAVEGADOR. La de GitHub (5 min) no se
      // puede evitar desde acá: ver docs/PUBLICACION.md §11.
      fetch(url, { cache: "no-store" })
        .then(function (r) {
          if (!r.ok) throw new Error("HTTP " + r.status);
          return r.json();
        })
        .then(function (d) { estado.datos = d; })
        .catch(function (e) {
          // Si ya había datos, se siguen mostrando: el aviso de "desactualizado"
          // aparece solo cuando corresponde. El detalle queda en la consola.
          console.warn("[pronostico-mburicao]", url, e);
        })
        .then(redibujar);
    }

    pintar('<p class="pm-estado">' + escapar(t.cargando) + "</p>");
    if (!url) {
      pintar('<p class="pm-error">' + escapar(t.errorCarga) + " (data-url)</p>");
      return;
    }
    descargar();
    setInterval(descargar, RECARGAR_CADA_MIN * 60000);
    setInterval(function () { if (estado.datos) redibujar(); }, 60000);

    // Si cambia el ancho (girar el celular, achicar la ventana), se vuelve a dibujar.
    let espera = null;
    window.addEventListener("resize", function () {
      clearTimeout(espera);
      espera = setTimeout(function () { if (estado.datos) redibujar(); }, 200);
    });
  }

  // =========================================== 5.bis PANEL DE EVENTOS ===
  //
  //  QUÉ MUESTRA
  //    Las crecidas reales de la estación y, encima de cada una, lo que el
  //    sistema había pronosticado 30 minutos antes para cada momento. No es el
  //    pronóstico de ahora: es el registro de cómo le fue.
  //
  //  POR QUÉ ES UN SEGUNDO ARCHIVO Y NO MÁS CAMPOS EN forecast.json
  //    forecast.json lo reemplaza el job cada 10 minutos y se pide cada 5. Los
  //    eventos son datos históricos que cambian cuando hay una crecida nueva:
  //    meterlos ahí sería mandar decenas de kilobytes cada vez para nada.
  //    Viven en eventos.json, en su propia rama (ver scripts/eventos_web.py).
  //
  //  SE PONE EN LA PÁGINA IGUAL QUE EL OTRO
  //    <div class="eventos-mburicao" data-url="…/eventos.json" data-lang="es"></div>

  const FORMATO_EVENTOS_QUE_SABE_LEER = 1;

  //: Los clipPath de los SVG necesitan un id único en toda la página: si dos
  //: paneles usaran el mismo, el navegador aplica el primero a los dos.
  let clipSeq = 0;

  /** 2,46 m. Para las crecidas, donde los milímetros del nivel no aportan nada. */
  function nivelCorto(v, t) {
    return typeof v === "number" ? numero(v, 2, t) + " m" : "—";
  }

  /** Milisegundos -> "28 ene 2026", en hora de Paraguay. */
  function fecha(ms, t) {
    if (!isFinite(ms)) return "—";
    const iso = new Date(ms + ZONA_PARAGUAY_MIN * 60000).toISOString();
    const mes = t.meses[Number(iso.slice(5, 7)) - 1] || "";
    return Number(iso.slice(8, 10)) + " " + mes + " " + iso.slice(0, 4);
  }

  function etiquetaEvento(ev, t) {
    const x = instante(ev.pico && ev.pico.hora);
    return fecha(x, t) + " · " + hora(x);
  }

  /** Une puntos cortando donde falta un dato, igual que la línea del nivel. */
  function camino(puntos, sx, sy, f1) {
    let d = "", anterior = null;
    puntos.forEach(function (p) {
      const salto = anterior !== null && (p.x - anterior) > HUECO_MAXIMO_MIN * 60000 + INTERVALO_MIN * 60000;
      d += (anterior === null || salto ? "M" : "L") + f1(sx(p.x)) + " " + f1(sy(p.y));
      anterior = p.x;
    });
    return d;
  }

  function graficoEvento(ev, d, t, ancho) {
    const IZQ = 60, DER = 18, ARR = 22, ABA = 32;
    const MEDIO = INTERVALO_MIN * 30000;

    const bloques = (ev.observado || [])
      .map(function (p) { return { x: instante(p.hora), min: p.lluvia_min }; })
      .filter(function (p) { return isFinite(p.x); });
    const franja = bloques.some(function (p) { return typeof p.min === "number"; });
    const ALTO_LLUVIA = franja ? 24 : 0, SEPARACION = franja ? 26 : 0, ALTO_BLOQUE = 14;

    const W = ancho;
    const H = Math.round(Math.min(340, Math.max(220, ancho * 0.4))) + ALTO_LLUVIA + SEPARACION;
    const BASE_NIVEL = H - ABA - ALTO_LLUVIA - SEPARACION;

    const medido = (ev.observado || [])
      .map(function (p) { return { x: instante(p.hora) + MEDIO, y: p.nivel }; })
      .filter(function (p) { return isFinite(p.x) && typeof p.y === "number"; });
    const pron = (ev.pronostico_30 || [])
      .map(function (p) {
        return { x: instante(p.hora) + MEDIO, y: p.nivel, lo: p.min_90, hi: p.max_90 };
      })
      .filter(function (p) { return isFinite(p.x) && typeof p.y === "number"; });
    if (!medido.length && !pron.length) return { svg: "", recortada: false };

    const umbral = d.umbral && typeof d.umbral.valor === "number" ? d.umbral.valor : null;
    const conBanda = pron.filter(function (p) {
      return typeof p.lo === "number" && typeof p.hi === "number";
    });

    // --- ejes -----------------------------------------------------------------
    // El eje de tiempo lo fija el nivel MEDIDO: es la ventana del evento. Los
    // pronósticos arrancan antes (el de las 16:50 se emitió a las 16:20) y se
    // recortan solos al dibujarse.
    const xs = (medido.length ? medido : pron).map(function (p) { return p.x; });
    let x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs);

    const ys = medido.concat(pron).map(function (p) { return p.y; });
    if (umbral !== null) ys.push(umbral);
    let y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys);

    // En el pico de una crecida la banda se abre muchísimo: el modelo sabe que no
    // sabe. Si el eje tuviera que contenerla entera, los 3 metros de crecida
    // quedarían aplastados contra el piso del gráfico y no se vería nada. Se la
    // deja estirar el eje hasta un 40 % más y lo que sobra se RECORTA: la banda
    // toca el borde, que es la señal visual de que sigue más allá, y abajo se
    // aclara por escrito.
    const holgura = 0.4 * Math.max(y1 - y0, 0.05);
    conBanda.forEach(function (p) {
      ys.push(Math.max(p.lo, y0 - holgura), Math.min(p.hi, y1 + holgura));
    });
    y0 = Math.min.apply(null, ys); y1 = Math.max.apply(null, ys);
    const margen = Math.max(0.01, (y1 - y0) * 0.12);
    y0 -= margen; y1 += margen;
    const recortada = conBanda.some(function (p) { return p.hi > y1 || p.lo < y0; });

    const sx = function (x) { return IZQ + (x - x0) / (x1 - x0) * (W - IZQ - DER); };
    const sy = function (y) { return ARR + (y1 - y) / (y1 - y0) * (BASE_NIVEL - ARR); };
    const f1 = function (v) { return v.toFixed(1); };
    const dentro = function (p) { return p.x >= x0 && p.x <= x1; };

    let svg = "";

    const paso = pasoRedondo((y1 - y0) / 4);
    const decimales = paso < 0.01 ? 3 : paso < 0.1 ? 2 : 1;
    for (let k = Math.ceil(y0 / paso); k <= Math.floor(y1 / paso); k++) {
      const yy = f1(sy(k * paso));
      svg += '<line x1="' + IZQ + '" x2="' + (W - DER) + '" y1="' + yy + '" y2="' + yy + '" class="pm-rejilla"/>' +
        '<text x="' + (IZQ - 8) + '" y="' + yy + '" class="pm-eje" text-anchor="end" dominant-baseline="middle">' +
        numero(k * paso, decimales, t) + ' m</text>';
    }

    const cada = ((x1 - x0) > 4 * 3600e3 || W < 480) ? 3600e3 : 1800e3;
    for (let k = Math.ceil(x0 / cada); k * cada <= x1; k++) {
      const xx = f1(sx(k * cada));
      svg += '<line x1="' + xx + '" x2="' + xx + '" y1="' + (H - ABA) + '" y2="' + (H - ABA + 5) + '" class="pm-rejilla"/>' +
        '<text x="' + xx + '" y="' + (H - 8) + '" class="pm-eje" text-anchor="middle">' + hora(k * cada) + '</text>';
    }

    // --- rango probable del pronóstico, a lo largo de todo el evento -----------
    if (conBanda.length > 1) {
      const visible = conBanda.filter(dentro);
      if (visible.length > 1) {
        const arriba = visible.map(function (p) { return [sx(p.x), sy(p.hi)]; });
        const abajo = visible.map(function (p) { return [sx(p.x), sy(p.lo)]; }).reverse();
        const id = "pm-ev-clip-" + (clipSeq++);
        svg += '<clipPath id="' + id + '"><rect x="' + IZQ + '" y="' + ARR +
          '" width="' + (W - IZQ - DER) + '" height="' + (BASE_NIVEL - ARR) + '"/></clipPath>' +
          '<g clip-path="url(#' + id + ')"><polygon class="pm-banda" points="' +
          arriba.concat(abajo).map(function (q) { return f1(q[0]) + "," + f1(q[1]); }).join(" ") +
          '"/></g>';
      }
    }

    // El umbral va sin rótulo adentro del gráfico: en una crecida la curva pasa
    // justo por ahí y el texto quedaba encima. El valor está en la leyenda.
    if (umbral !== null) {
      const yu = f1(sy(umbral));
      svg += '<line x1="' + IZQ + '" x2="' + (W - DER) + '" y1="' + yu + '" y2="' + yu + '" class="pm-umbral"/>';
    }

    // --- lluvia detectada: mismos bloques de altura fija que el otro gráfico ---
    if (franja) {
      const arriba = BASE_NIVEL + SEPARACION, abajo = H - ABA;
      const porMinuto = (sx(x0 + 60000) - sx(x0));
      svg += '<text x="' + IZQ + '" y="' + (arriba - 9) + '" class="pm-eje">' + escapar(t.tituloLluvia) + "</text>" +
        '<line x1="' + IZQ + '" x2="' + (W - DER) + '" y1="' + abajo + '" y2="' + abajo + '" class="pm-rejilla"/>';
      let hubo = false;
      bloques.forEach(function (p) {
        if (!(p.min > 0) || p.x > x1) return;
        hubo = true;
        const izq = Math.max(sx(p.x), IZQ);
        const der = Math.min(sx(p.x) + p.min * porMinuto, W - DER);
        if (der - izq < 0.5) return;
        svg += '<rect class="pm-lluvia" x="' + f1(izq) + '" y="' + f1(abajo - ALTO_BLOQUE) +
          '" width="' + f1(der - izq) + '" height="' + ALTO_BLOQUE + '"/>';
      });
      if (!hubo) {
        svg += '<text x="' + f1((IZQ + W - DER) / 2) + '" y="' + f1(abajo - ALTO_BLOQUE / 2) +
          '" class="pm-eje" text-anchor="middle" dominant-baseline="middle">' +
          escapar(t.sinLluvia) + "</text>";
      }
    }

    // --- las dos líneas: lo pronosticado primero, lo medido encima -------------
    const visiblePron = pron.filter(dentro);
    if (visiblePron.length) {
      svg += '<path class="pm-linea-pro" d="' + camino(visiblePron, sx, sy, f1) + '"/>';
    }
    if (medido.length) {
      svg += '<path class="pm-medido" d="' + camino(medido, sx, sy, f1) + '"/>';
    }

    // El pico, que es el instante que importa de una crecida.
    const pico = { x: instante(ev.pico && ev.pico.hora) + MEDIO, y: ev.pico && ev.pico.nivel };
    if (isFinite(pico.x) && typeof pico.y === "number" && dentro(pico)) {
      svg += '<circle class="pm-punto-pico" r="4.5" cx="' + f1(sx(pico.x)) + '" cy="' + f1(sy(pico.y)) + '"/>';
    }

    return {
      svg: '<svg class="pm-svg" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="' +
        escapar(t.evAria) + '">' + svg + "</svg>",
      recortada: recortada
    };
  }

  /** Los cuatro números del veredicto, en recuadros. */
  function metricas(ev, t) {
    const v = ev.veredicto || {};
    const caja = function (titulo, valor, destacado) {
      return '<div class="pm-ev-metrica' + (destacado ? " pm-ev-destacada" : "") + '">' +
        '<span class="pm-ev-metrica-val">' + escapar(valor) + "</span>" +
        '<span class="pm-ev-metrica-tit">' + escapar(titulo) + "</span></div>";
    };
    const cm = function (x) {
      return typeof x === "number" ? t.evCentimetros(numero(x, 1, t)) : t.evNoAplica;
    };

    let html = '<div class="pm-ev-metricas">';
    html += caja(t.evErrorMedio, cm(v.error_medio_cm), true);
    html += caja(t.evPersistencia, cm(v.error_medio_persistencia_cm));
    html += caja(t.evCobertura, typeof v.cobertura_90 === "number"
      ? Math.round(v.cobertura_90 * 100) + " %" : t.evNoAplica);
    if (ev.cruzo_umbral) {
      html += caja(t.evAviso, typeof v.aviso_pico_min === "number"
        ? t.evMinutosAntes(v.aviso_pico_min) : t.evSinAviso,
        typeof v.aviso_pico_min === "number");
    } else if (typeof v.error_pico_cm === "number") {
      html += caja(t.evErrorPico, cm(v.error_pico_cm));
    }
    return html + "</div>";
  }

  function contenidoEventos(d, t, ancho, elegido) {
    if (!d) return '<p class="pm-error">' + escapar(t.evErrorCarga) + "</p>";
    if (d.version_formato !== FORMATO_EVENTOS_QUE_SABE_LEER) {
      return '<p class="pm-error">' + escapar(t.errorFormato(d.version_formato)) + "</p>";
    }
    const eventos = d.eventos || [];
    if (!eventos.length) return '<p class="pm-estado">' + escapar(t.evVacio) + "</p>";

    const ev = eventos[elegido] || eventos[0];
    const v = ev.veredicto || {};

    // --- selector -------------------------------------------------------------
    let html = '<p class="pm-estado">' + escapar(t.evElegir) + "</p>";
    html += '<div class="pm-ev-selector" role="tablist">';
    eventos.forEach(function (e, i) {
      html += '<button type="button" class="pm-ev-boton' + (e === ev ? " pm-ev-activo" : "") +
        '" data-indice="' + i + '" role="tab" aria-selected="' + (e === ev) + '">' +
        escapar(etiquetaEvento(e, t)) + "</button>";
    });
    html += "</div>";

    // --- resumen del evento ---------------------------------------------------
    html += '<p class="pm-ev-resumen">' +
      '<span class="pm-chip">' + escapar(t.evSubida(nivelCorto(ev.subida_m, t))) + "</span>" +
      '<span class="pm-chip">' + escapar(t.evPico(nivelCorto(ev.pico && ev.pico.nivel, t))) + "</span>" +
      '<span class="pm-chip' + (ev.cruzo_umbral ? " pm-chip-umbral" : "") + '">' +
      escapar(ev.cruzo_umbral ? t.evCruzo : t.evNoCruzo) + "</span>" +
      '<span class="pm-chip' + (ev.lluvia_min_total > 0 ? " pm-chip-lluvia" : "") + '">' +
      (ev.lluvia_min_total > 0
        ? '<i class="fas fa-cloud-rain" aria-hidden="true"></i> ' + escapar(t.evLluvia(ev.lluvia_min_total))
        : escapar(t.evSinLluvia)) + "</span></p>";

    const dibujo = graficoEvento(ev, d, t, ancho);
    html += '<div class="pm-grafico">' + dibujo.svg + "</div>";

    const valorUmbral = d.umbral && typeof d.umbral.valor === "number" ? d.umbral.valor : null;
    html += '<ul class="pm-leyenda">' +
      '<li><svg width="26" height="12" aria-hidden="true"><line x1="1" x2="25" y1="6" y2="6" class="pm-medido"/></svg>' +
      escapar(t.leyMedido) + "</li>" +
      '<li><svg width="26" height="12" aria-hidden="true"><line x1="1" x2="25" y1="6" y2="6" class="pm-linea-pro"/></svg>' +
      escapar(t.evLeyPronostico) + "</li>" +
      '<li><svg width="26" height="12" aria-hidden="true"><rect x="1" y="1" width="24" height="10" class="pm-banda"/></svg>' +
      escapar(t.leyRango) + "</li>" +
      '<li><svg width="26" height="12" aria-hidden="true"><line x1="1" x2="25" y1="6" y2="6" class="pm-umbral"/></svg>' +
      escapar(t.leyUmbral + (valorUmbral !== null ? " · " + nivel(valorUmbral, t) : "")) + "</li>" +
      (ev.lluvia_min_total > 0
        ? '<li><svg width="26" height="12" aria-hidden="true"><rect x="3" y="2" width="20" height="8" class="pm-lluvia"/></svg>' +
        escapar(t.leyLluvia) + "</li>" : "") +
      "</ul>";

    html += metricas(ev, t);

    // --- notas ----------------------------------------------------------------
    html += '<p class="pm-nota"><strong>' + escapar(t.aviso) + "</strong></p>";
    html += '<p class="pm-nota">' + escapar(
      ev.origen === "operacion" ? t.evOrigenOperacion : t.evOrigenReconstruccion) + "</p>";
    html += '<p class="pm-nota">' + escapar(t.evNotaPersistencia) + "</p>";
    if (ev.cruzo_umbral) {
      html += '<p class="pm-nota">' + escapar(t.evNotaAviso(
        v.aviso_min,
        typeof v.p_maxima === "number" ? Math.round(v.p_maxima * 100) : null)) + "</p>";
    }
    if (dibujo.recortada) html += '<p class="pm-nota">' + escapar(t.evNotaBanda) + "</p>";
    if (ev.subida_m >= 1) html += '<p class="pm-nota">' + escapar(t.evNotaPico) + "</p>";
    if (typeof v.n === "number" && v.n > 0) {
      html += '<p class="pm-nota">' + escapar(t.evNotaVentana(v.n)) + "</p>";
    }
    return html;
  }

  function montarEventos(caja) {
    const t = TEXTOS[caja.getAttribute("data-lang") === "en" ? "en" : "es"];
    const url = caja.getAttribute("data-url");
    const estado = { datos: null, elegido: 0 };

    function anchoDisponible() {
      return Math.max(300, Math.min(960, Math.round((caja.clientWidth || 760) - 40)));
    }

    function pintar(cuerpo) {
      caja.innerHTML = '<div class="pm-tarjeta"><h3 class="pm-titulo">' +
        '<i class="fas fa-clock-rotate-left" aria-hidden="true"></i> ' +
        escapar(t.evTitulo) + '</h3><div class="pm-cuerpo">' + cuerpo + "</div></div>";
      const botones = caja.querySelectorAll(".pm-ev-boton");
      for (let i = 0; i < botones.length; i++) {
        botones[i].addEventListener("click", function () {
          estado.elegido = Number(this.getAttribute("data-indice")) || 0;
          const ev = (estado.datos.eventos || [])[estado.elegido];
          // La dirección queda apuntando al evento elegido: así una diapositiva
          // puede enlazar directo a uno. replaceState y no el hash a secas para
          // que el navegador no salte de posición al cambiar de evento.
          if (ev && ev.id && window.history && window.history.replaceState) {
            window.history.replaceState(null, "", "#evento=" + encodeURIComponent(ev.id));
          }
          redibujar();
        });
      }
    }

    function redibujar() {
      pintar(contenidoEventos(estado.datos, t, anchoDisponible(), estado.elegido));
    }

    /** #evento=2026-01-28T1650 en la dirección -> ese evento, si existe. */
    function elegidoPorDireccion(eventos) {
      const m = /[#&]evento=([^&]+)/.exec(window.location.hash || "");
      if (!m) return 0;
      const id = decodeURIComponent(m[1]);
      for (let i = 0; i < eventos.length; i++) if (eventos[i].id === id) return i;
      return 0;
    }

    pintar('<p class="pm-estado">' + escapar(t.evCargando) + "</p>");
    if (!url) {
      pintar('<p class="pm-error">' + escapar(t.evErrorCarga) + " (data-url)</p>");
      return;
    }

    fetch(url, { cache: "no-store" })
      .then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then(function (d) {
        estado.datos = d;
        estado.elegido = elegidoPorDireccion(d.eventos || []);
      })
      .catch(function (e) { console.warn("[eventos-mburicao]", url, e); })
      .then(redibujar);

    let espera = null;
    window.addEventListener("resize", function () {
      clearTimeout(espera);
      espera = setTimeout(function () { if (estado.datos) redibujar(); }, 200);
    });
  }

  // ============================================================ 6. ESTILOS ===
  // Todas las clases empiezan con "pm-" para no chocar con los estilos de la
  // página. Los colores son los de la página del laboratorio (#3b82f6, #8b5cf6).

  const ESTILOS =
    ".pronostico-mburicao{margin:2rem 0}" +
    ".pm-tarjeta{background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.1);color:#1e293b}" +
    ".pm-titulo{background:#3b82f6;color:#fff;padding:1rem;margin:0;font-size:1.17rem}" +
    ".pm-cuerpo{padding:1rem 1.25rem 1.25rem}" +
    ".pm-estado{margin:0 0 .75rem;color:#475569;font-size:.9rem}" +
    ".pm-alerta{margin:0 0 .75rem;padding:.6rem .8rem;border-radius:6px;background:#eff6ff;border-left:4px solid #3b82f6;font-size:.9rem;line-height:1.45}" +
    ".pm-alerta-viejo{background:#fef3c7;border-left-color:#d97706}" +
    ".pm-error{margin:0;padding:.8rem;border-radius:6px;background:#fef2f2;border-left:4px solid #dc2626;font-size:.9rem}" +
    ".pm-svg{display:block;width:100%;height:auto}" +
    ".pm-apagado{opacity:.5}" +
    ".pm-rejilla{stroke:#e2e8f0;stroke-width:1}" +
    ".pm-eje{fill:#64748b;font-size:12px}" +
    ".pm-medido{fill:none;stroke:#3b82f6;stroke-width:2.5;stroke-linejoin:round;stroke-linecap:round}" +
    ".pm-linea-pro{fill:none;stroke:#7c3aed;stroke-width:2.5;stroke-dasharray:6 4}" +
    ".pm-punto{fill:#7c3aed;stroke:#fff;stroke-width:2}" +
    ".pm-banda{fill:rgba(139,92,246,.22);stroke:none}" +
    ".pm-lluvia{fill:#0ea5e9;opacity:.85}" +
    ".pm-umbral{stroke:#dc2626;stroke-width:1.5;stroke-dasharray:5 4}" +
    ".pm-umbral-txt{fill:#dc2626;font-size:12px}" +
    ".pm-origen{stroke:#94a3b8;stroke-width:1;stroke-dasharray:2 3}" +
    ".pm-origen-txt{fill:#64748b;font-size:11px}" +
    ".pm-leyenda{display:flex;flex-wrap:wrap;gap:.4rem 1.2rem;margin:.5rem 0 1rem;padding:0;list-style:none;font-size:.85rem;color:#475569}" +
    ".pm-leyenda li{display:flex;align-items:center;gap:.4rem}" +
    ".pm-tabla-caja{overflow-x:auto}" +
    ".pm-tabla{width:100%;border-collapse:collapse;font-size:.9rem}" +
    ".pm-tabla th,.pm-tabla td{padding:.5rem .6rem;text-align:left;border-bottom:1px solid #e2e8f0;white-space:nowrap}" +
    ".pm-tabla th{color:#475569;font-weight:600;background:#f8fafc}" +
    ".pm-sutil{color:#94a3b8}" +
    ".pm-nota{margin:.6rem 0 0;font-size:.8rem;color:#64748b;line-height:1.5}" +
    ".pm-chip{display:inline-block;padding:1px 8px;border-radius:999px;background:#f1f5f9;color:#475569;white-space:nowrap}" +
    ".pm-chip-lluvia{background:#e0f2fe;color:#075985}" +
    // --- panel de eventos ---
    ".eventos-mburicao{margin:2rem 0}" +
    ".pm-ev-selector{display:flex;flex-wrap:wrap;gap:.5rem;margin:0 0 1rem}" +
    ".pm-ev-boton{padding:.45rem .85rem;border:1px solid #cbd5e1;border-radius:999px;background:#fff;" +
    "color:#334155;font:inherit;font-size:.88rem;cursor:pointer;line-height:1.2}" +
    ".pm-ev-boton:hover{border-color:#3b82f6;color:#1d4ed8}" +
    ".pm-ev-activo,.pm-ev-activo:hover{background:#3b82f6;border-color:#3b82f6;color:#fff}" +
    ".pm-ev-resumen{display:flex;flex-wrap:wrap;gap:.4rem;margin:0 0 .75rem;font-size:.9rem}" +
    ".pm-chip-umbral{background:#fee2e2;color:#991b1b}" +
    ".pm-ev-metricas{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:.6rem;margin:.25rem 0 .5rem}" +
    ".pm-ev-metrica{padding:.6rem .7rem;border-radius:6px;background:#f8fafc;border:1px solid #e2e8f0}" +
    ".pm-ev-destacada{background:#eff6ff;border-color:#bfdbfe}" +
    ".pm-ev-metrica-val{display:block;font-size:1.25rem;font-weight:600;color:#1e293b;line-height:1.3}" +
    ".pm-ev-metrica-tit{display:block;font-size:.78rem;color:#64748b}" +
    ".pm-punto-pico{fill:#3b82f6;stroke:#fff;stroke-width:2}";

  function iniciar() {
    if (!document.getElementById("pm-estilos")) {
      const s = document.createElement("style");
      s.id = "pm-estilos";
      s.textContent = ESTILOS;
      document.head.appendChild(s);
    }
    const cajas = document.querySelectorAll(".pronostico-mburicao");
    for (let i = 0; i < cajas.length; i++) montar(cajas[i]);
    const eventos = document.querySelectorAll(".eventos-mburicao");
    for (let j = 0; j < eventos.length; j++) montarEventos(eventos[j]);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar);
  else iniciar();

  window.PronosticoMburicao = { version: VERSION };
})();
