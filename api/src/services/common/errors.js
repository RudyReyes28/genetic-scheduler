class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function mapPgError(error) {
  if (!error || !error.code) {
    return error;
  }

  if (error.code === '22P02') {
    return new ApiError(400, 'Formato de dato inválido. Verifique tipos y valores enviados.');
  }

  if (error.code === '23502') {
    return new ApiError(400, 'Faltan campos obligatorios para completar la operación.');
  }

  if (error.code === '23503') {
    return new ApiError(409, 'No se puede completar la operación por integridad referencial.');
  }

  if (error.code === '23505') {
    return new ApiError(409, 'Ya existe un registro con esos datos únicos.');
  }

  return error;
}

module.exports = {
  ApiError,
  mapPgError,
};
