import api from '../api'

export const getCursos = () => {
  return api.get('/cursos')
}

export const getCursoById = (id) => {
  return api.get(`/cursos/${id}`)
}

export const createCurso = (data) => {
  return api.post('/cursos', data)
}

export const updateCurso = (id, data) => {
  return api.put(`/cursos/${id}`, data)
}

export const deleteCurso = (id) => {
  return api.delete(`/cursos/${id}`)
}