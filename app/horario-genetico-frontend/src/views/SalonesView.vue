<template>
  <div class="page">
    <div class="header-row">
      <div>
        <h1 class="page-title">Salones</h1>
        <p class="page-subtitle">
          Administración de salones y espacios disponibles
        </p>
      </div>

      <button class="btn" @click="openCreate">
        Agregar Salón
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
            <th>Nombre</th>
            <th>Capacidad</th>
            <th>Tipo</th>
            <th>Teórico en Lab</th>
            <th>Jornada</th>
            <th>Activo</th>
            <th>Acciones</th>
          </tr>
        </thead>

        <tbody>
          <tr v-if="loading">
            <td colspan="8" class="empty">Cargando salones...</td>
          </tr>

          <tr v-else-if="salones.length === 0">
            <td colspan="8" class="empty">No hay salones registrados.</td>
          </tr>

          <tr v-for="salon in salones" :key="salon.id">
            <td>{{ salon.id }}</td>
            <td>{{ salon.nombre }}</td>
            <td>{{ salon.capacidad ?? '-' }}</td>
            <td>{{ salon.es_laboratorio ? 'Laboratorio' : 'Teórico' }}</td>
            <td>{{ salon.lab_habilitado_teorico ? 'Sí' : 'No' }}</td>
            <td>{{ jornadaTexto(salon) }}</td>
            <td>
              <span :class="salon.activo ? 'badge active' : 'badge inactive'">
                {{ salon.activo ? 'Sí' : 'No' }}
              </span>
            </td>
            <td class="actions">
              <button class="btn-small details" @click="openDetails(salon)">Ver detalles</button>
              <button class="btn-small edit" @click="openEdit(salon)">Editar</button>
              <button class="btn-small delete" @click="removeSalon(salon.id)">Eliminar</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal formulario -->
    <div v-if="showForm" class="modal-backdrop">
      <div class="modal">
        <h2>{{ isEditing ? 'Editar Salón' : 'Nuevo Salón' }}</h2>

        <form @submit.prevent="submitForm" class="form-grid">
          <div class="form-group">
            <label>Nombre</label>
            <input v-model="form.nombre" type="text" required />
          </div>

          <div class="form-group">
            <label>Capacidad</label>
            <input v-model.number="form.capacidad" type="number" min="0" />
          </div>

          <div class="form-group checkbox-group">
            <label>
              <input v-model="form.es_laboratorio" type="checkbox" />
              Es laboratorio
            </label>
          </div>

          <div class="form-group checkbox-group">
            <label>
              <input v-model="form.lab_habilitado_teorico" type="checkbox" />
              Laboratorio habilitado para teórico
            </label>
          </div>

          <div class="form-group checkbox-group">
            <label>
              <input v-model="form.disponible_manana" type="checkbox" />
              Disponible mañana
            </label>
          </div>

          <div class="form-group checkbox-group">
            <label>
              <input v-model="form.disponible_tarde" type="checkbox" />
              Disponible tarde
            </label>
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

    <!-- Modal detalles -->
    <div v-if="showDetails" class="modal-backdrop">
      <div class="modal details-modal">
        <div class="details-header">
          <h2>Detalles del Salón</h2>
          <button class="close-btn" @click="closeDetails">✕</button>
        </div>

        <div class="details-grid" v-if="selectedSalon">
          <div class="detail-item">
            <span class="detail-label">ID</span>
            <span class="detail-value">{{ selectedSalon.id }}</span>
          </div>

          <div class="detail-item">
            <span class="detail-label">Nombre</span>
            <span class="detail-value">{{ selectedSalon.nombre }}</span>
          </div>

          <div class="detail-item">
            <span class="detail-label">Capacidad</span>
            <span class="detail-value">{{ selectedSalon.capacidad ?? 'No especificada' }}</span>
          </div>

          <div class="detail-item">
            <span class="detail-label">Tipo</span>
            <span class="detail-value">
              {{ selectedSalon.es_laboratorio ? 'Laboratorio' : 'Teórico' }}
            </span>
          </div>

          <div class="detail-item">
            <span class="detail-label">Laboratorio habilitado para teórico</span>
            <span class="detail-value">
              {{ selectedSalon.lab_habilitado_teorico ? 'Sí' : 'No' }}
            </span>
          </div>

          <div class="detail-item">
            <span class="detail-label">Disponible en la mañana</span>
            <span class="detail-value">
              {{ selectedSalon.disponible_manana ? 'Sí' : 'No' }}
            </span>
          </div>

          <div class="detail-item">
            <span class="detail-label">Disponible en la tarde</span>
            <span class="detail-value">
              {{ selectedSalon.disponible_tarde ? 'Sí' : 'No' }}
            </span>
          </div>

          <div class="detail-item">
            <span class="detail-label">Jornada</span>
            <span class="detail-value">{{ jornadaTexto(selectedSalon) }}</span>
          </div>

          <div class="detail-item">
            <span class="detail-label">Activo</span>
            <span class="detail-value">
              {{ selectedSalon.activo ? 'Sí' : 'No' }}
            </span>
          </div>
        </div>

        <div class="modal-actions">
          <button type="button" class="btn-secondary" @click="closeDetails">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import {
  getSalones,
  createSalon,
  updateSalon,
  deleteSalon,
} from '../services/salones.service'

