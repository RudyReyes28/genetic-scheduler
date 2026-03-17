<template>
  <div class="page">
    <div class="header-row">
      <div>
        <h1 class="page-title">Días de Horario</h1>
        <p class="page-subtitle">Consulta de combinaciones de días para cursos y secciones</p>
      </div>
    </div>

    <div v-if="error" class="alert error">{{ error }}</div>

    <div class="card">
      <table class="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Es laboratorio</th>
            <th>Días</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="4" class="empty">Cargando días-horario...</td>
          </tr>

          <tr v-else-if="diasHorario.length === 0">
            <td colspan="4" class="empty">No hay registros de días-horario</td>
          </tr>

          <tr v-for="item in diasHorario" :key="item.id">
            <td>{{ item.id }}</td>
            <td>{{ item.nombre }}</td>
            <td>{{ item.es_laboratorio ? 'Sí' : 'No' }}</td>
            <td>
              <div v-if="Array.isArray(item.dias) && item.dias.length > 0" class="dias-list">
                <span v-for="dia in item.dias" :key="dia.relacion_id" class="dia-chip">
                  {{ dia.nombre }}
                </span>
              </div>
              <span v-else>-</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { getDiasHorario } from '../services/dias-horario/diasHorario.service'

const diasHorario = ref([])
const loading = ref(false)
const error = ref('')

const loadDiasHorario = async () => {
  loading.value = true
  error.value = ''

  try {
    const { data } = await getDiasHorario()
    diasHorario.value = data
  } catch (err) {
    error.value = err?.response?.data?.error || 'Error cargando días-horario'
  } finally {
    loading.value = false
  }
}

onMounted(loadDiasHorario)
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

.table{
  width:100%;
  border-collapse:collapse;
}

th, td{
  padding:12px;
  border-bottom:1px solid #e5e7eb;
  vertical-align:top;
}

th{
  background:#f3f4f6;
}

.empty{
  text-align:center;
}

.dias-list{
  display:flex;
  flex-wrap:wrap;
  gap:6px;
}

.dia-chip{
  background:#e5e7eb;
  padding:4px 8px;
  border-radius:999px;
  font-size:12px;
}

.alert{
  padding:10px;
  margin-bottom:15px;
  border-radius:6px;
}

.error{
  background:#fee2e2;
}
</style>
