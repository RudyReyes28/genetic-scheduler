import api from '../api'

export const getCarreras = () => api.get('/carreras')
export const getCarreraById = (id) => api.get(`/carreras/${id}`)
export const getCarreraByCodigo = (codigo) => api.get(`/carreras/codigo/${codigo}`)
export const createCarrera = (data) => api.post('/carreras', data)
export const updateCarrera = (id, data) => api.put(`/carreras/${id}`, data)
export const deleteCarrera = (id) => api.delete(`/carreras/${id}`)