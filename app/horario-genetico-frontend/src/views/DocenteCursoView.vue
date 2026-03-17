<template>
  <div class="page">
    <div class="header-row">
      <div>
        <h1 class="page-title">Docente - Curso</h1>
        <p class="page-subtitle">Asignación de docentes habilitados por curso</p>
      </div>

      <button class="btn" @click="openCreate">Agregar Asignación</button>
    </div>

    <div v-if="error" class="alert error">{{ error }}</div>
    <div v-if="success" class="alert success">{{ success }}</div>

    <div class="filter-card">
      <div class="filter-row">
        <div class="form-group">
          <label>Filtrar por curso</label>
          <select v-model="cursoFilterId">
            <option value="">Todos los cursos</option>
            <option v-for="curso in cursos" :key="curso.id" :value="String(curso.id)">
              {{ curso.codigo }} - {{ curso.nombre }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label>Filtrar por docente</label>
          <select v-model="docenteFilterId">
            <option value="">Todos los docentes</option>
            <option v-for="docente in docentes" :key="docente.id" :value="String(docente.id)">
              {{ docente.nombre }}
            </option>
          </select>
        </div>

        <button class="btn-secondary" @click="clearFilters">Limpiar</button>
      </div>
    </div>

    <div class="card">
      <table class="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Docente</th>
            <th>Registro</th>
            <th>Curso</th>
            <th>Semestre</th>
            <th>Tipo</th>
            <th>Puede laboratorio</th>
            <th>Acciones</th>
          </tr>
        </thead>

        <tbody>
          <tr v-if="loading">
            <td colspan="8" class="empty">Cargando asignaciones...</td>
          </tr>

          <tr v-else-if="asignacionesFiltradas.length === 0">
            <td colspan="8" class="empty">No hay asignaciones registradas</td>
          </tr>

          <tr v-for="item in asignacionesFiltradas" :key="item.id">
            <td>{{ item.id }}</td>
            <td>{{ docenteLabel(item.docente_id) }}</td>
            <td>{{ registroDocente(item.docente_id) }}</td>
            <td>{{ cursoLabel(item.curso_id) }}</td>
            <td>{{ semestreCurso(item.curso_id) }}</td>
            <td>{{ tipoCurso(item.curso_id) }}</td>
            <td>
              <span :class="item.puede_laboratorio ? 'badge badge-yes' : 'badge badge-no'">
                {{ item.puede_laboratorio ? 'Sí' : 'No' }}
              </span>
            </td>
            <td>
              <button class="btn-small delete" @click="removeAsignacion(item.id)">Eliminar</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showForm" class="modal-backdrop">
      <div class="modal">
        <h2>Nueva Asignación Docente - Curso</h2>

        <form class="form-grid" @submit.prevent="submitForm">

          <div class="form-group form-group-full">
            <label>Buscar docente</label>
            <input v-model="searchDocentes" placeholder="Filtrar por nombre o registro personal..." />
          </div>

          <div class="form-group form-group-full">
            <label>Docente</label>
            <select v-model="form.docente_id" required>
              <option value="" disabled>Seleccione un docente</option>
              <option v-for="docente in filteredDocentes" :key="docente.id" :value="String(docente.id)">
                {{ docente.nombre }}
              </option>
            </select>
          </div>

          <div v-if="selectedDocente" class="entity-info form-group-full">
            <p><strong>Nombre:</strong> {{ selectedDocente.nombre }}</p>
            <p><strong>Registro personal:</strong> {{ selectedDocente.registro_personal ?? '-' }}</p>
          </div>

          <div class="form-group form-group-full">
            <label>Buscar curso</label>
            <input v-model="searchCursos" placeholder="Filtrar por código o nombre..." />
          </div>

          <div class="form-group form-group-full">
            <label>Curso</label>
            <select v-model="form.curso_id" required>
              <option value="" disabled>Seleccione un curso</option>
              <option v-for="curso in filteredCursos" :key="curso.id" :value="String(curso.id)">
                {{ curso.codigo }} - {{ curso.nombre }}
              </option>
            </select>
          </div>

          <div v-if="selectedCurso" class="entity-info form-group-full">
            <p><strong>Código:</strong> {{ selectedCurso.codigo }}</p>
            <p><strong>Nombre:</strong> {{ selectedCurso.nombre }}</p>
            <p><strong>Semestre:</strong> {{ selectedCurso.semestre }} | <strong>Tipo:</strong> {{ selectedCurso.tipo }}</p>
            <p><strong>Tiene laboratorio:</strong> {{ selectedCurso.tiene_laboratorio ? 'Sí' : 'No' }}</p>
          </div>

          <div class="form-group form-group-full checkbox-group">
            <label>
              <input type="checkbox" v-model="form.puede_laboratorio" />
              Puede impartir laboratorio
            </label>
          </div>

          <div class="modal-actions form-group-full">
            <button type="button" class="btn-secondary" @click="closeForm">Cancelar</button>
            <button type="submit" class="btn">Guardar</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { getCursos } from '../services/cursos/cursos.service'
import { getDocentes } from '../services/docentes/docentes.service'
import {
  createDocenteCurso,
  deleteDocenteCurso,
  getDocenteCursos,
} from '../services/docente-curso/docenteCurso.service'

const asignaciones = ref([])
const cursos = ref([])
const docentes = ref([])

const loading = ref(false)
const error = ref('')
const success = ref('')

const showForm = ref(false)

const cursoFilterId = ref('')
const docenteFilterId = ref('')
const searchDocentes = ref('')
const searchCursos = ref('')

const initialForm = () => ({
  docente_id: '',
  curso_id: '',
  puede_laboratorio: false,
})

const form = reactive(initialForm())

const resetMessages = () => {
  error.value = ''
  success.value = ''
}

const selectedDocente = computed(() => {
  if (!form.docente_id) return null
  return docentes.value.find((item) => String(item.id) === form.docente_id) || null
})

const selectedCurso = computed(() => {
  if (!form.curso_id) return null
  return cursos.value.find((item) => String(item.id) === form.curso_id) || null
})

const filteredDocentes = computed(() => {
  const term = searchDocentes.value.trim().toLowerCase()
  if (!term) return docentes.value

  return docentes.value.filter((item) => {
    const nombre = String(item.nombre || '').toLowerCase()
    const registro = String(item.registro_personal || '').toLowerCase()
    return nombre.includes(term) || registro.includes(term)
  })
})

const filteredCursos = computed(() => {
  const term = searchCursos.value.trim().toLowerCase()
  if (!term) return cursos.value

  return cursos.value.filter((item) => {
    const codigo = String(item.codigo || '').toLowerCase()
    const nombre = String(item.nombre || '').toLowerCase()
    return codigo.includes(term) || nombre.includes(term)
  })
})

const asignacionesFiltradas = computed(() => {
  return asignaciones.value.filter((item) => {
    const matchCurso = !cursoFilterId.value || String(item.curso_id) === cursoFilterId.value
    const matchDocente = !docenteFilterId.value || String(item.docente_id) === docenteFilterId.value
    return matchCurso && matchDocente
  })
})

const docenteLabel = (docenteId) => {
  if (!docenteId) return '-'
  const docente = docentes.value.find((item) => item.id === docenteId)
  return docente ? docente.nombre : `Docente #${docenteId}`
}

const registroDocente = (docenteId) => {
  if (!docenteId) return '-'
  const docente = docentes.value.find((item) => item.id === docenteId)
  return docente ? (docente.registro_personal ?? '-') : '-'
}

const cursoLabel = (cursoId) => {
  if (!cursoId) return '-'
  const curso = cursos.value.find((item) => item.id === cursoId)
  if (!curso) return `Curso #${cursoId}`
  return `${curso.codigo} - ${curso.nombre}`
}

const semestreCurso = (cursoId) => {
  if (!cursoId) return '-'
  const curso = cursos.value.find((item) => item.id === cursoId)
  return curso ? curso.semestre : '-'
}

const tipoCurso = (cursoId) => {
  if (!cursoId) return '-'
  const curso = cursos.value.find((item) => item.id === cursoId)
  return curso ? curso.tipo : '-'
}

const loadDependencies = async () => {
  const [cursosRes, docentesRes] = await Promise.all([getCursos(), getDocentes()])
  cursos.value = cursosRes.data
  docentes.value = docentesRes.data
}

const loadAsignaciones = async () => {
  loading.value = true
  resetMessages()

  try {
    const { data } = await getDocenteCursos()
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
  searchDocentes.value = ''
  searchCursos.value = ''
  showForm.value = true
}

const closeForm = () => {
  showForm.value = false
}

const clearFilters = () => {
  cursoFilterId.value = ''
  docenteFilterId.value = ''
}

const submitForm = async () => {
  resetMessages()

  const payload = {
    docente_id: Number(form.docente_id),
    curso_id: Number(form.curso_id),
    puede_laboratorio: Boolean(form.puede_laboratorio),
  }

  try {
    await createDocenteCurso(payload)
    success.value = 'Asignación creada correctamente'
    closeForm()
    await loadAsignaciones()
  } catch (err) {
    error.value = err?.response?.data?.error || 'Error guardando asignación'
  }
}

const removeAsignacion = async (id) => {
  const ok = confirm('¿Eliminar esta asignación docente-curso?')
  if (!ok) return

  resetMessages()

  try {
    await deleteDocenteCurso(id)
    success.value = 'Asignación eliminada correctamente'
    await loadAsignaciones()
  } catch (err) {
    error.value = err?.response?.data?.error || 'Error eliminando asignación'
  }
}

onMounted(loadAll)
</script>

<style scoped>
.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.filter-card {
  background: white;
  border-radius: 10px;
  padding: 14px;
  margin-bottom: 16px;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.08);
}

.filter-row {
  display: flex;
  gap: 12px;
  align-items: flex-end;
  flex-wrap: wrap;
}

.card {
  background: white;
  border-radius: 10px;
  overflow: auto;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.08);
}

