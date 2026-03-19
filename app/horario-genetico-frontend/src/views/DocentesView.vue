<template>
  <div class="page">
    <div class="header-row">
      <div>
        <h1 class="page-title">Docentes</h1>
        <p class="page-subtitle">
          Administración de docentes disponibles para impartir cursos
        </p>
      </div>

      <button class="btn" @click="openCreate">
        Agregar Docente
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
            <th>Registro</th>
            <th>Nombre</th>
            <th>Hora Entrada</th>
            <th>Hora Salida</th>
            <th>Activo</th>
            <th>Acciones</th>
          </tr>
        </thead>

        <tbody>
          <tr v-if="loading">
            <td colspan="7" class="empty">Cargando docentes...</td>
          </tr>

          <tr v-else-if="docentes.length === 0">
            <td colspan="7" class="empty">No hay docentes registrados.</td>
          </tr>

          <tr v-for="docente in docentes" :key="docente.id">
            <td>{{ docente.id }}</td>
            <td>{{ docente.registro_personal }}</td>
            <td>{{ docente.nombre }}</td>
            <td>{{ formatTime(docente.hora_entrada) }}</td>
            <td>{{ formatTime(docente.hora_salida) }}</td>
            <td>
              <span :class="docente.activo ? 'badge active' : 'badge inactive'">
                {{ docente.activo ? 'Sí' : 'No' }}
              </span>
            </td>
            <td class="actions">
              <button class="btn-small edit" @click="openEdit(docente)">Editar</button>
              <button class="btn-small delete" @click="removeDocente(docente.id)">Eliminar</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showForm" class="modal-backdrop">
      <div class="modal">
        <h2>{{ isEditing ? 'Editar Docente' : 'Nuevo Docente' }}</h2>

        <form @submit.prevent="submitForm" class="form-grid">
          <div class="form-group">
            <label>Nombre</label>
            <input v-model="form.nombre" type="text" required />
          </div>

          <div class="form-group">
            <label>Registro personal</label>
            <input v-model="form.registro_personal" type="text" required />
          </div>

          <div class="form-group">
            <label>Hora entrada</label>
            <input v-model="form.hora_entrada" type="time" required />
          </div>

          <div class="form-group">
            <label>Hora salida</label>
            <input v-model="form.hora_salida" type="time" required />
          </div>

          <div class="form-group checkbox-group">
            <label>
              <input v-model="form.activo" type="checkbox" />
              Activo
            </label>
          </div>

          <div class="modal-actions">
            <button type="button" class="btn-secondary" @click="closeForm">Cancelar</button>
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
import { onMounted, reactive, ref } from 'vue'
import {
  getDocentes,
  createDocente,
  updateDocente,
  deleteDocente,
} from '../services/docentes/docentes.service'

const docentes = ref([])
const loading = ref(false)
const error = ref('')
const success = ref('')
const showForm = ref(false)
const isEditing = ref(false)
const currentId = ref(null)

const initialForm = () => ({
  nombre: '',
  registro_personal: '',
  hora_entrada: '',
  hora_salida: '',
  activo: true,
})

const form = reactive(initialForm())

const resetMessages = () => {
  error.value = ''
  success.value = ''
}

const resetForm = () => {
  Object.assign(form, initialForm())
  currentId.value = null
  isEditing.value = false
}

const formatTime = (value) => {
  if (!value) return ''
  return value.slice(0, 5)
}

const loadDocentes = async () => {
  loading.value = true
  resetMessages()

  try {
    const { data } = await getDocentes()
    docentes.value = data
  } catch (err) {
    error.value = err?.response?.data?.error || 'Error al cargar docentes'
  } finally {
    loading.value = false
  }
}

const openCreate = () => {
  resetMessages()
  resetForm()
  showForm.value = true
}

const openEdit = (docente) => {
  resetMessages()
  isEditing.value = true
  currentId.value = docente.id
  form.nombre = docente.nombre
  form.registro_personal = docente.registro_personal
  form.hora_entrada = formatTime(docente.hora_entrada)
  form.hora_salida = formatTime(docente.hora_salida)
  form.activo = docente.activo
  showForm.value = true
}

const closeForm = () => {
  showForm.value = false
  resetForm()
}

const submitForm = async () => {
  resetMessages()

  try {
    const payload = {
      ...form,
      hora_entrada: `${form.hora_entrada}:00`,
      hora_salida: `${form.hora_salida}:00`,
    }

    if (isEditing.value) {
      await updateDocente(currentId.value, payload)
      success.value = 'Docente actualizado correctamente'
    } else {
      await createDocente(payload)
      success.value = 'Docente creado correctamente'
    }

    closeForm()
    await loadDocentes()
  } catch (err) {
    error.value = err?.response?.data?.error || 'Error al guardar docente'
  }
}

const removeDocente = async (id) => {
  resetMessages()

  const ok = window.confirm('¿Deseas eliminar este docente?')
  if (!ok) return

  try {
    await deleteDocente(id)
    success.value = 'Docente eliminado correctamente'
    await loadDocentes()
  } catch (err) {
    error.value = err?.response?.data?.error || 'Error al eliminar docente'
  }
}

onMounted(loadDocentes)
</script>

<style scoped>
.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.card {
  background: white;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.08);
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

.btn-secondary {
  background: #e5e7eb;
  color: #111827;
  border: none;
  padding: 10px 14px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
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

tbody tr:hover {
  background: #f9fafb;
}

.empty {
  text-align: center;
  color: #6b7280;
}

.actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.btn-small {
  border: none;
  padding: 7px 10px;
  border-radius: 6px;
  cursor: pointer;
  color: white;
  font-size: 13px;
}

.edit {
  background: #f59e0b;
}

.delete {
  background: #dc2626;
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

.badge {
  padding: 5px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
}

.badge.active {
  background: #dcfce7;
  color: #166534;
}

.badge.inactive {
  background: #fee2e2;
  color: #991b1b;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(17, 24, 39, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.modal {
  background: white;
  width: 100%;
  max-width: 620px;
  border-radius: 12px;
  padding: 24px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-top: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group input {
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  outline: none;
}

.checkbox-group {
  justify-content: center;
}

.modal-actions {
  grid-column: 1 / -1;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 8px;
}

@media (max-width: 768px) {
  .header-row {
    flex-direction: column;
    align-items: stretch;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>