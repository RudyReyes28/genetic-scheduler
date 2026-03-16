import api from '../api'

export const getDocentes = () => api.get('/docentes')
export const getDocenteById = (id) => api.get(`/docentes/${id}`)
export const createDocente = (data) => api.post('/docentes', data)
export const updateDocente = (id, data) => api.put(`/docentes/${id}`, data)
export const deleteDocente = (id) => api.delete(`/docentes/${id}`)