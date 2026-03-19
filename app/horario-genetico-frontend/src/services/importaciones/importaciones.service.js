import api from '../api'

export const importarDocentesCsv = (file) => {
  const formData = new FormData()
  formData.append('archivo', file)

  return api.post('/importar/docentes', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}

export const importarCursosCsv = (file) => {
  const formData = new FormData()
  formData.append('archivo', file)

  return api.post('/importar/cursos', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}

export const importarDocenteCursoCsv = (file) => {
  const formData = new FormData()
  formData.append('archivo', file)

  return api.post('/importar/docente-curso', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}

export const importarSalonesCsv = (file) => {
  const formData = new FormData()
  formData.append('archivo', file)

  return api.post('/importar/salones', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}

export const importarLaboratoriosCsv = (file) => {
  const formData = new FormData()
  formData.append('archivo', file)

  return api.post('/importar/laboratorios', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}

export const importarSeccionesCsv = (file) => {
  const formData = new FormData()
  formData.append('archivo', file)

  return api.post('/importar/secciones', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}

export const importarSeccionLaboratorioCsv = (file) => {
  const formData = new FormData()
  formData.append('archivo', file)

  return api.post('/importar/seccion-laboratorio', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}