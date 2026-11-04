/* nube.js — el sistema guardado en línea (vonoaweb.com/cuota-clara/<condominio>/sistema/).
 *
 * Fernando, 4-nov-2026 (Villas Cádiz): "que sea en navegador, pon usuario y contraseña ...
 * y uno de personas que puedan hacer reservación". Si el perfil trae
 * `nube: { condominio: 'villas-cadiz' }` (y no es el programa de escritorio):
 *   - Antes de arrancar la aplicación pide usuario y contraseña (al servidor, el Worker
 *     cuota-clara-nube) y baja el estado del condominio.
 *   - Administración: la aplicación completa. Cada cambio se sube un momento después; si
 *     mientras tanto un vecino apartó algo, el servidor responde con lo nuevo y aquí se
 *     junta (sus reservas no se pierden) y se vuelve a subir.
 *   - Vecinos: solo Reservas. Lo que apartan va directo al servidor, que revisa las reglas.
 *   - Cada minuto pregunta si hay algo nuevo (lo que apartaron los vecinos, o más días de
 *     prueba) y redibuja.
 * La prueba (días que quedan, vencida) la pinta prueba.js con lo que dice el servidor.
 */
window.CC = window.CC || {};

CC.Nube = (function () {
  var N = CC.Perfil && CC.Perfil.nube;
  if (!N || window.escritorio) return { activa: false };

  // En vonoaweb.com el servidor está en el mismo sitio; probando en la computadora, en wrangler dev
  var API = N.api || (/^(localhost|127\.0\.0\.1)$/.test(location.hostname) ? 'http://127.0.0.1:8787/api/cuota-clara' : '/api/cuota-clara');
  var SLUG = N.condominio;
  var LLAVE = 'cuotaclara.nube.' + SLUG;
  var sesion = null;                  // { token, rol, nombre }
  var version = 0, cache = null, idsBase = {};
  var pendiente = null, temporizador = null, subiendo = false, reintento = null;
  var prueba = null, oyentesPrueba = [];
  var listo = false;

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function leerSesion() { try { return JSON.parse(localStorage.getItem(LLAVE) || 'null'); } catch (e) { return null; } }
  function guardarSesion(s) { try { if (s) localStorage.setItem(LLAVE, JSON.stringify(s)); else localStorage.removeItem(LLAVE); } catch (e) { /* solo en memoria */ } }

  function pedir(metodo, ruta, cuerpo) {
    var h = { 'content-type': 'application/json' };
    if (sesion && sesion.token) h.authorization = 'Bearer ' + sesion.token;
    return fetch(API + ruta, {
      method: metodo, headers: h, cache: 'no-store',
      body: cuerpo === undefined ? undefined : (typeof cuerpo === 'string' ? cuerpo : JSON.stringify(cuerpo))
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (d) { d._status = r.status; return d; });
    });
  }

  /* ---------- La prueba: lo que dice el servidor ---------- */
  function avisarPrueba(p) {
    if (!p) return;
    var antes = JSON.stringify(prueba);
    prueba = p;
    if (JSON.stringify(p) !== antes) oyentesPrueba.forEach(function (fn) { try { fn(p); } catch (e) { /* nada */ } });
  }
  /** Respuestas que no son de la operación: sesión vencida o prueba terminada. */
  function revisar(d) {
    if (d._status === 401) { guardarSesion(null); location.reload(); return true; }
    if (d._status === 403 && d.vencida) { avisarPrueba(d.prueba); return true; }
    if (d.prueba) avisarPrueba(d.prueba);
    return false;
  }

  /* ---------- Entrar ---------- */
  function pantallaEntrar(alEntrar, mensaje) {
    document.documentElement.classList.add('con-puerta');
    var nombre = (CC.Perfil.condominio && CC.Perfil.condominio.nombre) || '';
    var caja = document.getElementById('nubeEntrar') || document.createElement('div');
    caja.id = 'nubeEntrar';
    caja.className = 'puerta puerta--nube';
    caja.innerHTML =
      '<form class="puerta__caja" id="nubeForm" autocomplete="on">' +
      '<p class="nube__marca">Cuota Clara</p>' +
      '<h1>' + esc(nombre) + '</h1>' +
      '<p class="puerta__txt">Entra con el usuario y la contraseña que te dio Vonoa Web.</p>' +
      '<label class="field"><span class="field__lab">Usuario</span><input class="input" id="nubeUsuario" autocomplete="username" autocapitalize="none" spellcheck="false" required></label>' +
      '<label class="field"><span class="field__lab">Contraseña</span><input class="input" id="nubeClave" type="password" autocomplete="current-password" required></label>' +
      '<p class="nube__error" id="nubeError" role="alert">' + esc(mensaje || '') + '</p>' +
      '<button class="btn" type="submit" id="nubeOk">Entrar</button>' +
      '<p class="puerta__txt nube__pie">¿No tienes tu acceso? Pídeselo a la administración.</p>' +
      '</form>';
    if (!caja.parentNode) document.body.appendChild(caja);
    var u = document.getElementById('nubeUsuario');
    setTimeout(function () { u.focus(); }, 50);
    document.getElementById('nubeForm').onsubmit = function (e) {
      e.preventDefault();
      var boton = document.getElementById('nubeOk');
      boton.disabled = true;
      boton.textContent = 'Entrando…';
      sesion = null;
      pedir('POST', '/entrar', { condominio: SLUG, usuario: u.value, clave: document.getElementById('nubeClave').value })
        .then(function (d) {
          if (d._status !== 200 || !d.token) throw new Error(d.error || 'No se pudo entrar.');
          sesion = { token: d.token, rol: d.rol, nombre: d.nombre };
          guardarSesion(sesion);
          caja.remove();
          document.documentElement.classList.remove('con-puerta');
          alEntrar();
        })
        .catch(function (err) {
          boton.disabled = false;
          boton.textContent = 'Entrar';
          document.getElementById('nubeError').textContent = err && err.message === 'Failed to fetch'
            ? 'No hay conexión con el servidor. Revisa el internet e intenta de nuevo.' : (err.message || 'No se pudo entrar.');
        });
    };
  }

  function salir() {
    if (pendiente || subiendo) {
      if (!window.confirm('Todavía se están guardando los últimos cambios. ¿Salir de todos modos?')) return;
    }
    guardarSesion(null);
    location.reload();
  }

  /* ---------- Guardar en línea (solo la administración) ---------- */
  function ids(estado) {
    var o = {};
    ((estado && estado.reservas) || []).forEach(function (r) { o[r.id] = 1; });
    return o;
  }

  // Las casas que no pueden apartar por adeudo (la cuenta de vecinos no ve adeudos)
  function marcarBloqueadas(e) {
    var meses = 0;
    (e.amenidades || []).forEach(function (a) { meses = Math.max(meses, Number(a.mesesBloqueo) || 0); });
    if (!meses || !CC.Model || !CC.Model.situacion) { e.meta.casasBloqueadas = []; return; }
    e.meta.casasBloqueadas = (e.unidades || []).filter(function (u) {
      try {
        var s = CC.Model.situacion(u.id), cv = CC.Model.convenioDe(u.id);
        return s.mesesVencidos >= meses && !(cv && cv.estado === 'al dia');
      } catch (err) { return false; }
    }).map(function (u) { return u.id; });
  }

  function barra(que) {
    var el = document.getElementById('topNube');
    if (!el) return;
    el.className = 'topbar__nube topbar__nube--' + que;
    el.querySelector('span').textContent = { guardado: 'Guardado en línea', guardando: 'Guardando…', error: 'Sin conexión: se guarda al volver' }[que] || '';
  }

  function subir() {
    if (subiendo || !pendiente || sesion.rol !== 'admin') return;
    subiendo = true;
    clearTimeout(reintento);
    var datos = pendiente;
    pendiente = null;
    barra('guardando');
    try { marcarBloqueadas(datos); } catch (e) { /* sin bloqueos */ }
    var cuerpo = JSON.stringify({ version: version, estado: datos });
    pedir('PUT', '/estado', cuerpo).then(function (d) {
      subiendo = false;
      if (d._status === 200) {
        version = d.version;
        idsBase = ids(datos);
        if (pendiente) subir(); else barra('guardado');
        return;
      }
      if (d._status === 409) { juntar(d); return; }
      if (revisar(d)) return;
      pendiente = pendiente || datos;
      barra('error');
      reintento = setTimeout(subir, 8000);
    }, function () {
      subiendo = false;
      pendiente = pendiente || datos;
      barra('error');
      reintento = setTimeout(subir, 8000);
    });
  }

  /** Alguien guardó antes (un vecino apartó): se suma lo suyo a lo de aquí y se vuelve a subir. */
  function juntar(d) {
    var local = JSON.parse(JSON.stringify(CC.Store.estado()));
    var servidor = d.estado || {};
    var mias = ids(local);
    var nuevas = (servidor.reservas || []).filter(function (r) { return !idsBase[r.id] && !mias[r.id]; });
    local.reservas = (local.reservas || []).concat(nuevas);
    // sus líneas de la bitácora ("en línea") también
    var vistas = {};
    (local.bitacora || []).forEach(function (b) { vistas[b.fecha + b.accion + b.detalle] = 1; });
    (servidor.bitacora || []).forEach(function (b) {
      if (/en línea$/.test(b.detalle || '') && !vistas[b.fecha + b.accion + b.detalle]) local.bitacora.push(b);
    });
    version = d.version;
    Object.keys(ids(servidor)).forEach(function (k) { idsBase[k] = 1; });
    if (nuevas.length) {
      cache = local;
      CC.Store.usarDriver(driver);          // se redibuja con lo nuevo
      CC.ui.toast(nuevas.length === 1 ? 'Un vecino apartó en línea' : nuevas.length + ' reservas nuevas de los vecinos', 'good');
    }
    pendiente = CC.Store.estado();
    subir();
  }

  var driver = {
    nombre: 'nube',
    disponible: function () { return true; },
    leer: function () { return cache ? JSON.parse(JSON.stringify(cache)) : null; },
    escribir: function (datos) {
      if (!sesion || sesion.rol !== 'admin') return true;      // los vecinos no guardan el estado completo
      pendiente = datos;
      clearTimeout(temporizador);
      temporizador = setTimeout(subir, 700);
      return true;
    },
    borrar: function () { return false; }
  };

  /* ---------- Lo nuevo de los demás, cada minuto ---------- */
  function vigilar() {
    setInterval(function () {
      if (document.hidden) return;
      pedir('GET', '/version').then(function (d) {
        if (revisar(d) || d._status !== 200) return;
        if (d.version > version && !pendiente && !subiendo) traerEstado(true);
      }, function () { /* sin conexión: se intenta al siguiente minuto */ });
    }, 60000);
  }

  function traerEstado(redibujar) {
    return pedir('GET', '/estado').then(function (d) {
      if (revisar(d)) return false;
      if (d._status !== 200) throw new Error(d.error || 'No se pudo leer el condominio.');
      version = d.version;
      cache = d.estado;
      idsBase = ids(cache);
      if (redibujar) CC.Store.usarDriver(driver);
      return true;
    });
  }

  /* ---------- Vecinos: solo Reservas ---------- */
  function modoVecinos() {
    document.documentElement.classList.add('modo-vecino');
    var ir = function () { if (!/^#\/reservas/.test(location.hash)) location.hash = '#/reservas'; };
    window.addEventListener('hashchange', ir);
    ir();

    var original = CC.Store.agregarReserva;
    CC.Store.agregarReserva = function (b) {
      var r = original.call(CC.Store, b);          // se ve al momento; el servidor decide
      pedir('POST', '/reserva', { reserva: r }).then(function (d) {
        if (d._status === 200 && d.reserva) { r.registrado = d.reserva.registrado; version = d.version; return; }
        if (revisar(d)) return;
        quitar(r);
        CC.ui.cerrarModal();
        CC.ui.toast(d.error || 'No se pudo apartar. Intenta de nuevo.', 'crit');
        traerEstado(true);
      }, function () {
        quitar(r);
        CC.ui.cerrarModal();
        CC.ui.toast('No hay conexión: no se apartó. Intenta de nuevo.', 'crit');
      });
      return r;
    };
    CC.Store.cancelarReserva = function () {
      CC.ui.toast('Para cancelar un apartado, avísenle a la administración.', 'crit');
    };
    function quitar(r) {
      var e = JSON.parse(JSON.stringify(CC.Store.estado()));
      e.reservas = (e.reservas || []).filter(function (x) { return x.id !== r.id; });
      cache = e;
      CC.Store.usarDriver(driver);
    }
  }

  /* ---------- Arriba: guardado y salir ---------- */
  function pintarBarra() {
    var tools = document.querySelector('.topbar__tools');
    if (!tools || document.getElementById('topNube')) return;
    var cajita = document.createElement('div');
    cajita.className = 'topbar__sesion';
    cajita.innerHTML = '<span class="topbar__nube topbar__nube--guardado" id="topNube" title="' + esc(sesion.nombre || '') + '"><i></i><span>' +
      (sesion.rol === 'admin' ? 'Guardado en línea' : 'Vecinos · en línea') + '</span></span>' +
      '<button type="button" class="btn btn--ghost btn--sm" id="bSalirNube">Salir</button>';
    tools.appendChild(cajita);
    document.getElementById('bSalirNube').onclick = salir;
  }

  function sinCondominio() {
    document.documentElement.classList.add('con-puerta');
    var caja = document.createElement('div');
    caja.className = 'puerta';
    caja.innerHTML = '<div class="puerta__caja"><h1>Todavía no hay áreas para apartar</h1>' +
      '<p class="puerta__txt">La administración está dando de alta el condominio. Intenten más tarde.</p>' +
      '<button type="button" class="btn btn--ghost" id="bSalirNube2">Salir</button></div>';
    document.body.appendChild(caja);
    document.getElementById('bSalirNube2').onclick = salir;
  }

  /** Lo llama app.js antes de arrancar: entra, baja el estado y luego sí arranca. */
  function arrancar(iniciarApp) {
    var seguir = function () {
      traerEstado(false).then(function (ok) {
        if (!ok) return;                                   // prueba vencida: prueba.js cierra
        if (sesion.rol !== 'admin' && !cache) { sinCondominio(); return; }
        CC.Store.preferirDriver(driver);
        listo = true;
        iniciarApp();
        if (sesion.rol !== 'admin') modoVecinos();
        pintarBarra();
        vigilar();
      }).catch(function (err) {
        pantallaEntrar(seguir, err.message === 'Failed to fetch' ? 'No hay conexión con el servidor.' : err.message);
      });
    };
    sesion = leerSesion();
    if (sesion && sesion.token) seguir();
    else pantallaEntrar(seguir);
  }

  window.addEventListener('beforeunload', function (e) {
    if (pendiente || subiendo) { subir(); e.preventDefault(); e.returnValue = ''; }
  });

  return {
    activa: true,
    arrancar: arrancar,
    listo: function () { return listo; },
    rol: function () { return sesion && sesion.rol; },
    alPrueba: function (fn) { oyentesPrueba.push(fn); if (prueba) fn(prueba); },
    revisarPrueba: function () {
      return pedir('GET', '/version').then(function (d) { revisar(d); return prueba; }, function () { return prueba; });
    }
  };
})();
