import api from '../api'

export const getSecciones = () => {
  return api.get('/secciones')
}

export const getSeccionById = (id) => {
  return api.get(`/secciones/${id}`)
}

export const getSeccionesByCurso = (cursoId) => {
  return api.get(`/secciones/curso/${cursoId}`)
}

export const createSeccion = (data) => {
  return api.post('/secciones', data)
}

export const updateSeccion = (id, data) => {
  return api.put(`/secciones/${id}`, data)
}

export const deleteSeccion = (id) => {
  return api.delete(`/secciones/${id}`)
}
