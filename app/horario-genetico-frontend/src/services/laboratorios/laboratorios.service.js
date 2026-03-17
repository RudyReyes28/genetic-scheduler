import api from '../api'

export const getLaboratorios = () => {
  return api.get('/laboratorios')
}

export const getLaboratorioById = (id) => {
  return api.get(`/laboratorios/${id}`)
}

export const getLaboratoriosByCurso = (cursoId) => {
  return api.get(`/laboratorios/curso/${cursoId}`)
}

export const createLaboratorio = (data) => {
  return api.post('/laboratorios', data)
}

export const updateLaboratorio = (id, data) => {
  return api.put(`/laboratorios/${id}`, data)
}

export const deleteLaboratorio = (id) => {
  return api.delete(`/laboratorios/${id}`)
}