.btn {
  background: #2563eb;
  color: white;
  border: none;
  padding: 10px 14px;
  border-radius: 6px;
  cursor: pointer;
}

.btn:hover {
  background: #1d4ed8;
}

.btn-secondary {
  border: none;
  padding: 10px 14px;
  border-radius: 6px;
  cursor: pointer;
}

.table {
  width: 100%;
  border-collapse: collapse;
  min-width: 900px;
}

th,
td {
  padding: 12px;
  border-bottom: 1px solid #e5e7eb;
}

th {
  background: #f3f4f6;
}

.empty {
  text-align: center;
}

.btn-small {
  padding: 6px 10px;
  border: none;
  border-radius: 5px;
  color: white;
  cursor: pointer;
}

.delete {
  background: #dc2626;
}

.badge {
  padding: 4px 8px;
  border-radius: 10px;
  font-size: 12px;
}

.badge-yes {
  background: #dcfce7;
  color: #166534;
}

.badge-no {
  background: #fee2e2;
  color: #991b1b;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal {
  background: white;
  padding: 25px;
  border-radius: 10px;
  width: 800px;
  max-height: 90vh;
  overflow: auto;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group-full {
  grid-column: 1 / -1;
}

.form-group input,
.form-group select {
  padding: 8px 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
}

.checkbox-group {
  justify-content: flex-end;
}

.entity-info {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 10px;
  background: #f9fafb;
}

.entity-info p {
  margin: 4px 0;
}

.modal-actions {
  grid-column: 1 / -1;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.alert {
  padding: 10px;
  margin-bottom: 15px;
  border-radius: 6px;
}

.error {
  background: #fee2e2;
}

.success {
  background: #dcfce7;
}
</style>
