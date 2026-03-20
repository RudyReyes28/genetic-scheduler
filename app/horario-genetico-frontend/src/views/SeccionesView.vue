<template>
  <div class="page">
    <div class="header-row">
      <div>
        <h1 class="page-title">Secciones</h1>
        <p class="page-subtitle">Gestión de secciones por curso con asignaciones fijas opcionales</p>
      </div>

      <button class="btn" @click="openCreate">Agregar Sección</button>
    </div>

    <div v-if="error" class="alert error">{{ error }}</div>
    <div v-if="success" class="alert success">{{ success }}</div>

    <div class="filter-card">
      <div class="filter-row">
        <div class="form-group">
          <label>Filtrar listado por curso</label>
          <input
            v-model="searchCursoFilter"
            placeholder="Escribe nombre o código del curso..."
            @input="onSearchCursoFilter"
            class="search-input"
          />
          <div v-if="showCursoSuggestions && filteredCursosForFilter.length > 0" class="suggestions">
            <div
              v-for="curso in filteredCursosForFilter"
              :key="curso.id"
              class="suggestion-item"
              @click="selectCursoFilter(curso)"
            >
              <strong>{{ curso.codigo }}</strong> - {{ curso.nombre }}
            </div>
          </div>
          <div v-if="showCursoSuggestions && searchCursoFilter && filteredCursosForFilter.length === 0" class="suggestions">
            <div class="suggestion-item disabled">Sin resultados</div>
          </div>
        </div>

        <button class="btn-secondary" @click="clearCursoFilter">Limpiar filtro</button>
      </div>
      <div v-if="cursoFilterId" class="selected-filter">
        <span>Filtrado por: <strong>{{ selectedCursoName }}</strong></span>
      </div>
    </div>

    <div class="card">
      <table class="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Curso</th>
            <th>Sección</th>
            <th>Estudiantes</th>
            <th>Salón fijo</th>
            <th>Docente fijo</th>
            <th>Período inicio</th>
            <th>Día-horario</th>
            <th>Sin salón</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="10" class="empty">Cargando secciones...</td>
          </tr>

          <tr v-else-if="secciones.length === 0">
            <td colspan="10" class="empty">No hay secciones registradas</td>
          </tr>

          <tr v-for="seccion in secciones" :key="seccion.id">
            <td>{{ seccion.id }}</td>
            <td>{{ cursoLabel(seccion.curso_id) }}</td>
            <td>{{ seccion.letra }}</td>
            <td>{{ seccion.num_estudiantes_seccion ?? '-' }}</td>
            <td>{{ salonLabel(seccion.salon_fijo_id) }}</td>
            <td>{{ docenteLabel(seccion.docente_fijo_id) }}</td>
            <td>{{ periodoLabel(seccion.periodo_fijo_inicio_id) }}</td>
            <td>{{ diaHorarioLabel(seccion.dia_horario_fijo_id) }}</td>
            <td>{{ seccion.sin_salon ? 'Sí' : 'No' }}</td>
            <td class="actions">
              <button class="btn-small edit" @click="openEdit(seccion)">Editar</button>
              <button class="btn-small delete" @click="removeSeccion(seccion.id)">Eliminar</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showForm" class="modal-backdrop">
      <div class="modal">
        <h2>{{ isEditing ? 'Editar Sección' : 'Nueva Sección' }}</h2>

        <form class="form-grid" @submit.prevent="submitForm">
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
            <p><strong>Curso:</strong> {{ selectedCurso.codigo }} - {{ selectedCurso.nombre }}</p>
            <p><strong>Semestre:</strong> {{ selectedCurso.semestre }} | <strong>Tipo:</strong> {{ selectedCurso.tipo }}</p>
          </div>

          <div class="form-group">
            <label>Letra sección</label>
            <input v-model="form.letra" maxlength="5" required />
          </div>

          <div class="form-group">
            <label># Estudiantes sección</label>
            <input type="number" min="0" v-model.number="form.num_estudiantes_seccion" />
          </div>

          <div class="form-group form-group-full checkbox-group">
            <label>
              <input type="checkbox" v-model="form.sin_salon" />
              Sección sin salón fijo
            </label>
          </div>

          <div class="form-group form-group-full">
            <label>Buscar salón</label>
            <input v-model="searchSalones" placeholder="Filtrar por nombre de salón..." :disabled="form.sin_salon" />
          </div>

          <div class="form-group form-group-full">
            <label>Salón fijo (opcional)</label>
            <select v-model="form.salon_fijo_id" :disabled="form.sin_salon">
              <option value="">Sin salón fijo</option>
              <option v-for="salon in filteredSalones" :key="salon.id" :value="String(salon.id)">
                {{ salon.nombre }}
              </option>
            </select>
          </div>

          <div v-if="selectedSalon && !form.sin_salon" class="entity-info form-group-full">
            <p><strong>Salón:</strong> {{ selectedSalon.nombre }}</p>
            <p><strong>Capacidad:</strong> {{ selectedSalon.capacidad ?? '-' }} | <strong>Laboratorio:</strong> {{ selectedSalon.es_laboratorio ? 'Sí' : 'No' }}</p>
          </div>

          <div class="form-group form-group-full">
            <label>Buscar docente</label>
            <input v-model="searchDocentes" placeholder="Filtrar por nombre o registro personal..." />
          </div>

          <div class="form-group form-group-full">
            <label>Docente fijo (opcional)</label>
            <select v-model="form.docente_fijo_id">
              <option value="">Sin docente fijo</option>
              <option v-for="docente in filteredDocentes" :key="docente.id" :value="String(docente.id)">
                {{ docente.nombre }}
              </option>
            </select>
          </div>

          <div v-if="selectedDocente" class="entity-info form-group-full">
            <p><strong>Docente:</strong> {{ selectedDocente.nombre }}</p>
            <p><strong>Registro:</strong> {{ selectedDocente.registro_personal ?? '-' }}</p>
          </div>

          <div class="form-group form-group-full">
            <label>Buscar período</label>
            <input v-model="searchPeriodos" placeholder="Filtrar por número u hora..." />
          </div>

          <div class="form-group form-group-full">
            <label>Período fijo de inicio (opcional)</label>
            <select v-model="form.periodo_fijo_inicio_id">
              <option value="">Sin período fijo</option>
              <option v-for="periodo in filteredPeriodos" :key="periodo.id" :value="String(periodo.id)">
                #{{ periodo.numero }} ({{ periodo.hora_inicio }} - {{ periodo.hora_fin }})
              </option>
            </select>
          </div>

          <div v-if="selectedPeriodo" class="entity-info form-group-full">
            <p><strong>Período:</strong> #{{ selectedPeriodo.numero }} | {{ selectedPeriodo.hora_inicio }} - {{ selectedPeriodo.hora_fin }}</p>
            <p><strong>Jornada:</strong> {{ selectedPeriodo.es_manana ? 'Mañana' : 'Tarde' }}</p>
          </div>

          <div class="form-group form-group-full">
            <label>Buscar día-horario</label>
            <input v-model="searchDiasHorario" placeholder="Filtrar por nombre..." />
          </div>

          <div class="form-group form-group-full">
            <label>Día-horario fijo (opcional)</label>
            <select v-model="form.dia_horario_fijo_id">
              <option value="">Sin día-horario fijo</option>
              <option v-for="item in filteredDiasHorario" :key="item.id" :value="String(item.id)">
                {{ item.nombre }}
              </option>
            </select>
          </div>

          <div v-if="selectedDiaHorario" class="entity-info form-group-full">
            <p><strong>Día-horario:</strong> {{ selectedDiaHorario.nombre }}</p>
            <p><strong>Días:</strong> {{ diasDescripcion(selectedDiaHorario) }}</p>
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
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { getCursos } from '../services/cursos/cursos.service'
import { getSalones } from '../services/salones/salones.service'
import { getDocentes } from '../services/docentes/docentes.service'
import { getPeriodos } from '../services/periodos/periodos.service'
import { getDiasHorario } from '../services/dias-horario/diasHorario.service'
import {
  createSeccion,
  deleteSeccion,
  getSecciones,
  getSeccionesByCurso,
  updateSeccion,
} from '../services/secciones/secciones.service'

