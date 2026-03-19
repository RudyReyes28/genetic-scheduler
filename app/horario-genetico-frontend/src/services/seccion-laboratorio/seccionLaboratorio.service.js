import api from '../api'

export const getSeccionLaboratorios = () => {
  return api.get('/seccion-laboratorio')
}

export const getSeccionLaboratorioById = (id) => {
  return api.get(`/seccion-laboratorio/${id}`)
}

export const createSeccionLaboratorio = (data) => {
  return api.post('/seccion-laboratorio', data)
}

export const updateSeccionLaboratorio = (id, data) => {
  return api.put(`/seccion-laboratorio/${id}`, data)
}

export const deleteSeccionLaboratorio = (id) => {
  return api.delete(`/seccion-laboratorio/${id}`)
}
