<template>
  <div class="page">
    <div class="header-row">
      <div>
        <h1 class="page-title">Secciones-Laboratorio</h1>
        <p class="page-subtitle">Gestión de asignaciones de laboratorio por sección</p>
      </div>

      <button class="btn" @click="openCreate">Agregar Asignación</button>
    </div>

    <div v-if="error" class="alert error">{{ error }}</div>
    <div v-if="success" class="alert success">{{ success }}</div>

    <div class="card">
      <table class="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Curso</th>
            <th>Sección</th>
            <th>Laboratorio</th>
            <th>Docente fijo</th>
            <th>Salón fijo</th>
            <th>Acciones</th>
          </tr>
        </thead>

        <tbody>
          <tr v-if="loading">
            <td colspan="7" class="empty">Cargando asignaciones...</td>
          </tr>

          <tr v-else-if="asignaciones.length === 0">
            <td colspan="7" class="empty">No hay asignaciones registradas</td>
          </tr>

          <tr v-for="item in asignaciones" :key="item.id">
            <td>{{ item.id }}</td>
            <td>{{ cursoLabelFromAsignacion(item) }}</td>
            <td>{{ seccionLabel(item.seccion_id) }}</td>
            <td>{{ laboratorioLabel(item.laboratorio_id) }}</td>
            <td>{{ docenteLabel(item.docente_fijo_id) }}</td>
            <td>{{ salonLabel(item.salon_fijo_id) }}</td>
            <td class="actions">
              <button class="btn-small edit" @click="openEdit(item)">Editar</button>
              <button class="btn-small delete" @click="removeAsignacion(item.id)">Eliminar</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showForm" class="modal-backdrop">
      <div class="modal">
        <h2>{{ isEditing ? 'Editar Asignación' : 'Nueva Asignación' }}</h2>

        <form class="form-grid" @submit.prevent="submitForm">
          <div class="form-group form-group-full">
            <label>Buscar sección</label>
            <input v-model="searchSecciones" placeholder="Filtrar por letra o curso..." />
          </div>

          <div class="form-group form-group-full">
            <label>Sección</label>
            <select v-model="form.seccion_id" required>
              <option value="" disabled>Seleccione una sección</option>
              <option v-for="seccion in filteredSecciones" :key="seccion.id" :value="String(seccion.id)">
                {{ seccionOptionLabel(seccion) }}
              </option>
            </select>
          </div>

          <div v-if="selectedSeccion" class="entity-info form-group-full">
            <p><strong>Sección:</strong> {{ seccionOptionLabel(selectedSeccion) }}</p>
            <p><strong>Curso:</strong> {{ cursoLabel(selectedSeccion.curso_id) }}</p>
            <p><strong>Estudiantes:</strong> {{ selectedSeccion.num_estudiantes_seccion ?? '-' }}</p>
          </div>

          <div class="form-group form-group-full">
            <label>Buscar laboratorio</label>
            <input v-model="searchLaboratorios" placeholder="Filtrar por nombre o curso..." />
          </div>

          <div class="form-group form-group-full">
            <label>Laboratorio</label>
            <select v-model="form.laboratorio_id" required>
              <option value="" disabled>Seleccione un laboratorio</option>
              <option v-for="laboratorio in filteredLaboratorios" :key="laboratorio.id" :value="String(laboratorio.id)">
                {{ laboratorioOptionLabel(laboratorio) }}
              </option>
            </select>
          </div>

          <div v-if="selectedLaboratorio" class="entity-info form-group-full">
            <p><strong>Laboratorio:</strong> {{ laboratorioOptionLabel(selectedLaboratorio) }}</p>
            <p><strong>Curso:</strong> {{ cursoLabel(selectedLaboratorio.curso_id) }}</p>
            <p><strong># Períodos:</strong> {{ selectedLaboratorio.num_periodos }}</p>
          </div>

          <div class="form-group form-group-full">
            <label>Docente fijo (opcional)</label>
            <select v-model="form.docente_fijo_id">
              <option value="">Sin docente fijo</option>
              <option v-for="docente in docentes" :key="docente.id" :value="String(docente.id)">
                {{ docente.nombre }}
              </option>
            </select>
          </div>

          <div v-if="selectedDocente" class="entity-info form-group-full">
            <p><strong>Docente:</strong> {{ selectedDocente.nombre }}</p>
            <p><strong>Registro:</strong> {{ selectedDocente.registro_personal ?? '-' }}</p>
          </div>

          <div class="form-group form-group-full">
            <label>Salón fijo (opcional)</label>
            <select v-model="form.salon_fijo_id">
              <option value="">Sin salón fijo</option>
              <option v-for="salon in salones" :key="salon.id" :value="String(salon.id)">
                {{ salon.nombre }}
              </option>
            </select>
          </div>

          <div v-if="selectedSalon" class="entity-info form-group-full">
            <p><strong>Salón:</strong> {{ selectedSalon.nombre }}</p>
            <p><strong>Capacidad:</strong> {{ selectedSalon.capacidad ?? '-' }}</p>
          </div>

          <div class="modal-actions form-group-full">
            <button type="button" class="btn-secondary" @click="closeForm">Cancelar</button>
            <button type="submit" class="btn">{{ isEditing ? 'Actualizar' : 'Guardar' }}</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { getCursos } from '../services/cursos/cursos.service'
