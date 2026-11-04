/* prueba.js — la prueba gratuita que se cierra sola.
 *
 * Fernando, 4-nov-2026 (Villas Cádiz): 15 días de prueba, "y si quiere más tiempo le
 * damos más tiempo". Arriba se ve cuántos días quedan y, pasado el último, el sistema se
 * cierra: queda una pantalla de "la prueba terminó" y ya no se puede usar. Los datos no
 * se borran (por si contratan). Quién lleva la cuenta:
 * - En línea (nube.js): el servidor, desde la primera vez que alguien entra. Vonoa Web la
 *   alarga en la base (cuota-clara-nube/scripts/extender.js) y aquí se abre sola.
 * - En el programa de escritorio: main.js (prueba.json), y la alarga licencia.json.
 * - En un demo del navegador: `prueba: { vence: 'AAAA-MM-DD' }` en el perfil; una vez
 *   vencida se queda vencida aunque atrasen el reloj.
 * Sin prueba (Mallorca, los demos) este archivo no hace nada.
 */
window.CC = window.CC || {};

CC.Prueba = (function () {
  var E = window.escritorio && window.escritorio.prueba ? window.escritorio : null;
  var NB = CC.Nube && CC.Nube.activa ? CC.Nube : null;
  var P = CC.Perfil && CC.Perfil.prueba;
  var estado = null;

  function nombreCond() {
    return (CC.Perfil.condominio && CC.Perfil.condominio.nombre) || 'su condominio';
  }

  function revisarDeNuevo() {
    return E ? E.revisarPrueba() : NB ? NB.revisarPrueba() : Promise.resolve(estado);
  }

  function cerrar() {
    if (document.getElementById('pruebaVencida')) return;
    var esc = CC.ui.esc, cond = nombreCond(), conBoton = !!(E || NB);
    document.documentElement.classList.add('con-puerta');      // esconde el sistema, como la entrada con contraseña
    var caja = document.createElement('div');
    caja.className = 'puerta puerta--vencida';
    caja.id = 'pruebaVencida';
    caja.innerHTML =
      '<div class="puerta__caja">' +
      '<h1>La prueba de Cuota Clara terminó</h1>' +
      '<p class="puerta__txt">Gracias por probar el sistema en ' + esc(cond) + '. La prueba gratuita fue hasta el ' +
      esc(CC.fmt.fechaLarga(estado.vence)) + '. Lo que capturaron sigue guardado.</p>' +
      '<p class="puerta__txt">Para seguir usándolo o para tener más días de prueba, escríbanos.' +
      (conBoton ? ' Si ya nos lo pidieron, toquen «Revisar de nuevo» y se abre solo.' : '') + '</p>' +
      '<a class="btn" href="mailto:hola@vonoaweb.com?subject=' + encodeURIComponent('Cuota Clara para ' + cond) + '">Escribir a Vonoa Web</a>' +
      (conBoton ? '<button type="button" class="btn btn--ghost" id="bRevisarPrueba">Revisar de nuevo</button>'
        : '<a class="btn btn--ghost" href="https://vonoaweb.com" target="_blank" rel="noopener">vonoaweb.com</a>') +
      '</div>';
    document.body.appendChild(caja);
    var b = document.getElementById('bRevisarPrueba');
    if (b) b.onclick = function () {
      b.disabled = true;
      b.textContent = 'Revisando…';
      revisarDeNuevo().then(function (s) {
        if (s && (!s.activa || !s.vencida)) { location.reload(); return; }
        b.disabled = false;
        b.textContent = 'Revisar de nuevo';
        CC.ui.toast('Todavía no hay más días. Si ya nos escribieron, intenten en un rato.', 'crit');
      });
    };
  }

  /** La pastilla de arriba: cuántos días quedan (en ámbar los últimos tres). */
  function pintar() {
    var top = document.querySelector('.topbar__id');
    if (!top) return;
    var p = document.getElementById('topPrueba');
    if (!p) {
      p = document.createElement('p');
      p.id = 'topPrueba';
      top.insertBefore(p, top.firstChild);
    }
    p.className = 'topbar__prueba' + (estado.dias <= 3 ? ' topbar__prueba--fin' : '');
    p.title = 'La prueba gratuita termina el ' + CC.fmt.fechaLarga(estado.vence);
    p.textContent = 'Prueba gratis · ' + (estado.dias === 1 ? 'último día' : 'quedan ' + estado.dias + ' días') +
      ' (hasta el ' + CC.fmt.fecha(estado.vence) + ')';
  }

  /** Un estado nuevo de la prueba (al abrir, o cuando Vonoa Web la alarga o le quita el límite). */
  function aplicar(s) {
    var bloqueado = !!document.getElementById('pruebaVencida');
    if (!s || !s.activa) {
      if (bloqueado) location.reload();
      else { var q = document.getElementById('topPrueba'); if (q) q.remove(); }
      return;
    }
    estado = s;
    if (s.vencida) cerrar();
    else if (bloqueado) location.reload();
    else pintar();
  }

  function cuandoCargue(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  if (NB) {
    NB.alPrueba(function (s) { cuandoCargue(function () { aplicar(s); }); });
    return { activa: true };
  }

  if (E) {
    estado = E.prueba();                       // null: el programa no es de prueba
    if (E.alCambiarPrueba) E.alCambiarPrueba(aplicar);
  } else if (P && P.vence) {
    estado = (function () {
      var LLAVE = 'cuotaclara.prueba.' + (CC.Perfil.llave || CC.Perfil.id || 'demo');
      var g = {};
      try { g = JSON.parse(window.localStorage.getItem(LLAVE) || '{}'); } catch (e) { /* sin guardar */ }
      // El día de hoy, pero nunca antes del último que se vio (no se gana tiempo atrasando el reloj)
      var hoy = CC.per.hoyISO();
      if (g.visto && g.visto > hoy) hoy = g.visto;
      var vencida = !!g.vencida || hoy > P.vence;
      try { window.localStorage.setItem(LLAVE, JSON.stringify({ visto: hoy, vencida: vencida })); } catch (e) { /* sin guardar */ }
      var dias = Math.max(0, Math.round((Date.parse(P.vence + 'T12:00:00') - Date.parse(hoy + 'T12:00:00')) / 86400000) + 1);
      return { activa: true, vence: P.vence, dias: dias, vencida: vencida };
    })();
  }
  if (!estado || !estado.activa) return { activa: false };

  cuandoCargue(function () { aplicar(estado); });
  return { activa: true, vencida: estado.vencida, dias: estado.dias, vence: estado.vence };
})();
