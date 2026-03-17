<template>
  <div class="page">
    <div class="header-row">
      <div>
        <h1 class="page-title">Laboratorios</h1>
        <p class="page-subtitle">Asignación y gestión de laboratorios por curso</p>
      </div>

      <button class="btn" @click="openCreate">Agregar Laboratorio</button>
    </div>

    <div v-if="error" class="alert error">{{ error }}</div>
    <div v-if="success" class="alert success">{{ success }}</div>

    <div class="card">
      <table class="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Curso</th>
            <th>Nombre laboratorio</th>
            <th># Periodos</th>
            <th>Mañana</th>
            <th>Tarde</th>
            <th>Activo</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="8" class="empty">Cargando laboratorios...</td>
          </tr>

          <tr v-else-if="laboratorios.length === 0">
            <td colspan="8" class="empty">No hay laboratorios registrados</td>
          </tr>

          <tr v-for="lab in laboratorios" :key="lab.id">
            <td>{{ lab.id }}</td>
            <td>{{ cursoLabel(lab.curso_id) }}</td>
            <td>{{ lab.nombre ?? '-' }}</td>
            <td>{{ lab.num_periodos }}</td>
            <td>{{ lab.puede_manana ? 'Sí' : 'No' }}</td>
            <td>{{ lab.puede_tarde ? 'Sí' : 'No' }}</td>
            <td>
              <span :class="lab.activo ? 'badge active' : 'badge inactive'">
                {{ lab.activo ? 'Sí' : 'No' }}
              </span>
            </td>
            <td class="actions">
              <button class="btn-small edit" @click="openEdit(lab)">Editar</button>
              <button class="btn-small delete" @click="removeLaboratorio(lab.id)">Eliminar</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showForm" class="modal-backdrop">
      <div class="modal">
        <h2>{{ isEditing ? 'Editar Laboratorio' : 'Nuevo Laboratorio' }}</h2>

        <form class="form-grid" @submit.prevent="submitForm">
          <div class="form-group form-group-full">
            <label>Curso</label>
            <select v-model.number="form.curso_id" required>
              <option :value="null" disabled>Seleccione un curso</option>
              <option v-for="curso in cursos" :key="curso.id" :value="curso.id">
                {{ curso.codigo }} - {{ curso.nombre }}
              </option>
            </select>
          </div>

          <div v-if="selectedCurso" class="curso-info form-group-full">
            <p><strong>ID:</strong> {{ selectedCurso.id }}</p>
            <p><strong>Código:</strong> {{ selectedCurso.codigo }}</p>
            <p><strong>Nombre:</strong> {{ selectedCurso.nombre }}</p>
            <p><strong>Semestre:</strong> {{ selectedCurso.semestre }}</p>
            <p><strong>Tipo:</strong> {{ selectedCurso.tipo }}</p>
          </div>

          <div class="form-group">
            <label>Nombre del laboratorio</label>
            <input v-model="form.nombre" />
          </div>

          <div class="form-group">
            <label>Número de periodos</label>
            <input type="number" min="1" v-model.number="form.num_periodos" required />
          </div>

          <div class="form-group checkbox-group">
            <label>
              <input type="checkbox" v-model="form.puede_manana" />
              Puede mañana
            </label>
          </div>

          <div class="form-group checkbox-group">
            <label>
              <input type="checkbox" v-model="form.puede_tarde" />
              Puede tarde
            </label>
          </div>

          <div class="form-group checkbox-group">
            <label>
              <input type="checkbox" v-model="form.activo" />
              Activo
            </label>
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
import {
  createLaboratorio,
  deleteLaboratorio,
  getLaboratorios,
  updateLaboratorio,
} from '../services/laboratorios/laboratorios.service'

const laboratorios = ref([])
const cursos = ref([])
const loading = ref(false)
const error = ref('')
const success = ref('')

const showForm = ref(false)
const isEditing = ref(false)
const currentId = ref(null)