import { getSecciones } from '../services/secciones/secciones.service'
import { getLaboratorios } from '../services/laboratorios/laboratorios.service'
import { getDocentes } from '../services/docentes/docentes.service'
import { getSalones } from '../services/salones/salones.service'
import {
  createSeccionLaboratorio,
  deleteSeccionLaboratorio,
  getSeccionLaboratorios,
  updateSeccionLaboratorio,
} from '../services/seccion-laboratorio/seccionLaboratorio.service'

const asignaciones = ref([])
const cursos = ref([])
const secciones = ref([])
const laboratorios = ref([])
const docentes = ref([])
const salones = ref([])

const loading = ref(false)
const error = ref('')
const success = ref('')

const showForm = ref(false)
const isEditing = ref(false)
const currentId = ref(null)

const searchSecciones = ref('')
const searchLaboratorios = ref('')

const initialForm = () => ({
  seccion_id: '',
  laboratorio_id: '',
  salon_fijo_id: '',
  docente_fijo_id: '',
})

const form = reactive(initialForm())

const resetMessages = () => {
  error.value = ''
  success.value = ''
}

const selectedSeccion = computed(() => {
  if (!form.seccion_id) return null
  return secciones.value.find((item) => String(item.id) === form.seccion_id) || null
})

const selectedLaboratorio = computed(() => {
  if (!form.laboratorio_id) return null
  return laboratorios.value.find((item) => String(item.id) === form.laboratorio_id) || null
})

const selectedDocente = computed(() => {
  if (!form.docente_fijo_id) return null
  return docentes.value.find((item) => String(item.id) === form.docente_fijo_id) || null
})

const selectedSalon = computed(() => {
  if (!form.salon_fijo_id) return null
  return salones.value.find((item) => String(item.id) === form.salon_fijo_id) || null
})

const filteredSecciones = computed(() => {
  const term = searchSecciones.value.trim().toLowerCase()
  if (!term) return secciones.value

  return secciones.value.filter((item) => {
    const letra = String(item.letra || '').toLowerCase()
    const curso = String(cursoLabel(item.curso_id) || '').toLowerCase()
    return letra.includes(term) || curso.includes(term)
  })
})

const filteredLaboratorios = computed(() => {
  const term = searchLaboratorios.value.trim().toLowerCase()
  if (!term) return laboratorios.value

  return laboratorios.value.filter((item) => {
    const nombre = String(item.nombre || '').toLowerCase()
    const curso = String(cursoLabel(item.curso_id) || '').toLowerCase()
    return nombre.includes(term) || curso.includes(term)
  })
})

