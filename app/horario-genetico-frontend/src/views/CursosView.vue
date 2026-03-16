<template>
  <div class="page">

    <div class="header-row">
      <div>
        <h1 class="page-title">Cursos</h1>
        <p class="page-subtitle">
          Gestión de cursos disponibles
        </p>
      </div>

      <button class="btn" @click="openCreate">
        Agregar Curso
      </button>
    </div>

    <div v-if="error" class="alert error">
      {{ error }}
    </div>

    <div v-if="success" class="alert success">
      {{ success }}
    </div>

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
              <button class="btn-small edit" @click="openEdit(curso)">Editar</button>
              <button class="btn-small delete" @click="removeCurso(curso.id)">Eliminar</button>
            </td>
          </tr>

        </tbody>

      </table>

    </div>

    <!-- MODAL -->

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
            <button type="button" class="btn-secondary" @click="closeForm">
              Cancelar
            </button>

            <button type="submit" class="btn">
              {{ isEditing ? 'Actualizar' : 'Guardar' }}
            </button>
          </div>

        </form>

      </div>
    </div>

  </div>
</template>

<script setup>

import { ref, reactive, onMounted } from 'vue'
import {
  getCursos,
  createCurso,
  updateCurso,
  deleteCurso
} from '../services/cursos/cursos.service'

const cursos = ref([])
const loading = ref(false)
const error = ref('')
const success = ref('')

const showForm = ref(false)
const isEditing = ref(false)
const currentId = ref(null)

const initialForm = () => ({
  nombre: '',
  codigo: '',
  semestre: 1,
  tipo: 'obligatorio',
  num_estudiantes: null,
  puede_manana: true,
  puede_tarde: true,
  tiene_laboratorio: false,
  activo: true
})

const form = reactive(initialForm())

const resetMessages = () => {
  error.value = ''
  success.value = ''
}

const loadCursos = async () => {
  loading.value = true
  resetMessages()

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
  showForm.value = true
}

const openEdit = (curso) => {

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
    loadCursos()

  } catch (err) {

    error.value =
      err?.response?.data?.error ||
      'Error guardando curso'

  }

}

const removeCurso = async (id) => {

  const ok = confirm('¿Eliminar este curso?')

  if (!ok) return

  try {

    await deleteCurso(id)
    success.value = 'Curso eliminado'

    loadCursos()

  } catch (err) {

    error.value =
      err?.response?.data?.error ||
      'Error eliminando curso'

  }

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
  width:600px;
}

.form-grid{
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:15px;
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