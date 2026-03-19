import api from '../api'

export const getSalones = () => api.get('/salones')
export const getSalonById = (id) => api.get(`/salones/${id}`)
export const createSalon = (data) => api.post('/salones', data)
export const updateSalon = (id, data) => api.put(`/salones/${id}`, data)
export const deleteSalon = (id) => api.delete(`/salones/${id}`)