const secciones = ref([])
const cursos = ref([])
const salones = ref([])
const docentes = ref([])
const periodos = ref([])
const diasHorario = ref([])

const loading = ref(false)
const error = ref('')
const success = ref('')

const showForm = ref(false)
const isEditing = ref(false)
const currentId = ref(null)

const cursoFilterId = ref('')
const searchCursoFilter = ref('')
const showCursoSuggestions = ref(false)

const searchCursos = ref('')
const searchSalones = ref('')
const searchDocentes = ref('')
const searchPeriodos = ref('')
const searchDiasHorario = ref('')

const initialForm = () => ({
  curso_id: '',
  letra: '',
  num_estudiantes_seccion: null,
  salon_fijo_id: '',
  docente_fijo_id: '',
  periodo_fijo_inicio_id: '',
  dia_horario_fijo_id: '',
  sin_salon: false,
})

const form = reactive(initialForm())

watch(
  () => form.sin_salon,
  (value) => {
    if (value) {
      form.salon_fijo_id = ''
    }
  },
)

const selectedCurso = computed(() => {
  if (!form.curso_id) return null
  return cursos.value.find((item) => String(item.id) === form.curso_id) || null
})

const selectedSalon = computed(() => {
  if (!form.salon_fijo_id) return null
  return salones.value.find((item) => String(item.id) === form.salon_fijo_id) || null
})

