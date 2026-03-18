<template>
  <div class="page">
    <div class="header-row">
      <div>
        <h1 class="page-title">Importaciones CSV</h1>
        <p class="page-subtitle">
          Carga masiva de información desde archivos CSV
        </p>
      </div>
    </div>

    <div v-if="error" class="alert error">
      {{ error }}
    </div>

    <div v-if="success" class="alert success">
      {{ success }}
    </div>

    <div class="tabs">
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'individual' }"
        @click="activeTab = 'individual'"
      >
        Importación individual
      </button>
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'masiva' }"
        @click="activeTab = 'masiva'"
      >
        Carga masiva (todos juntos)
      </button>
    </div>

    <template v-if="activeTab === 'individual'">
      <div class="import-card">
        <div class="form-group">
          <label for="tipoImportacion">Tipo de importación</label>
          <select
            id="tipoImportacion"
            v-model="tipoSeleccionado"
            :disabled="selectorBloqueado || loading"
            class="select"
          >
            <option value="">Seleccione una opción</option>
            <option v-for="item in tiposImportacion" :key="item.value" :value="item.value">
              {{ item.label }}
            </option>
          </select>
        </div>

        <div v-if="tipoSeleccionado" class="example-box">
          <div class="example-header">
            <div>
              <h3>Formato esperado</h3>
              <p>{{ selectedConfig.descripcion }}</p>
            </div>

            <button class="btn-secondary" @click="descargarEjemplo">
              Descargar ejemplo CSV
            </button>
          </div>

          <pre class="csv-preview">{{ selectedConfig.ejemplo }}</pre>
        </div>

        <div v-if="tipoSeleccionado" class="upload-box">
          <div class="form-group">
            <label for="archivoCsv">Archivo CSV</label>
            <input
              id="archivoCsv"
              ref="fileInput"
              type="file"
              accept=".csv,text/csv"
              @change="handleFileChange"
              :disabled="loading"
              class="file-input"
            />
          </div>

          <div v-if="archivoSeleccionado" class="file-info">
            <span><strong>Archivo:</strong> {{ archivoSeleccionado.name }}</span>
            <button class="btn-danger-outline" @click="quitarArchivo" :disabled="loading">
              Quitar archivo
            </button>
          </div>

          <div class="actions">
            <button
              class="btn"
              @click="importarArchivo"
              :disabled="!tipoSeleccionado || !archivoSeleccionado || loading"
            >
              {{ loading ? 'Importando...' : 'Importar' }}
            </button>
          </div>
        </div>
      </div>

      <div v-if="resultado" class="results-card">
        <h2>Resultado de la importación</h2>

        <div class="summary-grid">
          <div class="summary-item">
            <span class="summary-label">Total de filas</span>
            <span class="summary-value">{{ resultado.total_filas ?? 0 }}</span>
          </div>

          <div class="summary-item green">
            <span class="summary-label">Insertados</span>
            <span class="summary-value">{{ resultado.insertados ?? 0 }}</span>
          </div>

          <div class="summary-item blue">
            <span class="summary-label">Actualizados</span>
            <span class="summary-value">{{ resultado.actualizados ?? 0 }}</span>
          </div>

          <div class="summary-item red">
            <span class="summary-label">Omitidos</span>
            <span class="summary-value">{{ resultado.omitidos ?? 0 }}</span>
          </div>
        </div>

        <div v-if="resultado.detalles?.length" class="details-section">
          <h3>Detalle por fila</h3>

          <div class="table-wrapper">
            <table class="table">
              <thead>
                <tr>
                  <th>Fila</th>
                  <th>Estado</th>
                  <th>Motivo</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(detalle, index) in resultado.detalles" :key="index">
                  <td>{{ detalle.fila }}</td>
                  <td>
                    <span
                      :class="[
                        'badge',
                        detalle.estado === 'insertado'
                          ? 'badge-insertado'
                          : detalle.estado === 'actualizado'
                          ? 'badge-actualizado'
                          : 'badge-omitido'
                      ]"
                    >
                      {{ detalle.estado }}
                    </span>
                  </td>
                  <td>{{ detalle.motivo }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div v-if="resultado || archivoSeleccionado" class="reset-box">
        <button class="btn-secondary" @click="reiniciarImportacion">
          Nueva importación
        </button>
      </div>
    </template>

    <template v-else>
      <div class="import-card">
        <h2 class="section-title">Carga masiva de archivos</h2>
        <p class="section-subtitle">
          Selecciona uno o más archivos CSV y se importarán en secuencia.
        </p>

        <div class="bulk-grid">
          <div v-for="item in tiposImportacion" :key="item.value" class="bulk-item">
            <div class="bulk-item-head">
              <div>
                <h3>{{ item.label }}</h3>
                <p>{{ ejemplos[item.value].descripcion }}</p>
              </div>

              <button class="btn-secondary" @click="descargarEjemploPorTipo(item.value)">
                Descargar ejemplo
              </button>
            </div>

            <div class="form-group no-margin">
              <label :for="`archivoMasivo-${item.value}`">Archivo CSV de {{ item.label }}</label>
              <input
                :id="`archivoMasivo-${item.value}`"
                type="file"
                accept=".csv,text/csv"
                class="file-input"
                :disabled="loadingMasivo"
                :ref="(el) => setMassFileInputRef(item.value, el)"
                @change="handleMassFileChange(item.value, $event)"
              />
            </div>

            <div v-if="archivosMasivos[item.value]" class="file-info compact">
              <span><strong>Archivo:</strong> {{ archivosMasivos[item.value].name }}</span>
              <button
                class="btn-danger-outline"
                :disabled="loadingMasivo"
                @click="quitarArchivoMasivo(item.value)"
              >
                Quitar
              </button>
            </div>
          </div>
        </div>

        <div class="actions dual-actions">
          <button class="btn-secondary" @click="reiniciarCargaMasiva" :disabled="loadingMasivo">
            Limpiar selección
          </button>
          <button class="btn" @click="importarTodo" :disabled="loadingMasivo || totalArchivosMasivos === 0">
            {{ loadingMasivo ? 'Importando...' : 'Importar archivos seleccionados' }}
          </button>
        </div>
      </div>

      <div v-if="resultadoMasivo.length" class="results-card">
        <h2>Resultado de carga masiva</h2>

        <div class="summary-grid">
          <div class="summary-item">
            <span class="summary-label">Archivos procesados</span>
            <span class="summary-value">{{ resumenMasivo.procesados }}</span>
          </div>

          <div class="summary-item green">
            <span class="summary-label">Insertados</span>
            <span class="summary-value">{{ resumenMasivo.insertados }}</span>
          </div>

          <div class="summary-item blue">
            <span class="summary-label">Actualizados</span>
            <span class="summary-value">{{ resumenMasivo.actualizados }}</span>
          </div>

          <div class="summary-item red">
            <span class="summary-label">Omitidos</span>
            <span class="summary-value">{{ resumenMasivo.omitidos }}</span>
          </div>
        </div>

        <div class="table-wrapper">
          <table class="table">
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Archivo</th>
                <th>Estado</th>
                <th>Insertados</th>
                <th>Actualizados</th>
                <th>Omitidos</th>
                <th>Mensaje</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in resultadoMasivo" :key="index">
                <td>{{ item.tipoLabel }}</td>
                <td>{{ item.archivo }}</td>
                <td>
                  <span :class="['badge', item.estado === 'error' ? 'badge-omitido' : 'badge-insertado']">
                    {{ item.estado === 'error' ? 'error' : 'ok' }}
                  </span>
                </td>
                <td>{{ item.insertados }}</td>
                <td>{{ item.actualizados }}</td>
                <td>{{ item.omitidos }}</td>
                <td>{{ item.mensaje }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import {
  importarDocentesCsv,
  importarCursosCsv,
  importarDocenteCursoCsv,
  importarSalonesCsv,
  importarLaboratoriosCsv,
  importarSeccionesCsv,
  importarSeccionLaboratorioCsv,
} from '../services/importaciones/importaciones.service'

const tipoSeleccionado = ref('')
const archivoSeleccionado = ref(null)
const resultado = ref(null)
const activeTab = ref('individual')

const loading = ref(false)
const loadingMasivo = ref(false)
const error = ref('')
const success = ref('')
const selectorBloqueado = ref(false)

const fileInput = ref(null)
const massFileInputs = ref({})
const resultadoMasivo = ref([])

const tiposImportacion = [
  { value: 'docentes', label: 'Docentes' },
  { value: 'cursos', label: 'Cursos' },
  { value: 'docente-curso', label: 'Relación Docente-Curso' },
  { value: 'salones', label: 'Salones' },
  { value: 'laboratorios', label: 'Laboratorios' },
  { value: 'secciones', label: 'Secciones' },
  { value: 'seccion-laboratorio', label: 'Sección Laboratorio' },
]

const archivosMasivos = reactive({
  docentes: null,
  cursos: null,
  'docente-curso': null,
  salones: null,
  laboratorios: null,
  secciones: null,
  'seccion-laboratorio': null,
})

const ejemplos = {
  docentes: {
    descripcion:
      'El archivo debe incluir nombre, registro_personal, hora_entrada y hora_salida.',
    nombreArchivo: 'ejemplo_docentes.csv',
    ejemplo: `nombre,registro_personal,hora_entrada,hora_salida
Juan Perez,DOC001,07:00,14:00
Jose Lopez,DOC002,13:00:00,21:00:00`,
  },
  cursos: {
    descripcion:
      'El archivo debe incluir nombre, codigo, codigo_carrera, semestre, tipo y num_estudiantes.',
    nombreArchivo: 'ejemplo_cursos.csv',
    ejemplo: `nombre,codigo,codigo_carrera,semestre,tipo,num_estudiantes
Introduccion a la Programacion,IPC1,120058,1,obligatorio,120
Matematica 1,MATE1,120058,1,obligatorio,130`,
  },
  'docente-curso': {
    descripcion:
      'El archivo debe incluir registro_personal, codigo_curso y opcionalmente puede_laboratorio.',
    nombreArchivo: 'ejemplo_docente_curso.csv',
    ejemplo: `registro_personal,codigo_curso,puede_laboratorio
DOC001,IPC1,si
DOC002,MATE1,no`,
  },
  salones: {
    descripcion:
      'El archivo debe incluir nombre y opcionalmente capacidad, es_laboratorio, lab_habilitado_teorico, disponible_manana, disponible_tarde y activo.',
    nombreArchivo: 'ejemplo_salones.csv',
    ejemplo: `nombre,capacidad,es_laboratorio,lab_habilitado_teorico,disponible_manana,disponible_tarde,activo
Salon A-01,45,no,no,no,no,no
Laboratorio 2,30,si,si,no,si,si`,
  },
  laboratorios: {
    descripcion:
      'El archivo debe incluir codigo_curso, nombre, num_periodos, puede_manana, puede_tarde y activo.',
    nombreArchivo: 'ejemplo_laboratorios.csv',
    ejemplo: `codigo_curso,nombre,num_periodos,puede_manana,puede_tarde,activo
3003,Laboratorio de Tecnicas de Estudio,3,no,si,si
3000,Laboratorio de Area Matematica,2,no,si,si`,
  },
  secciones: {
    descripcion:
      'El archivo debe incluir codigo_curso, letra, num_estudiantes_seccion y sin_salon.',
    nombreArchivo: 'ejemplo_secciones.csv',
    ejemplo: `codigo_curso,letra,num_estudiantes_seccion,sin_salon
3003,A,22,no
3000,A,16,no
3082,A,15,si`,
  },
  'seccion-laboratorio': {
    descripcion:
      'El archivo debe incluir codigo_curso y letra. Opcionalmente puede incluir salon_nombre y registro_personal.',
    nombreArchivo: 'ejemplo_seccion_laboratorio.csv',
    ejemplo: `codigo_curso,letra,salon_nombre,registro_personal
3003,A,Laboratorio 1,DOC001
3000,A,Laboratorio 2,DOC002
3005,B,,DOC003`,
  },
}

const selectedConfig = computed(() => {
  return tipoSeleccionado.value ? ejemplos[tipoSeleccionado.value] : null
})

const totalArchivosMasivos = computed(() => {
  return tiposImportacion.reduce((count, item) => {
    return count + (archivosMasivos[item.value] ? 1 : 0)
  }, 0)
})

const resumenMasivo = computed(() => {
  return resultadoMasivo.value.reduce(
    (acc, item) => {
      acc.procesados += 1
      acc.insertados += item.insertados || 0
      acc.actualizados += item.actualizados || 0
      acc.omitidos += item.omitidos || 0
      return acc
    },
    {
      procesados: 0,
      insertados: 0,
      actualizados: 0,
      omitidos: 0,
    }
  )
})

const getImporterByTipo = (tipo) => {
  switch (tipo) {
    case 'docentes':
      return importarDocentesCsv
    case 'cursos':
      return importarCursosCsv
    case 'docente-curso':
      return importarDocenteCursoCsv
    case 'salones':
      return importarSalonesCsv
    case 'laboratorios':
      return importarLaboratoriosCsv
    case 'secciones':
      return importarSeccionesCsv
    case 'seccion-laboratorio':
      return importarSeccionLaboratorioCsv
    default:
      return null
  }
}

const isCsvFile = (file) => {
  if (!file) return false
  const nombre = file.name?.toLowerCase() || ''
  return nombre.endsWith('.csv') || file.type === 'text/csv'
}

const setMassFileInputRef = (tipo, el) => {
  if (el) {
    massFileInputs.value[tipo] = el
  }
}

const resetMessages = () => {
  error.value = ''
  success.value = ''
}

const handleFileChange = (event) => {
  resetMessages()
  resultado.value = null

  const file = event.target.files?.[0]

  if (!file) {
    archivoSeleccionado.value = null
    selectorBloqueado.value = false
    return
  }

  if (!isCsvFile(file)) {
    archivoSeleccionado.value = null
    selectorBloqueado.value = false
    error.value = 'El archivo seleccionado no es válido. Debe ser un archivo CSV.'
    if (fileInput.value) fileInput.value.value = ''
    return
  }

  archivoSeleccionado.value = file
  selectorBloqueado.value = true
}

const quitarArchivo = () => {
  archivoSeleccionado.value = null
  selectorBloqueado.value = false
  resultado.value = null
  resetMessages()

  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const reiniciarImportacion = () => {
  tipoSeleccionado.value = ''
  archivoSeleccionado.value = null
  resultado.value = null
  loading.value = false
  selectorBloqueado.value = false
  resetMessages()

  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const handleMassFileChange = (tipo, event) => {
  resetMessages()
  resultadoMasivo.value = []

  const file = event.target.files?.[0]

  if (!file) {
    archivosMasivos[tipo] = null
    return
  }

  if (!isCsvFile(file)) {
    archivosMasivos[tipo] = null
    error.value = `El archivo para ${tipo} no es válido. Debe ser CSV.`
    if (massFileInputs.value[tipo]) {
      massFileInputs.value[tipo].value = ''
    }
    return
  }

  archivosMasivos[tipo] = file
}

const quitarArchivoMasivo = (tipo) => {
  archivosMasivos[tipo] = null
  resultadoMasivo.value = []
  resetMessages()

  if (massFileInputs.value[tipo]) {
    massFileInputs.value[tipo].value = ''
  }
}

const reiniciarCargaMasiva = () => {
  resetMessages()
  resultadoMasivo.value = []

  tiposImportacion.forEach((item) => {
    archivosMasivos[item.value] = null
    if (massFileInputs.value[item.value]) {
      massFileInputs.value[item.value].value = ''
    }
  })
}

const descargarCsvDesdeConfig = (config) => {
  if (!config) return

  const blob = new Blob([config.ejemplo], {
    type: 'text/csv;charset=utf-8;',
  })

  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', config.nombreArchivo)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

const descargarEjemplo = () => {
  descargarCsvDesdeConfig(selectedConfig.value)
}

const descargarEjemploPorTipo = (tipo) => {
  descargarCsvDesdeConfig(ejemplos[tipo])
}

const importarArchivo = async () => {
  resetMessages()
  resultado.value = null

  if (!tipoSeleccionado.value) {
    error.value = 'Debes seleccionar un tipo de importación.'
    return
  }

  if (!archivoSeleccionado.value) {
    error.value = 'Debes seleccionar un archivo CSV.'
    return
  }

  loading.value = true

  try {
    const importer = getImporterByTipo(tipoSeleccionado.value)
    if (!importer) throw new Error('Tipo de importación no válido')

    const response = await importer(archivoSeleccionado.value)

    resultado.value = response.data
    success.value = response.data?.mensaje || 'Importación realizada correctamente'
  } catch (err) {
    error.value =
      err?.response?.data?.error ||
      'Ocurrió un error al importar el archivo. Verifica el formato e inténtalo de nuevo.'
  } finally {
    loading.value = false
  }
}

const importarTodo = async () => {
  resetMessages()
  resultadoMasivo.value = []

  if (totalArchivosMasivos.value === 0) {
    error.value = 'Selecciona al menos un archivo CSV para la carga masiva.'
    return
  }

  loadingMasivo.value = true

  try {
    for (const item of tiposImportacion) {
      const file = archivosMasivos[item.value]
      if (!file) continue

      const importer = getImporterByTipo(item.value)
      if (!importer) continue

      try {
        const response = await importer(file)
        const data = response?.data || {}

        resultadoMasivo.value.push({
          tipoLabel: item.label,
          archivo: file.name,
          estado: 'ok',
          insertados: data.insertados ?? 0,
          actualizados: data.actualizados ?? 0,
          omitidos: data.omitidos ?? 0,
          mensaje: data.mensaje || 'Importación completada',
        })
      } catch (err) {
        resultadoMasivo.value.push({
          tipoLabel: item.label,
          archivo: file.name,
          estado: 'error',
          insertados: 0,
          actualizados: 0,
          omitidos: 0,
          mensaje:
            err?.response?.data?.error ||
            'Error al importar. Verifica el formato del archivo.',
        })
      }
    }

    const conError = resultadoMasivo.value.some((item) => item.estado === 'error')
    success.value = conError
      ? 'Carga masiva finalizada con algunos errores.'
      : 'Carga masiva completada correctamente.'
  } finally {
    loadingMasivo.value = false
  }
}
</script>

<style scoped>
.import-card,
.results-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.08);
  margin-bottom: 24px;
}

.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 18px;
}

.tab-btn {
  border: 1px solid #d1d5db;
  background: white;
  color: #374151;
  padding: 10px 14px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}

.tab-btn.active {
  background: #2563eb;
  color: white;
  border-color: #2563eb;
}

.section-title {
  margin: 0 0 8px 0;
}

.section-subtitle {
  margin: 0 0 18px 0;
  color: #4b5563;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 18px;
}

.no-margin {
  margin-bottom: 0;
}

.form-group label {
  font-weight: 600;
  color: #374151;
}

.select,
.file-input {
  padding: 11px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  outline: none;
  background: white;
}

.example-box {
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 18px;
  background: #f9fafb;
  margin-bottom: 18px;
}

.example-header {
  display: flex;
  justify-content: space-between;
  align-items: start;
  gap: 16px;
  margin-bottom: 12px;
}

.example-header h3 {
  margin: 0 0 8px 0;
}

.example-header p {
  margin: 0;
  color: #4b5563;
}

.csv-preview {
  background: #111827;
  color: #f9fafb;
  padding: 14px;
  border-radius: 10px;
  overflow-x: auto;
  font-size: 13px;
  line-height: 1.5;
}

.upload-box {
  margin-top: 10px;
}

.bulk-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;
}

.bulk-item {
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 14px;
  background: #f9fafb;
}

.bulk-item-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 10px;
}

