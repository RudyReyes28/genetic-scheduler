import api from '../api'

export const getEstadoBaseDatos = () => {
  return api.get('/reset/estado')
}

export const eliminarHorarios = () => {
  return api.delete('/reset/horarios')
}

export const limpiarBaseDatosCompleta = () => {
  return api.delete('/reset/completo')
}
