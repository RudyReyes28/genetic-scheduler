const db = require('../../db');
const { ApiError } = require('../common/errors');

const REGENERATION_FIELDS = [
  'hora_inicio_manana',
  'hora_fin_manana',
  'hora_inicio_tarde',
  'hora_fin_tarde',
  'duracion_periodo',
];

function parseTimeToMinutes(timeValue) {
  if (typeof timeValue !== 'string') {
    throw new ApiError(400, 'Formato de hora inválido. Use HH:MM o HH:MM:SS.');
  }

  const parts = timeValue.split(':').map(Number);
  if (parts.length < 2 || parts.some(Number.isNaN)) {
    throw new ApiError(400, 'Formato de hora inválido. Use HH:MM o HH:MM:SS.');
  }

  const [hours, minutes] = parts;

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    throw new ApiError(400, 'La hora enviada está fuera de rango.');
  }

  return (hours * 60) + minutes;
}

function formatMinutesAsTime(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
}

function validateConfigRanges(config) {
  const duracion = Number(config.duracion_periodo);
  if (!Number.isInteger(duracion) || duracion <= 0) {
    throw new ApiError(400, 'duracion_periodo debe ser un entero mayor que 0.');
  }

  const morningStart = parseTimeToMinutes(config.hora_inicio_manana);
  const morningEnd = parseTimeToMinutes(config.hora_fin_manana);
  const afternoonStart = parseTimeToMinutes(config.hora_inicio_tarde);
  const afternoonEnd = parseTimeToMinutes(config.hora_fin_tarde);

  if (morningStart >= morningEnd) {
    throw new ApiError(400, 'El rango de la mañana es inválido.');
  }

  if (afternoonStart >= afternoonEnd) {
    throw new ApiError(400, 'El rango de la tarde es inválido.');
  }

  return {
    duracion,
    morningStart,
    morningEnd,
    afternoonStart,
    afternoonEnd,
  };
}

function buildPeriodsForRange(startMinutes, endMinutes, duration, isMorning, startingNumber) {
  const periods = [];
  let numero = startingNumber;
  let currentStart = startMinutes;

  while ((currentStart + duration) <= endMinutes) {
    const currentEnd = currentStart + duration;

    periods.push({
      numero,
      hora_inicio: formatMinutesAsTime(currentStart),
      hora_fin: formatMinutesAsTime(currentEnd),
      es_manana: isMorning,
      es_tarde: !isMorning,
    });

    numero += 1;
    currentStart = currentEnd;
  }

  return periods;
}

function buildPeriods(config) {
  const normalized = validateConfigRanges(config);

  const morningPeriods = buildPeriodsForRange(
    normalized.morningStart,
    normalized.morningEnd,
    normalized.duracion,
    true,
    1,
  );

  const afternoonPeriods = buildPeriodsForRange(
    normalized.afternoonStart,
    normalized.afternoonEnd,
    normalized.duracion,
    false,
    morningPeriods.length + 1,
  );

  return [...morningPeriods, ...afternoonPeriods];
}

async function regenerarPeriodos(config, client = null) {
  const runner = client || db;
  const periods = buildPeriods(config);

  await runner.query('DELETE FROM periodos');

  for (const period of periods) {
    await runner.query(
      `INSERT INTO periodos (numero, hora_inicio, hora_fin, es_manana, es_tarde)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        period.numero,
        period.hora_inicio,
        period.hora_fin,
        period.es_manana,
        period.es_tarde,
      ],
    );
  }

  return periods;
}

module.exports = {
  REGENERATION_FIELDS,
  buildPeriods,
  parseTimeToMinutes,
  regenerarPeriodos,
  validateConfigRanges,
};
