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

  const VERSION = "1.0";

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
      aviso: "Producto experimental de investigación (tesis de maestría, FIUNA). No es una alerta oficial.",
      notaRango: "El rango probable contiene el nivel real 9 de cada 10 veces, en promedio a lo " +
        "largo del tiempo; no es una garantía para cada pronóstico.",
      notaUmbral: function (valor, pct, periodo) {
        return "Umbral de referencia (" + valor + "): nivel superado solo el " + pct +
          " % del tiempo" + (periodo ? " en los datos de " + periodo : "") +
          ". Es una referencia estadística, no un umbral oficial de alerta.";
      },
      aria: "Gráfico del nivel del arroyo: medido en las últimas horas y pronosticado para " +
        "los próximos 30 minutos. Los mismos valores están en la tabla de abajo.",
      coma: ","
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
      aviso: "Experimental research product (master's thesis, FIUNA). Not an official warning.",
      notaRango: "The likely range contains the actual level 9 times out of 10 on average over " +
        "time; it is not a guarantee for each individual forecast.",
      notaUmbral: function (valor, pct, periodo) {
        return "Reference threshold (" + valor + "): a level exceeded only " + pct +
          "% of the time" + (periodo ? " in the " + periodo + " data" : "") +
          ". It is a statistical reference, not an official warning threshold.";
      },
      aria: "Chart of the stream level: measured over the last hours and forecast for the " +
        "next 30 minutes. The same values are in the table below.",
      coma: "."
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

  // =========================================================== 4. GRÁFICO ===

  function grafico(d, t, ancho) {
    // El dibujo usa el ancho REAL disponible. Si fuera fijo (720), en un celular
    // el navegador lo achicaría entero, letras incluidas: los números de los ejes
    // quedaban de ~5 px, ilegibles (visto en la demo el 14-sep).
    const W = ancho, H = Math.round(Math.min(340, Math.max(220, ancho * 0.4)));
    const IZQ = 60, DER = 18, ARR = 22, ABA = 32;

    const medido = (d.observado || [])
      .map(function (p) { return { x: instante(p.hora), y: p.nivel }; })
      .filter(function (p) { return isFinite(p.x) && typeof p.y === "number"; });
    const pronostico = (d.pronostico || [])
      .map(function (p) { return { x: instante(p.hora), y: p.nivel, lo: p.min_90, hi: p.max_90 }; })
      .filter(function (p) { return isFinite(p.x) && typeof p.y === "number"; });
    if (!medido.length && !pronostico.length) return "";

    const umbral = d.umbral && typeof d.umbral.valor === "number" ? d.umbral.valor : null;
    const origen = instante(d.ultimo_dato);
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
    const sy = function (y) { return ARR + (y1 - y) / (y1 - y0) * (H - ARR - ABA); };
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

  function leyenda(t, conBanda) {
    const item = function (muestra, texto) {
      return '<li><svg width="26" height="12" aria-hidden="true">' + muestra + "</svg>" + escapar(texto) + "</li>";
    };
    return '<ul class="pm-leyenda">' +
      item('<line x1="1" x2="25" y1="6" y2="6" class="pm-medido"/>', t.leyMedido) +
      item('<line x1="1" x2="25" y1="6" y2="6" class="pm-linea-pro"/>', t.leyPronostico) +
      (conBanda ? item('<rect x="1" y="1" width="24" height="10" class="pm-banda"/>', t.leyRango) : "") +
      item('<line x1="1" x2="25" y1="6" y2="6" class="pm-umbral"/>', t.leyUmbral) +
      "</ul>";
  }

  function tabla(d, t, respaldo) {
    const filas = (d.pronostico || []).map(function (p) {
      const rango = (!respaldo && typeof p.min_90 === "number" && typeof p.max_90 === "number")
        ? nivel(p.min_90, t) + " – " + nivel(p.max_90, t) : "—";
      return "<tr><td>" + hora(instante(p.hora)) + ' <span class="pm-sutil">(+' + escapar(p.minutos) +
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
    if (!respaldo) html += '<p class="pm-nota">' + escapar(t.notaRango) + "</p>";
    if (typeof u.valor === "number" && m) {
      html += '<p class="pm-nota">' + escapar(t.notaUmbral(nivel(u.valor, t), 100 - Number(m[1]), u.periodo)) + "</p>";
    }
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

    let html = '<p class="pm-estado">' +
      escapar(t.actualizado(hora(actualizado), t.hace(duracion(edad, t)))) + " · " +
      escapar(t.ultimoDato(hora(instante(d.ultimo_dato)))) + "</p>";

    if (viejo) html += '<p class="pm-alerta pm-alerta-viejo">' + escapar(t.viejo(duracion(edad, t))) + "</p>";
    if (respaldo) html += '<p class="pm-alerta">' + escapar(t.respaldo) + "</p>";
    else if (d.estado !== "ok") html += '<p class="pm-alerta">' + escapar(t.estadoRaro(d.estado)) + "</p>";

    html += '<div class="pm-grafico' + (viejo ? " pm-apagado" : "") + '">' + grafico(d, t, ancho) + "</div>";
    html += leyenda(t, !respaldo);
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
    ".pm-nota{margin:.6rem 0 0;font-size:.8rem;color:#64748b;line-height:1.5}";

  function iniciar() {
    if (!document.getElementById("pm-estilos")) {
      const s = document.createElement("style");
      s.id = "pm-estilos";
      s.textContent = ESTILOS;
      document.head.appendChild(s);
    }
    const cajas = document.querySelectorAll(".pronostico-mburicao");
    for (let i = 0; i < cajas.length; i++) montar(cajas[i]);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar);
  else iniciar();

  window.PronosticoMburicao = { version: VERSION };
})();