const selectedDocente = computed(() => {
  if (!form.docente_fijo_id) return null
  return docentes.value.find((item) => String(item.id) === form.docente_fijo_id) || null
})

const selectedPeriodo = computed(() => {
  if (!form.periodo_fijo_inicio_id) return null
  return periodos.value.find((item) => String(item.id) === form.periodo_fijo_inicio_id) || null
})

const selectedDiaHorario = computed(() => {
  if (!form.dia_horario_fijo_id) return null
  return diasHorario.value.find((item) => String(item.id) === form.dia_horario_fijo_id) || null
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

const filteredSalones = computed(() => {
  const term = searchSalones.value.trim().toLowerCase()
  if (!term) return salones.value
  return salones.value.filter((item) => String(item.nombre || '').toLowerCase().includes(term))
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

const filteredPeriodos = computed(() => {
  const term = searchPeriodos.value.trim().toLowerCase()
  if (!term) return periodos.value

  return periodos.value.filter((item) => {
    const numero = String(item.numero || '').toLowerCase()
    const inicio = String(item.hora_inicio || '').toLowerCase()
    const fin = String(item.hora_fin || '').toLowerCase()
    return numero.includes(term) || inicio.includes(term) || fin.includes(term)
  })
})

const filteredDiasHorario = computed(() => {
  const term = searchDiasHorario.value.trim().toLowerCase()
  if (!term) return diasHorario.value
  return diasHorario.value.filter((item) => String(item.nombre || '').toLowerCase().includes(term))
})

const filteredCursosForFilter = computed(() => {
  const term = searchCursoFilter.value.trim().toLowerCase()
  if (!term) return cursos.value

  return cursos.value.filter((item) => {
    const codigo = String(item.codigo || '').toLowerCase()
    const nombre = String(item.nombre || '').toLowerCase()
    return codigo.includes(term) || nombre.includes(term)
  })
})

const selectedCursoName = computed(() => {
  if (!cursoFilterId.value) return ''
  const curso = cursos.value.find((item) => String(item.id) === cursoFilterId.value)
  return curso ? `${curso.codigo} - ${curso.nombre}` : ''
})

const resetMessages = () => {
  error.value = ''
  success.value = ''
}

const cursoLabel = (id) => {
  if (!id) return '-'
  const curso = cursos.value.find((item) => item.id === id)
  return curso ? `${curso.codigo} - ${curso.nombre}` : `Curso #${id}`
}

const salonLabel = (id) => {
  if (!id) return '-'
  const salon = salones.value.find((item) => item.id === id)
  return salon ? salon.nombre : `Salón #${id}`
}

const docenteLabel = (id) => {
  if (!id) return '-'
  const docente = docentes.value.find((item) => item.id === id)
  return docente ? docente.nombre : `Docente #${id}`
}

const periodoLabel = (id) => {
  if (!id) return '-'
  const periodo = periodos.value.find((item) => item.id === id)
  if (!periodo) return `Período #${id}`
  return `#${periodo.numero} (${periodo.hora_inicio}-${periodo.hora_fin})`
}

const diaHorarioLabel = (id) => {
  if (!id) return '-'
  const item = diasHorario.value.find((row) => row.id === id)
  return item ? item.nombre : `Día-horario #${id}`
}

const diasDescripcion = (item) => {
  if (!item || !Array.isArray(item.dias) || item.dias.length === 0) return '-'
  return item.dias.map((dia) => dia.nombre).join(', ')
}

const loadDependencies = async () => {
  const [cursosRes, salonesRes, docentesRes, periodosRes, diasHorarioRes] = await Promise.all([
    getCursos(),
    getSalones(),
    getDocentes(),
    getPeriodos(),
    getDiasHorario(),
  ])

  cursos.value = cursosRes.data
  salones.value = salonesRes.data
  docentes.value = docentesRes.data
  periodos.value = periodosRes.data
  diasHorario.value = diasHorarioRes.data
}

const loadSecciones = async () => {
  loading.value = true
  resetMessages()

  try {
    const request = cursoFilterId.value
      ? getSeccionesByCurso(cursoFilterId.value)
      : getSecciones()

    const { data } = await request
    secciones.value = data
  } catch (err) {
    error.value = err?.response?.data?.error || 'Error cargando secciones'
  } finally {
    loading.value = false
  }
}

const loadAll = async () => {
  loading.value = true
  resetMessages()

  try {
    await loadDependencies()
    await loadSecciones()
  } catch (err) {
    error.value = err?.response?.data?.error || 'Error cargando datos'
    loading.value = false
  }
}

const onSearchCursoFilter = () => {
  showCursoSuggestions.value = true
}

const selectCursoFilter = async (curso) => {
  cursoFilterId.value = String(curso.id)
  searchCursoFilter.value = `${curso.codigo} - ${curso.nombre}`
  showCursoSuggestions.value = false
  await loadSecciones()
}

const clearCursoFilter = async () => {
  cursoFilterId.value = ''
  searchCursoFilter.value = ''
  showCursoSuggestions.value = false
  await loadSecciones()
}

const onCursoFilterChange = async () => {
  await loadSecciones()
}

const openCreate = () => {
  Object.assign(form, initialForm())
  searchCursos.value = ''
  searchSalones.value = ''
  searchDocentes.value = ''
  searchPeriodos.value = ''
  searchDiasHorario.value = ''

  isEditing.value = false
  currentId.value = null
  showForm.value = true
}

const openEdit = (item) => {
  form.curso_id = String(item.curso_id)
  form.letra = item.letra
  form.num_estudiantes_seccion = item.num_estudiantes_seccion
  form.salon_fijo_id = item.salon_fijo_id ? String(item.salon_fijo_id) : ''
  form.docente_fijo_id = item.docente_fijo_id ? String(item.docente_fijo_id) : ''
  form.periodo_fijo_inicio_id = item.periodo_fijo_inicio_id ? String(item.periodo_fijo_inicio_id) : ''
  form.dia_horario_fijo_id = item.dia_horario_fijo_id ? String(item.dia_horario_fijo_id) : ''
  form.sin_salon = item.sin_salon

  searchCursos.value = ''
  searchSalones.value = ''
  searchDocentes.value = ''
  searchPeriodos.value = ''
  searchDiasHorario.value = ''

  currentId.value = item.id
  isEditing.value = true
  showForm.value = true
}

const closeForm = () => {
  showForm.value = false
}

const submitForm = async () => {
  resetMessages()

  const payload = {
    curso_id: Number(form.curso_id),
    letra: String(form.letra || '').trim(),
    num_estudiantes_seccion:
      form.num_estudiantes_seccion === null || form.num_estudiantes_seccion === ''
        ? null
        : Number(form.num_estudiantes_seccion),
    salon_fijo_id: form.sin_salon || !form.salon_fijo_id ? null : Number(form.salon_fijo_id),
    docente_fijo_id: form.docente_fijo_id ? Number(form.docente_fijo_id) : null,
    periodo_fijo_inicio_id: form.periodo_fijo_inicio_id ? Number(form.periodo_fijo_inicio_id) : null,
    dia_horario_fijo_id: form.dia_horario_fijo_id ? Number(form.dia_horario_fijo_id) : null,
    sin_salon: Boolean(form.sin_salon),
  }

  try {
    if (isEditing.value) {
      await updateSeccion(currentId.value, payload)
      success.value = 'Sección actualizada correctamente'
    } else {
      await createSeccion(payload)
      success.value = 'Sección creada correctamente'
    }

    closeForm()
    await loadSecciones()
  } catch (err) {
    error.value = err?.response?.data?.error || 'Error guardando sección'
  }
}

const removeSeccion = async (id) => {
  const ok = confirm('¿Eliminar esta sección?')
  if (!ok) return

  resetMessages()

  try {
    await deleteSeccion(id)
    success.value = 'Sección eliminada correctamente'
    await loadSecciones()
  } catch (err) {
    error.value = err?.response?.data?.error || 'Error eliminando sección'
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

.filter-card{
  background:white;
  border-radius:10px;
  padding:14px;
  margin-bottom:16px;
  box-shadow:0 3px 10px rgba(0,0,0,0.08);
}

.filter-row{
  display:flex;
  gap:12px;
  align-items:flex-end;
}

.form-group{
  flex: 1;
  display:flex;
  flex-direction:column;
  gap:6px;
  position: relative;
}

.form-group-full{
  grid-column:1 / -1;
}

.search-input{
  padding:8px 10px;
  border:1px solid #d1d5db;
  border-radius:6px;
  font-size: 14px;
}

.search-input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.suggestions{
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #d1d5db;
  border-top: none;
  border-radius: 0 0 6px 6px;
  max-height: 250px;
  overflow-y: auto;
  z-index: 10;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.suggestion-item{
  padding: 10px 12px;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
  font-size: 14px;
  transition: background-color 200ms;
}

.suggestion-item:hover:not(.disabled){
  background-color: #f3f4f6;
}

.suggestion-item.disabled{
  cursor: default;
  color: #9ca3af;
  background-color: #f9fafb;
}

.selected-filter{
  margin-top: 10px;
  padding: 8px 12px;
  background-color: #dbeafe;
  border-left: 4px solid #2563eb;
  border-radius: 4px;
  font-size: 13px;
  color: #1e40af;
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
  min-width:1200px;
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

.form-group input,
.form-group select{
  padding:8px 10px;
  border:1px solid #d1d5db;
  border-radius:6px;
}

.checkbox-group{
  justify-content:flex-end;
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
