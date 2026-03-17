<template>
  <div class="page">
    <div class="header-row">
      <div>
        <h1 class="page-title">Cursos</h1>
        <p class="page-subtitle">Gestión de cursos disponibles</p>
      </div>

      <button class="btn" @click="openCreate">Agregar Curso</button>
    </div>

    <div v-if="error" class="alert error">{{ error }}</div>
    <div v-if="success" class="alert success">{{ success }}</div>

    <div class="card">
      <table class="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Código</th>
            <th>Nombre</th>
            <th>Semestre</th>
            <th>Tipo</th>
            <th>Estudiantes</th>
            <th>Activo</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="8" class="empty">Cargando cursos...</td>
          </tr>

          <tr v-else-if="cursos.length === 0">
            <td colspan="8" class="empty">No hay cursos registrados</td>
          </tr>

          <tr v-for="curso in cursos" :key="curso.id">
            <td>{{ curso.id }}</td>
            <td>{{ curso.codigo }}</td>
            <td>{{ curso.nombre }}</td>
            <td>{{ curso.semestre }}</td>
            <td>{{ curso.tipo }}</td>
            <td>{{ curso.num_estudiantes ?? '-' }}</td>
            <td>
              <span :class="curso.activo ? 'badge active' : 'badge inactive'">
                {{ curso.activo ? 'Sí' : 'No' }}
              </span>
            </td>
            <td class="actions">
              <div class="dropdown-actions">
                <button class="btn-small menu" @click="toggleCursoActions(curso.id)">
                  Acciones ▾
                </button>

                <div v-if="actionMenuCursoId === curso.id" class="actions-menu">
                  <button class="action-item" @click="handleEditFromMenu(curso)">Editar</button>
                  <button class="action-item" @click="handleAssignLaboratorioFromMenu(curso)">Asignar laboratorio</button>
                  <button class="action-item" @click="handleViewLaboratoriosFromMenu(curso)">Ver laboratorios</button>
                  <button class="action-item delete-item" @click="handleDeleteFromMenu(curso.id)">Eliminar</button>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showForm" class="modal-backdrop">
      <div class="modal">
        <h2>{{ isEditing ? 'Editar Curso' : 'Nuevo Curso' }}</h2>

        <form @submit.prevent="submitForm" class="form-grid">
          <div class="form-group">
            <label>Nombre</label>
            <input v-model="form.nombre" required />
          </div>

          <div class="form-group">
            <label>Código</label>
            <input v-model="form.codigo" required />
          </div>

          <div class="form-group">
            <label>Semestre</label>
            <input type="number" v-model.number="form.semestre" required />
          </div>

          <div class="form-group">
            <label>Tipo</label>
            <select v-model="form.tipo">
              <option value="obligatorio">Obligatorio</option>
              <option value="optativo">Optativo</option>
            </select>
          </div>

          <div class="form-group">
            <label>Número estudiantes</label>
            <input type="number" v-model.number="form.num_estudiantes" />
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
              <input type="checkbox" v-model="form.tiene_laboratorio" />
              Tiene laboratorio
            </label>
          </div>

          <div class="form-group checkbox-group">
            <label>
              <input type="checkbox" v-model="form.activo" />
              Activo
            </label>
          </div>

          <div class="modal-actions">
            <button type="button" class="btn-secondary" @click="closeForm">Cancelar</button>
            <button type="submit" class="btn">{{ isEditing ? 'Actualizar' : 'Guardar' }}</button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="showLaboratorioForm" class="modal-backdrop">
      <div class="modal">
        <h2>{{ isEditingLaboratorio ? 'Editar Laboratorio' : 'Asignar Laboratorio' }}</h2>

        <div class="curso-info">
          <p><strong>Curso:</strong> {{ selectedCurso?.codigo }} - {{ selectedCurso?.nombre }}</p>
          <p><strong>Semestre:</strong> {{ selectedCurso?.semestre }}</p>
          <p><strong>Tipo:</strong> {{ selectedCurso?.tipo }}</p>
        </div>

        <form class="form-grid" @submit.prevent="submitLaboratorio">
          <div class="form-group">
            <label>Nombre del laboratorio</label>
            <input v-model="laboratorioForm.nombre" required />
          </div>

          <div class="form-group">
            <label>Número de periodos</label>
            <input type="number" min="1" v-model.number="laboratorioForm.num_periodos" required />
          </div>

          <div class="form-group checkbox-group">
            <label>
              <input type="checkbox" v-model="laboratorioForm.puede_manana" />
              Puede mañana
            </label>
          </div>

          <div class="form-group checkbox-group">
            <label>
              <input type="checkbox" v-model="laboratorioForm.puede_tarde" />
              Puede tarde
            </label>
          </div>

          <div class="form-group checkbox-group">
            <label>
              <input type="checkbox" v-model="laboratorioForm.activo" />
              Activo
            </label>
          </div>

          <div class="modal-actions">
            <button type="button" class="btn-secondary" @click="closeLaboratorioForm">Cancelar</button>
            <button type="submit" class="btn">{{ isEditingLaboratorio ? 'Actualizar' : 'Asignar' }}</button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="showLaboratoriosList" class="modal-backdrop">
      <div class="modal">
        <h2>Laboratorios del Curso</h2>

        <div class="curso-info">
          <p><strong>Curso:</strong> {{ selectedCurso?.codigo }} - {{ selectedCurso?.nombre }}</p>
        </div>

        <table class="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th># Periodos</th>
              <th>Mañana</th>
              <th>Tarde</th>
              <th>Activo</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loadingLaboratoriosCurso">
              <td colspan="6" class="empty">Cargando laboratorios...</td>
            </tr>
            <tr v-else-if="laboratoriosCurso.length === 0">
              <td colspan="6" class="empty">Este curso no tiene laboratorios asignados</td>
            </tr>
            <tr v-for="lab in laboratoriosCurso" :key="lab.id">
              <td>{{ lab.id }}</td>
              <td>{{ lab.nombre }}</td>
              <td>{{ lab.num_periodos }}</td>
              <td>{{ lab.puede_manana ? 'Sí' : 'No' }}</td>
              <td>{{ lab.puede_tarde ? 'Sí' : 'No' }}</td>
              <td>{{ lab.activo ? 'Sí' : 'No' }}</td>
            </tr>
          </tbody>
        </table>

        <div class="modal-actions only-close">
          <button type="button" class="btn-secondary" @click="closeLaboratoriosList">Cerrar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { createCurso, deleteCurso, getCursos, updateCurso } from '../services/cursos/cursos.service'
