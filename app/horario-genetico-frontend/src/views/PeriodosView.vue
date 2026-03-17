<template>
  <div class="page">
    <div class="header-row">
      <div>
        <h1 class="page-title">Períodos</h1>
        <p class="page-subtitle">Consulta de períodos de horarios generados</p>
      </div>
    </div>

    <div v-if="error" class="alert error">{{ error }}</div>

    <div v-if="loading" class="card empty-state">Cargando períodos...</div>

    <div v-else-if="periodos.length === 0" class="card empty-state">
      No hay períodos registrados
    </div>

    <div v-else class="schedules-grid">
      <div class="schedule-card">
        <div class="schedule-header morning">
          <h3>Horario de Mañana</h3>
          <span>{{ periodosManana.length }} períodos</span>
        </div>

        <table class="table">
          <thead>
            <tr>
              <th>#</th>
              <th>Inicio</th>
              <th>Fin</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="periodosManana.length === 0">
              <td colspan="3" class="empty">Sin períodos de mañana</td>
            </tr>
            <tr v-for="periodo in periodosManana" :key="periodo.id">
              <td>{{ periodo.numero }}</td>
              <td>{{ periodo.hora_inicio }}</td>
              <td>{{ periodo.hora_fin }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="schedule-card">
        <div class="schedule-header afternoon">
          <h3>Horario de Tarde</h3>
          <span>{{ periodosTarde.length }} períodos</span>
        </div>

        <table class="table">
          <thead>
            <tr>
              <th>#</th>
              <th>Inicio</th>
              <th>Fin</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="periodosTarde.length === 0">
              <td colspan="3" class="empty">Sin períodos de tarde</td>
            </tr>
            <tr v-for="periodo in periodosTarde" :key="periodo.id">
              <td>{{ periodo.numero }}</td>
              <td>{{ periodo.hora_inicio }}</td>
              <td>{{ periodo.hora_fin }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { getPeriodos } from '../services/periodos/periodos.service'

const periodos = ref([])
const loading = ref(false)
const error = ref('')

const periodosManana = computed(() => periodos.value.filter((item) => item.es_manana))
const periodosTarde = computed(() => periodos.value.filter((item) => item.es_tarde))

const loadPeriodos = async () => {
  loading.value = true
  error.value = ''

  try {
    const { data } = await getPeriodos()
    periodos.value = data
  } catch (err) {
    error.value = err?.response?.data?.error || 'Error cargando períodos'
  } finally {
    loading.value = false
  }
}

onMounted(loadPeriodos)
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

.schedules-grid{
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:18px;
}

.schedule-card{
  background:white;
  border-radius:10px;
  overflow:hidden;
  box-shadow:0 3px 10px rgba(0,0,0,0.08);
}

.schedule-header{
  display:flex;
  justify-content:space-between;
  align-items:center;
  padding:12px 14px;
  color:white;
}

.schedule-header h3{
  margin:0;
  font-size:16px;
}

.schedule-header span{
  font-size:12px;
  opacity:0.95;
}

.morning{
  background:#2563eb;
}

.afternoon{
  background:#7c3aed;
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

.empty{
  text-align:center;
}

.empty-state{
  padding:18px;
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