const salones = ref([])
const loading = ref(false)
const error = ref('')
const success = ref('')
const showForm = ref(false)
const isEditing = ref(false)
const currentId = ref(null)

const showDetails = ref(false)
const selectedSalon = ref(null)

const initialForm = () => ({
  nombre: '',
  capacidad: null,
  es_laboratorio: false,
  lab_habilitado_teorico: false,
  disponible_manana: true,
  disponible_tarde: true,
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

const jornadaTexto = (salon) => {
  if (salon.disponible_manana && salon.disponible_tarde) return 'Mañana y Tarde'
  if (salon.disponible_manana) return 'Solo Mañana'
  if (salon.disponible_tarde) return 'Solo Tarde'
  return 'No disponible'
}

const loadSalones = async () => {
  loading.value = true
  resetMessages()

  try {
    const { data } = await getSalones()
    salones.value = data
  } catch (err) {
    error.value = err?.response?.data?.error || 'Error al cargar salones'
  } finally {
    loading.value = false
  }
}

const openCreate = () => {
  resetMessages()
  resetForm()
  showForm.value = true
}

const openEdit = (salon) => {
  resetMessages()
  isEditing.value = true
  currentId.value = salon.id
  form.nombre = salon.nombre
  form.capacidad = salon.capacidad
  form.es_laboratorio = salon.es_laboratorio
  form.lab_habilitado_teorico = salon.lab_habilitado_teorico
  form.disponible_manana = salon.disponible_manana
  form.disponible_tarde = salon.disponible_tarde
  form.activo = salon.activo
  showForm.value = true
}

const closeForm = () => {
  showForm.value = false
  resetForm()
}

const openDetails = (salon) => {
  selectedSalon.value = salon
  showDetails.value = true
}

const closeDetails = () => {
  selectedSalon.value = null
  showDetails.value = false
}

const submitForm = async () => {
  resetMessages()

  try {
    const payload = {
      ...form,
      capacidad: form.capacidad === '' ? null : form.capacidad,
    }

    if (isEditing.value) {
      await updateSalon(currentId.value, payload)
      success.value = 'Salón actualizado correctamente'
    } else {
      await createSalon(payload)
      success.value = 'Salón creado correctamente'
    }

    closeForm()
    await loadSalones()
  } catch (err) {
    error.value = err?.response?.data?.error || 'Error al guardar salón'
  }
}

const removeSalon = async (id) => {
  resetMessages()

  const ok = window.confirm('¿Deseas eliminar este salón?')
  if (!ok) return

  try {
    await deleteSalon(id)
    success.value = 'Salón eliminado correctamente'
    await loadSalones()
  } catch (err) {
    error.value = err?.response?.data?.error || 'Error al eliminar salón'
  }
}

onMounted(loadSalones)
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

.details {
  background: #0ea5e9;
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
  z-index: 50;
}

.modal {
  background: white;
  width: 100%;
  max-width: 680px;
  border-radius: 12px;
  padding: 24px;
}

.details-modal {
  max-width: 760px;
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
  margin-top: 16px;
}

.details-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18px;
}

.close-btn {
  border: none;
  background: transparent;
  font-size: 20px;
  cursor: pointer;
  color: #374151;
}

.details-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.detail-item {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.detail-label {
  font-size: 13px;
  color: #6b7280;
  font-weight: 600;
}

.detail-value {
  font-size: 15px;
  color: #111827;
  font-weight: 500;
}

@media (max-width: 768px) {
  .header-row {
    flex-direction: column;
    align-items: stretch;
  }

  .form-grid,
  .details-grid {
    grid-template-columns: 1fr;
  }

  .actions {
    flex-direction: column;
  }
}
</style>