.bulk-item-head h3 {
  margin: 0 0 6px 0;
  font-size: 16px;
}

.bulk-item-head p {
  margin: 0;
  color: #4b5563;
  font-size: 14px;
}

.file-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  color: #1e40af;
  padding: 12px 14px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.file-info.compact {
  margin-top: 10px;
  margin-bottom: 0;
}

.actions,
.reset-box {
  display: flex;
  justify-content: flex-end;
}

.dual-actions {
  gap: 10px;
  margin-top: 18px;
}

.btn {
  background: #2563eb;
  color: white;
  border: none;
  padding: 10px 14px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
}

.btn:hover {
  background: #1d4ed8;
}

.btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-secondary {
  background: #e5e7eb;
  color: #111827;
  border: none;
  padding: 10px 14px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
}

.btn-danger-outline {
  background: white;
  color: #b91c1c;
  border: 1px solid #ef4444;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
}

.alert {
  padding: 12px 14px;
  border-radius: 8px;
  margin-bottom: 16px;
  font-weight: 500;
}

.alert.error {
  background: #fee2e2;
  color: #991b1b;
}

.alert.success {
  background: #dcfce7;
  color: #166534;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-top: 18px;
  margin-bottom: 24px;
}

.summary-item {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.summary-item.green {
  background: #f0fdf4;
  border-color: #bbf7d0;
}

.summary-item.blue {
  background: #eff6ff;
  border-color: #bfdbfe;
}

.summary-item.red {
  background: #fef2f2;
  border-color: #fecaca;
}

.summary-label {
  color: #6b7280;
  font-size: 14px;
  font-weight: 600;
}

.summary-value {
  font-size: 28px;
  font-weight: 700;
  color: #111827;
}

.details-section h3 {
  margin-bottom: 12px;
}

.table-wrapper {
  overflow-x: auto;
}

.table {
  width: 100%;
  border-collapse: collapse;
  background: white;
}

th,
td {
  padding: 12px;
  border-bottom: 1px solid #e5e7eb;
  text-align: left;
}

th {
  background: #f3f4f6;
  color: #374151;
}

.badge {
  padding: 5px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  text-transform: capitalize;
}

.badge-insertado {
  background: #dcfce7;
  color: #166534;
}

.badge-actualizado {
  background: #dbeafe;
  color: #1d4ed8;
}

.badge-omitido {
  background: #fee2e2;
  color: #991b1b;
}

@media (max-width: 900px) {
  .summary-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .tabs,
  .dual-actions,
  .bulk-item-head,
  .example-header,
  .file-info {
    flex-direction: column;
    align-items: stretch;
  }
}

@media (max-width: 600px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }
}
</style>