const initialForm = () => ({
  curso_id: null,
  nombre: '',
  num_periodos: 3,
  puede_manana: true,
  puede_tarde: true,
  activo: true,
})

const form = reactive(initialForm())

const selectedCurso = computed(() => {
  if (!form.curso_id) return null
  return cursos.value.find((curso) => curso.id === form.curso_id) || null
})

const resetMessages = () => {
  error.value = ''
  success.value = ''
}

const cursoLabel = (cursoId) => {
  const curso = cursos.value.find((item) => item.id === cursoId)
  if (!curso) return `Curso #${cursoId}`
  return `${curso.codigo} - ${curso.nombre}`
}

const loadCursos = async () => {
  const { data } = await getCursos()
  cursos.value = data
}

const loadLaboratorios = async () => {
  loading.value = true
  resetMessages()

  try {
    const { data } = await getLaboratorios()
    laboratorios.value = data
  } catch (err) {
    error.value = err?.response?.data?.error || 'Error cargando laboratorios'
  } finally {
    loading.value = false
  }
}

const loadAll = async () => {
  loading.value = true
  resetMessages()

  try {
    await Promise.all([loadCursos(), loadLaboratorios()])
  } catch (err) {
    error.value = err?.response?.data?.error || 'Error cargando datos'
  } finally {
    loading.value = false
  }
}

const openCreate = () => {
  Object.assign(form, initialForm())
  currentId.value = null
  isEditing.value = false
  showForm.value = true
}

const openEdit = (lab) => {
  form.curso_id = lab.curso_id
  form.nombre = lab.nombre || ''
  form.num_periodos = lab.num_periodos
  form.puede_manana = lab.puede_manana
  form.puede_tarde = lab.puede_tarde
  form.activo = lab.activo

  currentId.value = lab.id
  isEditing.value = true
  showForm.value = true
}

const closeForm = () => {
  showForm.value = false
}

const buildPayload = () => ({
  curso_id: form.curso_id,
  nombre: form.nombre?.trim() || null,
  num_periodos: form.num_periodos,
  puede_manana: form.puede_manana,
  puede_tarde: form.puede_tarde,
  activo: form.activo,
})

const submitForm = async () => {
  resetMessages()

  try {
    const payload = buildPayload()

    if (isEditing.value) {
      await updateLaboratorio(currentId.value, payload)
      success.value = 'Laboratorio actualizado correctamente'
    } else {
      await createLaboratorio(payload)
      success.value = 'Laboratorio creado correctamente'
    }

    closeForm()
    await loadLaboratorios()
  } catch (err) {
    error.value = err?.response?.data?.error || 'Error guardando laboratorio'
  }
}

const removeLaboratorio = async (id) => {
  const ok = confirm('¿Eliminar este laboratorio?')
  if (!ok) return

  resetMessages()

  try {
    await deleteLaboratorio(id)
    success.value = 'Laboratorio eliminado correctamente'
    await loadLaboratorios()
  } catch (err) {
    error.value = err?.response?.data?.error || 'Error eliminando laboratorio'
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
  overflow:hidden;
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

.table{
  width:100%;
  border-collapse:collapse;
}

th, td{
  padding:12px;
  border-bottom:1px solid #e5e7eb;
}

th{
  background:#f3f4f6;
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

.badge{
  padding:4px 8px;
  border-radius:10px;
  font-size:12px;
}

.active{
  background:#dcfce7;
}

.inactive{
  background:#fee2e2;
}

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
  width:720px;
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

.checkbox-group{
  justify-content:flex-end;
}

.curso-info{
  border:1px solid #e5e7eb;
  border-radius:8px;
  padding:10px;
  background:#f9fafb;
}

.curso-info p{
  margin:4px 0;
}

.modal-actions{
  display:flex;
  justify-content:flex-end;
  gap:10px;
}

.btn-secondary{
  border:none;
  padding:10px 14px;
  border-radius:6px;
  cursor:pointer;
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
