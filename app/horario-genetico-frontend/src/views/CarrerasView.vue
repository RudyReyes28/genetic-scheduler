<template>
  <div class="page">
    <div class="header-row">
      <div>
        <h1 class="page-title">Carreras</h1>
        <p class="page-subtitle">
          Administración de carreras académicas
        </p>
      </div>

      <button class="btn" @click="openCreate">
        Agregar Carrera
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
            <th>Acciones</th>
          </tr>
        </thead>

        <tbody>
          <tr v-if="loading">
            <td colspan="4" class="empty">Cargando carreras...</td>
          </tr>

          <tr v-else-if="carreras.length === 0">
            <td colspan="4" class="empty">No hay carreras registradas.</td>
          </tr>

          <tr v-for="carrera in carreras" :key="carrera.id">
            <td>{{ carrera.id }}</td>
            <td>{{ carrera.codigo }}</td>
            <td>{{ carrera.nombre }}</td>
            <td class="actions">
              <button class="btn-small edit" @click="openEdit(carrera)">Editar</button>
              <button class="btn-small delete" @click="removeCarrera(carrera.id)">Eliminar</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showForm" class="modal-backdrop">
      <div class="modal">
        <h2>{{ isEditing ? 'Editar Carrera' : 'Nueva Carrera' }}</h2>

        <form @submit.prevent="submitForm" class="form-grid single-column">
          <div class="form-group">
            <label>Nombre</label>
            <input v-model="form.nombre" type="text" required />
          </div>

          <div class="form-group">
            <label>Código</label>
            <input v-model="form.codigo" type="text" required />
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
  getCarreras,
  createCarrera,
  updateCarrera,
  deleteCarrera,
} from '../services/carreras/carreras.service'

const carreras = ref([])
const loading = ref(false)
const error = ref('')
const success = ref('')
const showForm = ref(false)
const isEditing = ref(false)
const currentId = ref(null)

const initialForm = () => ({
  nombre: '',
  codigo: '',
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

const loadCarreras = async () => {
  loading.value = true
  resetMessages()

  try {
    const { data } = await getCarreras()
    carreras.value = data
  } catch (err) {
    error.value = err?.response?.data?.error || 'Error al cargar carreras'
  } finally {
    loading.value = false
  }
}

const openCreate = () => {
  resetMessages()
  resetForm()
  showForm.value = true
}

const openEdit = (carrera) => {
  resetMessages()
  isEditing.value = true
  currentId.value = carrera.id
  form.nombre = carrera.nombre
  form.codigo = carrera.codigo
  showForm.value = true
}

const closeForm = () => {
  showForm.value = false
  resetForm()
}

const submitForm = async () => {
  resetMessages()

  try {
    if (isEditing.value) {
      await updateCarrera(currentId.value, form)
      success.value = 'Carrera actualizada correctamente'
    } else {
      await createCarrera(form)
      success.value = 'Carrera creada correctamente'
    }

    closeForm()
    await loadCarreras()
  } catch (err) {
    error.value = err?.response?.data?.error || 'Error al guardar carrera'
  }
}

const removeCarrera = async (id) => {
  resetMessages()

  const ok = window.confirm('¿Deseas eliminar esta carrera?')
  if (!ok) return

  try {
    await deleteCarrera(id)
    success.value = 'Carrera eliminada correctamente'
    await loadCarreras()
  } catch (err) {
    error.value = err?.response?.data?.error || 'Error al eliminar carrera'
  }
}

onMounted(loadCarreras)
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
  max-width: 520px;
  border-radius: 12px;
  padding: 24px;
}

.form-grid {
  display: grid;
  gap: 16px;
  margin-top: 16px;
}

.single-column {
  grid-template-columns: 1fr;
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

.modal-actions {
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
}
</style>