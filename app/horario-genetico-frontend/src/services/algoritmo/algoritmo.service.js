import api from '../api'

export const ejecutarAlgoritmo = (payload) => {
  return api.post('/algoritmo/ejecutar', payload)
}

export const getEstadoAlgoritmo = () => {
  return api.get('/algoritmo/estado')
}

export const getHistorialAlgoritmo = (horarioId) => {
  return api.get(`/algoritmo/historial/${horarioId}`)
}