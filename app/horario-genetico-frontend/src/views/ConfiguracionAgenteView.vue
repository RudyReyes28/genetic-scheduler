<template>
  <div class="page">
    <div class="header-row">
      <div>
        <h1 class="page-title">Configuración del Agente</h1>
        <p class="page-subtitle">Parámetros del algoritmo genético y rangos de periodos</p>
      </div>

      <button class="btn" @click="openEdit">Actualizar configuración</button>
    </div>

    <div v-if="error" class="alert error">{{ error }}</div>
    <div v-if="success" class="alert success">{{ success }}</div>

    <div class="card">
      <table class="table">
        <tbody>
          <tr>
            <th>Tamaño población</th>
            <td>{{ config.tamano_poblacion }}</td>
          </tr>
          <tr>
            <th>Máx. generaciones</th>
            <td>{{ config.max_generaciones }}</td>
          </tr>
          <tr>
            <th>Aptitud objetivo</th>
            <td>{{ config.aptitud_objetivo ?? '-' }}</td>
          </tr>
          <tr>
            <th>Tasa mutación</th>
            <td>{{ config.tasa_mutacion }}</td>
          </tr>
          <tr>
            <th>Método selección</th>
            <td>{{ config.metodo_seleccion }}</td>
          </tr>
          <tr>
            <th>Método cruce</th>
            <td>{{ config.metodo_cruce }}</td>
          </tr>
          <tr>
            <th>Método mutación</th>
            <td>{{ config.metodo_mutacion }}</td>
          </tr>
          <tr>
            <th>Duración periodo (min)</th>
            <td>{{ config.duracion_periodo }}</td>
          </tr>
          <tr>
            <th>Inicio mañana</th>
            <td>{{ config.hora_inicio_manana }}</td>
          </tr>
          <tr>
            <th>Fin mañana</th>
            <td>{{ config.hora_fin_manana }}</td>
          </tr>
          <tr>
            <th>Inicio tarde</th>
            <td>{{ config.hora_inicio_tarde }}</td>
          </tr>
          <tr>
            <th>Fin tarde</th>
            <td>{{ config.hora_fin_tarde }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showForm" class="modal-backdrop">
      <div class="modal">
        <h2>Actualizar Configuración del Agente</h2>

        <form class="form-grid" @submit.prevent="submitForm">
          <div class="form-group">
            <label>Tamaño población</label>
            <input type="number" min="1" v-model.number="form.tamano_poblacion" required />
          </div>

          <div class="form-group">
            <label>Máx. generaciones</label>
            <input type="number" min="1" v-model.number="form.max_generaciones" required />
          </div>

          <div class="form-group">
            <label>Aptitud objetivo</label>
            <input type="number" step="0.01" v-model.number="form.aptitud_objetivo" />
          </div>

          <div class="form-group">
            <label>Tasa mutación</label>
            <input type="number" step="0.01" min="0" v-model.number="form.tasa_mutacion" required />
          </div>

          <div class="form-group">
            <label>Método selección</label>
            <input v-model="form.metodo_seleccion" required />
          </div>

          <div class="form-group">
            <label>Método cruce</label>
            <input v-model="form.metodo_cruce" required />
          </div>

          <div class="form-group">
            <label>Método mutación</label>
            <input v-model="form.metodo_mutacion" required />
          </div>

          <div class="form-group">
            <label>Duración periodo (min)</label>
            <input type="number" min="1" v-model.number="form.duracion_periodo" required />
          </div>

          <div class="form-group">
            <label>Hora inicio mañana</label>
            <input type="time" v-model="form.hora_inicio_manana" required />
          </div>

          <div class="form-group">
            <label>Hora fin mañana</label>
            <input type="time" v-model="form.hora_fin_manana" required />
          </div>

          <div class="form-group">
            <label>Hora inicio tarde</label>
            <input type="time" v-model="form.hora_inicio_tarde" required />
          </div>

          <div class="form-group">
            <label>Hora fin tarde</label>
            <input type="time" v-model="form.hora_fin_tarde" required />
          </div>

          <div class="modal-actions">
            <button type="button" class="btn-secondary" @click="closeForm">Cancelar</button>
            <button type="submit" class="btn">Guardar cambios</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import {
  getConfiguracionAgente,
  updateConfiguracionAgente,
} from '../services/configuracion/configuracion.service'

const loading = ref(false)
const error = ref('')
const success = ref('')
const showForm = ref(false)

const config = reactive({
  id: null,
  tamano_poblacion: null,
  max_generaciones: null,
  aptitud_objetivo: null,
  tasa_mutacion: null,
  metodo_seleccion: '',
  metodo_cruce: '',
  metodo_mutacion: '',
  duracion_periodo: null,
  hora_inicio_manana: '',
  hora_fin_manana: '',
  hora_inicio_tarde: '',
  hora_fin_tarde: '',
})

const form = reactive({
  tamano_poblacion: 100,
  max_generaciones: 500,
  aptitud_objetivo: null,
  tasa_mutacion: 0.05,
  metodo_seleccion: 'torneo',
  metodo_cruce: 'un_punto',
  metodo_mutacion: 'intercambio',
  duracion_periodo: 50,
  hora_inicio_manana: '08:00',
  hora_fin_manana: '13:00',
  hora_inicio_tarde: '13:40',
  hora_fin_tarde: '21:10',
})

const resetMessages = () => {
  error.value = ''
  success.value = ''
}

const normalizeTimeToInput = (timeValue) => {
  if (!timeValue) return ''
  return String(timeValue).slice(0, 5)
}

const applyConfig = (data) => {
  config.id = data.id
  config.tamano_poblacion = data.tamano_poblacion
  config.max_generaciones = data.max_generaciones
  config.aptitud_objetivo = data.aptitud_objetivo
  config.tasa_mutacion = data.tasa_mutacion
  config.metodo_seleccion = data.metodo_seleccion
  config.metodo_cruce = data.metodo_cruce
  config.metodo_mutacion = data.metodo_mutacion
  config.duracion_periodo = data.duracion_periodo
  config.hora_inicio_manana = data.hora_inicio_manana
  config.hora_fin_manana = data.hora_fin_manana
  config.hora_inicio_tarde = data.hora_inicio_tarde
  config.hora_fin_tarde = data.hora_fin_tarde
}

const loadConfiguracion = async () => {
  loading.value = true
  resetMessages()

  try {
    const { data } = await getConfiguracionAgente()
    applyConfig(data)
  } catch (err) {
    error.value = err?.response?.data?.error || 'Error cargando configuración del agente'
  } finally {
    loading.value = false
  }
}

const openEdit = () => {
  form.tamano_poblacion = config.tamano_poblacion
  form.max_generaciones = config.max_generaciones
  form.aptitud_objetivo = config.aptitud_objetivo
  form.tasa_mutacion = config.tasa_mutacion
  form.metodo_seleccion = config.metodo_seleccion
  form.metodo_cruce = config.metodo_cruce
  form.metodo_mutacion = config.metodo_mutacion
  form.duracion_periodo = config.duracion_periodo
  form.hora_inicio_manana = normalizeTimeToInput(config.hora_inicio_manana)
  form.hora_fin_manana = normalizeTimeToInput(config.hora_fin_manana)
  form.hora_inicio_tarde = normalizeTimeToInput(config.hora_inicio_tarde)
  form.hora_fin_tarde = normalizeTimeToInput(config.hora_fin_tarde)

  showForm.value = true
}

const closeForm = () => {
  showForm.value = false
}

const submitForm = async () => {
  resetMessages()

  try {
    const payload = {
      tamano_poblacion: form.tamano_poblacion,
      max_generaciones: form.max_generaciones,
      aptitud_objetivo: form.aptitud_objetivo === '' ? null : form.aptitud_objetivo,
      tasa_mutacion: form.tasa_mutacion,
      metodo_seleccion: form.metodo_seleccion,
      metodo_cruce: form.metodo_cruce,
      metodo_mutacion: form.metodo_mutacion,
      duracion_periodo: form.duracion_periodo,
      hora_inicio_manana: form.hora_inicio_manana,
      hora_fin_manana: form.hora_fin_manana,
      hora_inicio_tarde: form.hora_inicio_tarde,
      hora_fin_tarde: form.hora_fin_tarde,
    }

    const { data } = await updateConfiguracionAgente(payload)
    applyConfig(data)

    success.value = 'Configuración actualizada correctamente'
    closeForm()
  } catch (err) {
    error.value = err?.response?.data?.error || 'Error actualizando configuración'
  }
}

onMounted(loadConfiguracion)
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
  width:280px;
  text-align:left;
  background:#f3f4f6;
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
  width:760px;
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

.form-group input{
  padding:8px 10px;
  border:1px solid #d1d5db;
  border-radius:6px;
}

.modal-actions{
  grid-column:1/-1;
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