import {
  createLaboratorio,
  getLaboratoriosByCurso,
  updateLaboratorio,
} from '../services/laboratorios/laboratorios.service'

const cursos = ref([])
const loading = ref(false)
const error = ref('')
const success = ref('')

const showForm = ref(false)
const isEditing = ref(false)
const currentId = ref(null)
const actionMenuCursoId = ref(null)

const showLaboratorioForm = ref(false)
const selectedCurso = ref(null)
const currentLaboratorioId = ref(null)
const isEditingLaboratorio = ref(false)

const showLaboratoriosList = ref(false)
const laboratoriosCurso = ref([])
const loadingLaboratoriosCurso = ref(false)

const initialForm = () => ({
  nombre: '',
  codigo: '',
  semestre: 1,
  tipo: 'obligatorio',
  num_estudiantes: null,
  puede_manana: true,
  puede_tarde: true,
  tiene_laboratorio: false,
  activo: true,
})

const initialLaboratorioForm = () => ({
  nombre: '',
  num_periodos: 3,
  puede_manana: true,
  puede_tarde: true,
  activo: true,
})

const form = reactive(initialForm())
const laboratorioForm = reactive(initialLaboratorioForm())

const resetMessages = () => {
  error.value = ''
  success.value = ''
}

const loadCursos = async () => {
  loading.value = true

  try {
    const { data } = await getCursos()
    cursos.value = data
  } catch (err) {
    error.value = err?.response?.data?.error || 'Error cargando cursos'
  } finally {
    loading.value = false
  }
}

const openCreate = () => {
  Object.assign(form, initialForm())
  isEditing.value = false
  actionMenuCursoId.value = null
  showForm.value = true
}

const openEdit = (curso) => {
  actionMenuCursoId.value = null
  form.nombre = curso.nombre
  form.codigo = curso.codigo
  form.semestre = curso.semestre
  form.tipo = curso.tipo
  form.num_estudiantes = curso.num_estudiantes
  form.puede_manana = curso.puede_manana
  form.puede_tarde = curso.puede_tarde
  form.tiene_laboratorio = curso.tiene_laboratorio
  form.activo = curso.activo

  currentId.value = curso.id
  isEditing.value = true
  showForm.value = true
}

const closeForm = () => {
  showForm.value = false
}

const toggleCursoActions = (cursoId) => {
  actionMenuCursoId.value = actionMenuCursoId.value === cursoId ? null : cursoId
}

const closeCursoActions = () => {
  actionMenuCursoId.value = null
}

const handleEditFromMenu = (curso) => {
  closeCursoActions()
  openEdit(curso)
}

const handleAssignLaboratorioFromMenu = (curso) => {
  closeCursoActions()
  openAssignLaboratorio(curso)
}

const handleViewLaboratoriosFromMenu = (curso) => {
  closeCursoActions()
  openViewLaboratorios(curso)
}

const handleDeleteFromMenu = (cursoId) => {
  closeCursoActions()
  removeCurso(cursoId)
}

