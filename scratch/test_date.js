const programacion = [
  {
    id_visitante: 6,
    nombre: 'Jesus Roberto Osuna',
    num_bosquejo: '193',
    tema: 'Pronto se nos librará de la angustia mundial',
    cancion: null,
    telefono: null,
    fecha_discurso: '2026-05-03',
    congregacion: 'Campestre',
    asistio: null
  }
];

const fullDateStr = "2026-05-03";

const dataRow = programacion.find(p => {
  const pDate = new Date(p.fecha_discurso);
  console.log("pDate:", pDate);
  // Ajustar por zona horaria para obtener la fecha local correcta en formato string
  const pDateStr = new Date(pDate.getTime() - pDate.getTimezoneOffset() * 60000).toISOString().split('T')[0];
  console.log("pDateStr:", pDateStr, "fullDateStr:", fullDateStr);
  return pDateStr === fullDateStr;
});

console.log("Found:", !!dataRow);
