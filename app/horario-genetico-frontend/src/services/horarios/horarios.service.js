import api from '../api'

export const getHorarios = () => {
  return api.get('/horarios')
}

export const getHorarioById = (id, params = {}) => {
  return api.get(`/horarios/${id}`, { params })
}

export const getConflictosHorario = (id) => {
  return api.get(`/horarios/${id}/conflictos`)
}

export const getReporteHorario = (id) => {
  return api.get(`/horarios/${id}/reporte`)
}

export const activarHorario = (id) => {
  return api.put(`/horarios/${id}/activar`)
}

export const deleteHorario = (id) => {
  return api.delete(`/horarios/${id}`)
}

export const updateHorarioDetalle = (horarioId, detalleId, payload) => {
  return api.put(`/horarios/${horarioId}/detalle/${detalleId}`, payload)
}