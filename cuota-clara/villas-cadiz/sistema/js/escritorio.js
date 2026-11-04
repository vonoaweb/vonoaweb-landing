/* escritorio.js — cuando el sistema corre como programa instalado.
 *
 * En el programa de escritorio la base de datos vive en un archivo de
 * Documentos\Cuota Clara (con un respaldo por día), no escondida en el
 * navegador. Aquí se conecta ese archivo y se avisa cuando hay una versión
 * nueva lista para instalar. En un navegador normal este archivo no hace nada.
 */
window.CC = window.CC || {};

(function () {
  var E = window.escritorio;
  if (!E) return;

  var pendiente = null, temporizador = null;
  // Si el archivo existe pero no se pudo leer, no se escribe nada encima (el programa
  // ya lo revisa al abrir; esto es por si acaso)
  var noTocar = false;

  /* Guardar es inmediato para quien usa el sistema; al disco va un instante
     después, para no escribir el archivo diez veces en un segundo. */
  CC.Store.preferirDriver({
    nombre: 'archivo',
    disponible: function () { return true; },
    leer: function () {
      var t = E.leerSync();
      if (!t) return null;
      try { return JSON.parse(t); } catch (e) {
        noTocar = true;
        window.alert('El archivo de datos no se pudo leer. Cierre Cuota Clara y vuelva a abrirlo; ' +
          'si sigue igual, comuníquese con Vonoa Web. No se guardará nada mientras tanto.');
        return null;
      }
    },
    escribir: function (datos) {
      if (noTocar) return false;
      pendiente = JSON.stringify(datos);
      clearTimeout(temporizador);
      temporizador = setTimeout(function () {
        var t = pendiente;
        pendiente = null;
        E.escribir(t);
      }, 400);
      return true;
    },
    borrar: function () { return false; }
  });

  // Si cierran la ventana justo después de capturar, se guarda antes de salir
  window.addEventListener('beforeunload', function () {
    if (pendiente) { E.escribirSync(pendiente); pendiente = null; }
  });

  /* Versión nueva descargada: un aviso para reiniciar cuando les convenga */
  E.alActualizacionLista(function (info) {
    var aviso = document.getElementById('avisoActualizacion');
    if (!aviso) {
      aviso = document.createElement('div');
      aviso.id = 'avisoActualizacion';
      aviso.className = 'actualizacion';
      document.body.appendChild(aviso);
    }
    aviso.innerHTML = '<span><strong>Hay una versión nueva del sistema (' + CC.ui.esc(info.version) + ').</strong> ' +
      'Sus datos no se tocan.</span>' +
      '<button type="button" class="btn btn--sm" id="bActualizar">Reiniciar y actualizar</button>' +
      '<button type="button" class="iconbtn" id="bLuego" title="Después">' + CC.ui.icono('cerrar', 'i--sm') + '</button>';
    document.getElementById('bActualizar').onclick = function () {
      if (pendiente) { E.escribirSync(pendiente); pendiente = null; }
      E.instalarActualizacion();
    };
    document.getElementById('bLuego').onclick = function () { aviso.remove(); };
  });

  // Recibos, reportes y respaldos van a Documentos\Cuota Clara\Documentos: que se sepa dónde quedó
  if (E.alDocumentoGuardado) {
    E.alDocumentoGuardado(function (ruta) {
      var partes = String(ruta || '').split(/[\\/]/);
      var i = partes.indexOf('Cuota Clara');
      CC.ui.toast('Guardado en ' + (i >= 0 ? 'Documentos\\' + partes.slice(i).join('\\') : ruta), 'good');
    });
  }

  CC.Escritorio = {
    version: E.version,
    abrirCarpeta: function () { return E.abrirCarpeta(); },
    rutas: function () { return E.rutas(); },
    buscarActualizacion: function () { return E.buscarActualizacion(); }
  };
})();
