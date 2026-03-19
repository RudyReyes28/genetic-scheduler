import api from '../api'

export const getDiasHorario = () => {
  return api.get('/dias-horario')
}
