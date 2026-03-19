import api from '../api'

export const getPeriodos = () => {
  return api.get('/periodos')
}