const cursoLabel = (cursoId) => {
  if (!cursoId) return '-'
  const curso = cursos.value.find((item) => item.id === cursoId)
  if (!curso) return `Curso #${cursoId}`
  return `${curso.codigo} - ${curso.nombre}`
}

const seccionOptionLabel = (seccion) => {
  return `${cursoLabel(seccion.curso_id)} | Sección ${seccion.letra}`
}

const laboratorioOptionLabel = (laboratorio) => {
  const nombre = laboratorio.nombre || `Laboratorio #${laboratorio.id}`
  return `${cursoLabel(laboratorio.curso_id)} | ${nombre}`
}

const seccionLabel = (seccionId) => {
  if (!seccionId) return '-'
  const seccion = secciones.value.find((item) => item.id === seccionId)
  if (!seccion) return `Sección #${seccionId}`
  return `Sección ${seccion.letra}`
}

const laboratorioLabel = (laboratorioId) => {
  if (!laboratorioId) return '-'
  const laboratorio = laboratorios.value.find((item) => item.id === laboratorioId)
  if (!laboratorio) return `Laboratorio #${laboratorioId}`
  return laboratorio.nombre || `Laboratorio #${laboratorio.id}`
}

const docenteLabel = (docenteId) => {
  if (!docenteId) return '-'
  const docente = docentes.value.find((item) => item.id === docenteId)
  return docente ? docente.nombre : `Docente #${docenteId}`
}

const salonLabel = (salonId) => {
  if (!salonId) return '-'
  const salon = salones.value.find((item) => item.id === salonId)
  return salon ? salon.nombre : `Salón #${salonId}`
}

const cursoLabelFromAsignacion = (item) => {
  const seccion = secciones.value.find((row) => row.id === item.seccion_id)
  if (seccion) return cursoLabel(seccion.curso_id)

  const laboratorio = laboratorios.value.find((row) => row.id === item.laboratorio_id)
  if (laboratorio) return cursoLabel(laboratorio.curso_id)

  return '-'
}

const loadDependencies = async () => {
  const [cursosRes, seccionesRes, laboratoriosRes, docentesRes, salonesRes] = await Promise.all([
    getCursos(),
    getSecciones(),
    getLaboratorios(),
    getDocentes(),
    getSalones(),
  ])

  cursos.value = cursosRes.data
  secciones.value = seccionesRes.data
  laboratorios.value = laboratoriosRes.data
  docentes.value = docentesRes.data
  salones.value = salonesRes.data
}

const loadAsignaciones = async () => {
  loading.value = true
  resetMessages()

  try {
    const { data } = await getSeccionLaboratorios()
    asignaciones.value = data
  } catch (err) {
    error.value = err?.response?.data?.error || 'Error cargando asignaciones'
  } finally {
    loading.value = false
  }
}

const loadAll = async () => {
  loading.value = true
  resetMessages()

  try {
    await loadDependencies()
    await loadAsignaciones()
  } catch (err) {
    error.value = err?.response?.data?.error || 'Error cargando datos'
    loading.value = false
  }
}

const openCreate = () => {
  Object.assign(form, initialForm())
  searchSecciones.value = ''
  searchLaboratorios.value = ''
  isEditing.value = false
  currentId.value = null
  showForm.value = true
}

const openEdit = (item) => {
  form.seccion_id = String(item.seccion_id)
  form.laboratorio_id = String(item.laboratorio_id)
  form.salon_fijo_id = item.salon_fijo_id ? String(item.salon_fijo_id) : ''
  form.docente_fijo_id = item.docente_fijo_id ? String(item.docente_fijo_id) : ''

  searchSecciones.value = ''
  searchLaboratorios.value = ''
  isEditing.value = true
  currentId.value = item.id
  showForm.value = true
}

