import api from '../api'

export const getDocenteCursos = () => {
  return api.get('/docente-curso')
}

export const createDocenteCurso = (data) => {
  return api.post('/docente-curso', data)
}

export const deleteDocenteCurso = (id) => {
  return api.delete(`/docente-curso/${id}`)
}