const submitForm = async () => {
  resetMessages()

  try {
    if (isEditing.value) {
      await updateCurso(currentId.value, form)
      success.value = 'Curso actualizado correctamente'
    } else {
      await createCurso(form)
      success.value = 'Curso creado correctamente'
    }

    closeForm()
    await loadCursos()
  } catch (err) {
    error.value = err?.response?.data?.error || 'Error guardando curso'
  }
}

const removeCurso = async (id) => {
  const ok = confirm('¿Eliminar este curso?')
  if (!ok) return

  resetMessages()

  try {
    await deleteCurso(id)
    success.value = 'Curso eliminado'
    await loadCursos()
  } catch (err) {
    error.value = err?.response?.data?.error || 'Error eliminando curso'
  }
}

const openAssignLaboratorio = async (curso) => {
  resetMessages()
  closeCursoActions()
  selectedCurso.value = curso
  Object.assign(laboratorioForm, initialLaboratorioForm())
  currentLaboratorioId.value = null
  isEditingLaboratorio.value = false

  try {
    const { data } = await getLaboratoriosByCurso(curso.id)

    if (Array.isArray(data) && data.length > 0) {
      const lab = data[0]
      laboratorioForm.nombre = lab.nombre || ''
      laboratorioForm.num_periodos = lab.num_periodos
      laboratorioForm.puede_manana = lab.puede_manana
      laboratorioForm.puede_tarde = lab.puede_tarde
      laboratorioForm.activo = lab.activo
      currentLaboratorioId.value = lab.id
      isEditingLaboratorio.value = true
    }
  } catch (err) {
    error.value = err?.response?.data?.error || 'Error obteniendo laboratorio del curso'
  } finally {
    showLaboratorioForm.value = true
  }
}

const closeLaboratorioForm = () => {
  showLaboratorioForm.value = false
  selectedCurso.value = null
}

const submitLaboratorio = async () => {
  if (!selectedCurso.value) return

  resetMessages()

  const payload = {
    curso_id: selectedCurso.value.id,
    nombre: laboratorioForm.nombre?.trim(),
    num_periodos: laboratorioForm.num_periodos,
    puede_manana: laboratorioForm.puede_manana,
    puede_tarde: laboratorioForm.puede_tarde,
    activo: laboratorioForm.activo,
  }

  try {
    if (isEditingLaboratorio.value && currentLaboratorioId.value) {
      await updateLaboratorio(currentLaboratorioId.value, payload)
      success.value = 'Laboratorio actualizado correctamente'
    } else {
      await createLaboratorio(payload)
      success.value = 'Laboratorio asignado correctamente'
    }

    closeLaboratorioForm()
    await loadCursos()
  } catch (err) {
    error.value = err?.response?.data?.error || 'Error guardando laboratorio'
  }
}

const openViewLaboratorios = async (curso) => {
  resetMessages()
  closeCursoActions()
  selectedCurso.value = curso
  showLaboratoriosList.value = true
  loadingLaboratoriosCurso.value = true

  try {
    const { data } = await getLaboratoriosByCurso(curso.id)
    laboratoriosCurso.value = Array.isArray(data) ? data : []
  } catch (err) {
    error.value = err?.response?.data?.error || 'Error cargando laboratorios del curso'
    laboratoriosCurso.value = []
  } finally {
    loadingLaboratoriosCurso.value = false
  }
}

const closeLaboratoriosList = () => {
  showLaboratoriosList.value = false
  laboratoriosCurso.value = []
  selectedCurso.value = null
}

onMounted(loadCursos)
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
  overflow:visible;
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

.dropdown-actions{
  position:relative;
}

.actions-menu{
  position:absolute;
  top:32px;
  right:0;
  min-width:170px;
  border:1px solid #e5e7eb;
  border-radius:8px;
  background:white;
  box-shadow:0 6px 16px rgba(0,0,0,0.12);
  overflow:hidden;
  z-index:30;
}

.btn-small{
  padding:6px 10px;
  border:none;
  border-radius:5px;
  color:white;
  cursor:pointer;
}

.menu{background:#4b5563;}
.edit{background:#f59e0b;}
.lab{background:#2563eb;}
.view{background:#4b5563;}
.delete{background:#dc2626;}

.action-item{
  width:100%;
  border:none;
  background:white;
  text-align:left;
  padding:10px 12px;
  cursor:pointer;
}

.action-item:hover{
  background:#f3f4f6;
}

.delete-item{
  color:#dc2626;
}

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
  margin-bottom:12px;
  background:#f9fafb;
}

.curso-info p{
  margin:4px 0;
}

.modal-actions{
  grid-column:1/-1;
  display:flex;
  justify-content:flex-end;
  gap:10px;
}

.only-close{
  margin-top:12px;
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