const closeForm = () => {
  showForm.value = false
}

const validateCursoRelacion = () => {
  if (!selectedSeccion.value || !selectedLaboratorio.value) return false
  return selectedSeccion.value.curso_id === selectedLaboratorio.value.curso_id
}

const submitForm = async () => {
  resetMessages()

  if (!validateCursoRelacion()) {
    error.value = 'La sección y el laboratorio deben pertenecer al mismo curso.'
    return
  }

  const payload = {
    seccion_id: Number(form.seccion_id),
    laboratorio_id: Number(form.laboratorio_id),
    salon_fijo_id: form.salon_fijo_id ? Number(form.salon_fijo_id) : null,
    docente_fijo_id: form.docente_fijo_id ? Number(form.docente_fijo_id) : null,
  }

  try {
    if (isEditing.value) {
      await updateSeccionLaboratorio(currentId.value, payload)
      success.value = 'Asignación actualizada correctamente'
    } else {
      await createSeccionLaboratorio(payload)
      success.value = 'Asignación creada correctamente'
    }

    closeForm()
    await loadAsignaciones()
  } catch (err) {
    error.value = err?.response?.data?.error || 'Error guardando asignación'
  }
}

const removeAsignacion = async (id) => {
  const ok = confirm('¿Eliminar esta asignación?')
  if (!ok) return

  resetMessages()

  try {
    await deleteSeccionLaboratorio(id)
    success.value = 'Asignación eliminada correctamente'
    await loadAsignaciones()
  } catch (err) {
    error.value = err?.response?.data?.error || 'Error eliminando asignación'
  }
}

onMounted(loadAll)
</script>

<style scoped>
.header-row{
  display:flex;
  justify-content:space-between;
  align-items:center;
  margin-bottom:20px;
}

.card{
  background:white;
  border-radius:10px;
  overflow:auto;
  box-shadow:0 3px 10px rgba(0,0,0,0.08);
}

.btn{
  background:#2563eb;
  color:white;
  border:none;
  padding:10px 14px;
  border-radius:6px;
  cursor:pointer;
}

.btn:hover{
  background:#1d4ed8;
}

.btn-secondary{
  border:none;
  padding:10px 14px;
  border-radius:6px;
  cursor:pointer;
}

.table{
  width:100%;
  border-collapse:collapse;
  min-width:1050px;
}

th, td{
  padding:12px;
  border-bottom:1px solid #e5e7eb;
}

th{
  background:#f3f4f6;
}

.empty{
  text-align:center;
}

.actions{
  display:flex;
  gap:8px;
}

.btn-small{
  padding:6px 10px;
  border:none;
  border-radius:5px;
  color:white;
  cursor:pointer;
}

.edit{background:#f59e0b;}
.delete{background:#dc2626;}

.modal-backdrop{
  position:fixed;
  inset:0;
  background:rgba(0,0,0,0.5);
  display:flex;
  align-items:center;
  justify-content:center;
}

.modal{
  background:white;
  padding:25px;
  border-radius:10px;
  width:900px;
  max-height:90vh;
  overflow:auto;
}

.form-grid{
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:15px;
}

.form-group{
  display:flex;
  flex-direction:column;
  gap:6px;
}

.form-group-full{
  grid-column:1 / -1;
}

.form-group input,
.form-group select{
  padding:8px 10px;
  border:1px solid #d1d5db;
  border-radius:6px;
}

.entity-info{
  border:1px solid #e5e7eb;
  border-radius:8px;
  padding:10px;
  background:#f9fafb;
}

.entity-info p{
  margin:4px 0;
}

.modal-actions{
  grid-column:1/-1;
  display:flex;
  justify-content:flex-end;
  gap:10px;
}

.alert{
  padding:10px;
  margin-bottom:15px;
  border-radius:6px;
}

.error{
  background:#fee2e2;
}

.success{
  background:#dcfce7;
}
</style>
