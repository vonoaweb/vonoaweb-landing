/* perfil.js — Villas Cádiz, prueba de 15 días EN LÍNEA (4-nov-2026).
 *
 * Fernando: "el demo todo limpio, que ya lo puedan usar"; "que sea en navegador, pon
 * usuario y contraseña ... y uno de personas que puedan hacer reservación". Vive en
 * vonoaweb.com/cuota-clara/villas-cadiz/sistema/ (python armar-cliente.py villas-cadiz-prueba)
 * y guarda en el Worker cuota-clara-nube (js/nube.js): la administradora entra con su
 * usuario y tiene todo el sistema; la cuenta "vecinos" solo aparta canchas y casa club.
 * Empieza en blanco (produccion): Primeros pasos con el nombre, las 131 casas previstas,
 * las canchas y la casa club (sin renta ni depósito inventados), visitas y categorías.
 * La prueba (15 días desde que alguien entra; se alarga con cuota-clara-nube/scripts/
 * extender.js) la lleva el servidor. Los vecinos, montos y cuenta del bloque de abajo
 * solo se usan en el demo de ejemplo; aquí no aparecen (empieza vacío).
 */
window.CC = window.CC || {};
CC.Perfil = {
  id: 'villascadiz',
  semilla: 'cadiz-5',
  produccion: true,
  nube: { condominio: 'villas-cadiz' },
  prueba: { dias: 15 },

  condominio: {
    nombre: 'Villas Cádiz',
    direccion: '',
    ciudad: '',
    administrador: 'Comité de Administración',
    telefono: '',
    email: '',
    cuenta: 'Banorte 0456 7890 12 — CLABE 072320004567890123',
    saldoInicialCaja: 236000,
    registroVisitas: true,
    mesesGratisAnualidad: 1
  },

  /* Casas 1 a 131. La clave es el número. */
  calles: ['Villas Cádiz'],
  casasPorCalle: 131,
  formatoClave: '{n}',
  prototipos: [
    { tipo: 'A', m2: 160, peso: 50 },
    { tipo: 'B', m2: 200, peso: 35 },
    { tipo: 'C', m2: 240, peso: 15 }
  ],

  /* Presupuesto mensual de egresos. Suma 158,500. */
  categorias: [
    ['Vigilancia', 60000, 'Seguridad Privada Altavista'],
    ['Energía eléctrica', 19000, 'CFE Suministrador'],
    ['Administración', 17000, 'Honorarios de administración'],
    ['Jardinería', 16000, 'Jardines del Bosque'],
    ['Limpieza', 11000, 'Servicios Integrales Muñoz'],
    ['Agua', 8000, 'SIAPA'],
    ['Recolección de basura', 7000, 'Recolectora Metropolitana'],
    ['Casa club', 6500, 'Mantenimiento de la casa club'],
    ['Mantenimiento y bombas', 5500, 'Hidroservicio GDL'],
    ['Canchas de tenis', 4500, 'Tenis y Superficies de Occidente'],
    ['Seguro del inmueble', 4000, 'Seguros Atlas — póliza anual']
  ],
  presupuestoMensual: 175000,
  cuotaExtra: 900,
  conceptoExtra: 'Cuota extraordinaria — resanado y pintura de las canchas de tenis',

  /* Sin casa de prueba: el demo se enseña a otras personas y no debe llevar
     ningún teléfono real (Fernando, 27-oct). */
  casaPrueba: null,

  amenidades: [
    {
      id: 'ame_tenis_1', nombre: 'Cancha de tenis 1', tipo: 'tenis',
      abre: '07:00', cierra: '22:00', maxHorasDia: 2, anticipacionDias: 7, mesesBloqueo: 3
    },
    {
      id: 'ame_tenis_2', nombre: 'Cancha de tenis 2', tipo: 'tenis',
      abre: '07:00', cierra: '22:00', maxHorasDia: 2, anticipacionDias: 7, mesesBloqueo: 3
    },
    {
      id: 'ame_club', nombre: 'Casa club', tipo: 'club',
      abre: '09:00', cierra: '23:00', maxHorasDia: 6, anticipacionDias: 60, mesesBloqueo: 3
    }
  ],

  /* Pagos adelantados: unas casas pagaron el año en julio (12 meses por 11) */
  anualidad: { mesesGratis: 1, cada: 11 },
  registroVisitas: true,

  capitulosExtra: [
    {
      nombre: 'Canchas de tenis',
      articulos: [
        'Las canchas de tenis son para los residentes y sus invitados. Se apartan con la administración o desde el portal, por bloques de una hora, de 7:00 a 22:00 h.',
        'Cada casa puede apartar hasta dos horas al día, con un máximo de siete días de anticipación. Si no van a usar la cancha, deben avisar para liberarla.',
        'Si nadie de la casa llega en los primeros quince minutos de su horario, la cancha queda libre para quien la pida.',
        'Las casas con tres o más mensualidades vencidas no pueden apartar las canchas ni la casa club hasta ponerse al corriente o tener un convenio de pago al día.',
        'Se juega con calzado para tenis de suela lisa. No se permiten bicicletas, patines, mascotas ni alimentos dentro de la cancha.',
        'Los invitados deben ir acompañados por un residente de la casa que apartó. Cada casa responde por los daños que causen sus invitados.'
      ]
    },
    {
      nombre: 'Casa club',
      articulos: [
        'La casa club se aparta con hasta sesenta días de anticipación, por un máximo de seis horas, entre las 9:00 y las 23:00 h.',
        'Al apartarla se paga una renta de $800 y un depósito en garantía de $1,500, que se devuelve al día siguiente si el área se entrega limpia y sin daños.',
        'El evento termina a las 23:00 h. Después de las 22:00 h la música debe bajar de volumen para no molestar a las casas vecinas.',
        'La casa que apartó responde por sus invitados y por cualquier daño al mobiliario, al equipo y a la construcción.'
      ]
    },
    {
      nombre: 'Visitas y acceso',
      articulos: [
        'Toda visita se registra en la caseta con su nombre, la casa a la que va y, si llega en auto, sus placas.',
        'Los residentes pueden avisar desde el portal quién los va a visitar; el guardia la deja pasar con solo confirmar su nombre.',
        'Los repartidores y conductores de aplicación entregan en la caseta o entran solo con autorización de la casa.'
      ]
    }
  ],

  avisoObra: {
    titulo: 'Cancha de tenis 2 cerrada el lunes por mantenimiento',
    cuerpo: 'El lunes se resanará la superficie y se cambiará la red de la cancha 2. La cancha 1 sigue abierta.\n' +
      'Las reservas de ese día se pasan a la cancha 1 o a otro horario; la administración se comunica con cada casa.'
  },
  avisoHorario: {
    titulo: 'Paguen el año y llévense un mes gratis',
    cuerpo: 'Quien pague por adelantado las doce cuotas del año paga solo once. En el portal ven hasta qué mes tienen pagado y bajan todos sus recibos.'
  },
  temaAsamblea: 'el resanado de las canchas de tenis, el reglamento de la casa club',
  limpiezaCaja: 'Material de limpieza para la casa club',
  ingresoCaja: ['Renta de la casa club', 800, 'Casa club'],
  papeleria: 'Papelería Escolar'
};
