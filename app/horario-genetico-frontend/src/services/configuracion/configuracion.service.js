import api from '../api'

export const getConfiguracionAgente = () => {
  return api.get('/configuracion')
}

export const updateConfiguracionAgente = (data) => {
  return api.put('/configuracion', data)
}
