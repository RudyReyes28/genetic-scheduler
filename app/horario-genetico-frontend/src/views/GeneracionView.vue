<template>
  <div class="page">
    <div class="header-row">
      <div>
        <h1 class="page-title">Generación de Horarios</h1>
        <p class="page-subtitle">
          Ejecución del algoritmo genético y gestión de horarios generados
        </p>
      </div>
    </div>

    <div class="tabs">
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'ejecucion' }"
        @click="activeTab = 'ejecucion'"
      >
        Ejecución
      </button>

      <button
        class="tab-btn"
        :class="{ active: activeTab === 'horarios' }"
        @click="activeTab = 'horarios'"
      >
        Horarios
      </button>
    </div>

    <div v-if="error" class="alert error">{{ error }}</div>
    <div v-if="success" class="alert success">{{ success }}</div>

    <!-- TAB: EJECUCIÓN -->
    <section v-if="activeTab === 'ejecucion'">
      <div class="card">
        <h2 class="section-title">Configurar ejecución</h2>

        <form class="config-grid" @submit.prevent="handleEjecutar">
          <div class="form-group">
            <label>Nombre del horario</label>
            <input v-model="ejecucionForm.nombre" placeholder="Horario Semestre 1 2026" />
          </div>

          <div class="form-group">
            <label>Tamaño población</label>
            <input type="number" v-model.number="ejecucionForm.tamano_poblacion" min="1" />
          </div>

          <div class="form-group">
            <label>Máx. generaciones</label>
            <input type="number" v-model.number="ejecucionForm.max_generaciones" min="1" />
          </div>

          <div class="form-group">
            <label>Método selección</label>
            <select v-model="ejecucionForm.metodo_seleccion">
              <option value="torneo">Torneo</option>
              <option value="ruleta">Ruleta</option>
            </select>
          </div>

          <div class="form-group">
            <label>Método cruce</label>
            <select v-model="ejecucionForm.metodo_cruce">
              <option value="multipunto">Multipunto</option>
              <option value="un_punto">Un punto</option>
            </select>
          </div>

          <div class="form-group">
            <label>Método mutación</label>
            <select v-model="ejecucionForm.metodo_mutacion">
              <option value="intercambio">Intercambio</option>
              <option value="reinsertcion">Reinsertción</option>
            </select>
          </div>

          <div class="form-group">
            <label>Tasa mutación</label>
            <input type="number" step="0.01" v-model.number="ejecucionForm.tasa_mutacion" min="0" />
          </div>

          <div class="form-group">
            <label>Aptitud objetivo</label>
            <input type="number" step="0.01" v-model.number="ejecucionForm.aptitud_objetivo" />
          </div>

          <div class="form-actions">
            <button class="btn-run" type="submit" :disabled="running">
              {{ running ? 'Ejecutando...' : 'Ejecutar Algoritmo' }}
            </button>

            <button class="btn-secondary" type="button" @click="consultarEstado">
              Consultar estado
            </button>
          </div>
        </form>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <span class="stat-label">Corriendo</span>
          <span class="stat-value">{{ estado.corriendo ? 'Sí' : 'No' }}</span>
        </div>

        <div class="stat-card">
          <span class="stat-label">Generación</span>
          <span class="stat-value">{{ estado.generacion ?? 0 }}</span>
        </div>

        <div class="stat-card">
          <span class="stat-label">Mejor aptitud</span>
          <span class="stat-value">{{ estado.mejorAptitud ?? '-' }}</span>
        </div>

        <div class="stat-card">
          <span class="stat-label">Conflictos</span>
          <span class="stat-value">{{ estado.conflictos ?? '-' }}</span>
        </div>

        <div class="stat-card">
          <span class="stat-label">Horario generado</span>
          <span class="stat-value">{{ estado.horarioId ?? '-' }}</span>
        </div>
      </div>

      <div class="card">
        <h2 class="section-title">Evolución del algoritmo</h2>
        <div class="chart-wrapper">
          <canvas ref="chartCanvas"></canvas>
        </div>
      </div>

      <div class="card" v-if="ultimoResultado">
        <h2 class="section-title">Último resultado</h2>
        <div class="report-mini">
          <p><strong>Horario ID:</strong> {{ ultimoResultado.horario_id }}</p>
          <p><strong>Generaciones:</strong> {{ ultimoResultado.stats?.generaciones_ejecutadas }}</p>
          <p><strong>Tiempo (ms):</strong> {{ ultimoResultado.stats?.tiempo_ejecucion_ms }}</p>
          <p><strong>Aptitud final:</strong> {{ ultimoResultado.stats?.aptitud_final }}</p>
          <p><strong>Método selección:</strong> {{ ultimoResultado.stats?.metodo_seleccion }}</p>
          <p><strong>Método cruce:</strong> {{ ultimoResultado.stats?.metodo_cruce }}</p>
          <p><strong>Método mutación:</strong> {{ ultimoResultado.stats?.metodo_mutacion }}</p>
        </div>
      </div>
    </section>

    <!-- TAB: HORARIOS -->
    <section v-if="activeTab === 'horarios'">
      <!-- LISTA -->
      <div v-if="!selectedHorarioMeta" class="card">
        <div class="list-header">
          <h2 class="section-title">Horarios generados</h2>
          <button class="btn-secondary" @click="loadHorarios">Recargar</button>
        </div>

        <div class="table-wrapper">
          <table class="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Fecha</th>
                <th>Aptitud</th>
                <th>Generaciones</th>
                <th>Tiempo</th>
                <th>Activo</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              <tr v-if="loadingHorarios">
                <td colspan="8" class="empty">Cargando horarios...</td>
              </tr>

              <tr v-else-if="horarios.length === 0">
                <td colspan="8" class="empty">No hay horarios generados.</td>
              </tr>

              <tr v-for="horario in horarios" :key="horario.id">
                <td>{{ horario.id }}</td>
                <td>{{ horario.nombre }}</td>
                <td>{{ formatDate(horario.fecha_generacion) }}</td>
                <td>{{ horario.aptitud_final }}</td>
                <td>{{ horario.generaciones_ejecutadas }}</td>
                <td>{{ horario.tiempo_ejecucion_ms }} ms</td>
                <td>
                  <span :class="horario.es_activo ? 'badge active' : 'badge inactive'">
                    {{ horario.es_activo ? 'Sí' : 'No' }}
                  </span>
                </td>
                <td class="actions">
                  <button class="btn-small view" @click="selectHorario(horario)">Ver</button>
                  <button class="btn-small success" @click="handleActivarHorario(horario.id)">Activar</button>
                  <button class="btn-small danger" @click="handleDeleteHorario(horario.id)">Eliminar</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- DETALLE -->
      <div v-if="selectedHorarioMeta" class="card">
        <div class="list-header">
          <h2 class="section-title">Detalle del horario</h2>
          <button class="btn-secondary" @click="volverAListaHorarios">← Volver a horarios</button>
        </div>

        <div class="meta-grid">
          <div><strong>ID:</strong> {{ selectedHorarioMeta.id }}</div>
          <div><strong>Nombre:</strong> {{ selectedHorarioMeta.nombre }}</div>
          <div><strong>Aptitud:</strong> {{ selectedHorarioMeta.aptitud_final }}</div>
          <div><strong>Generaciones:</strong> {{ selectedHorarioMeta.generaciones_ejecutadas }}</div>
          <div><strong>Tiempo:</strong> {{ selectedHorarioMeta.tiempo_ejecucion_ms }} ms</div>
          <div><strong>Activo:</strong> {{ selectedHorarioMeta.es_activo ? 'Sí' : 'No' }}</div>
        </div>

        <div class="filters-grid">
          <div class="form-group">
            <label>Tipo</label>
            <select v-model="horarioFilters.tipo">
              <option value="">Todos</option>
              <option value="cursos">Cursos</option>
              <option value="laboratorios">Laboratorios</option>
            </select>
          </div>

          <div class="form-group">
            <label>Carrera ID</label>
            <input type="number" v-model.number="horarioFilters.carrera_id" />
          </div>

          <div class="form-group">
            <label>Semestre</label>
            <input type="number" v-model.number="horarioFilters.semestre" />
          </div>

          <div class="filter-actions">
            <button class="btn-secondary" @click="loadSelectedHorario">Aplicar filtros</button>
            <button class="btn-secondary" @click="clearHorarioFilters">Limpiar</button>
            <button class="btn-secondary" @click="handleExportCsv">Exportar CSV</button>
            <button class="btn-secondary" @click="handleConflictos">Ver conflictos</button>
            <button class="btn-secondary" @click="handleReporte">Ver reporte</button>
          </div>
        </div>

        <div class="table-wrapper">
          <table class="table details-table">
            <thead>
              <tr>
                <th>Curso</th>
                <th>Semestre</th>
                <th>Código</th>
                <th>Sección</th>
                <th>Docente</th>
                <th>Salón</th>
                <th>Días</th>
                <th>Hora Inicio</th>
                <th>Hora Fin</th>
                <th>Tipo</th>
                <th>Manual</th>
                <th>Acción</th>
              </tr>
            </thead>

            <tbody>
              <tr v-if="loadingSelectedHorario">
                <td colspan="12" class="empty">Cargando detalle...</td>
              </tr>

              <tr v-else-if="horarioDetalles.length === 0">
                <td colspan="12" class="empty">No hay detalles para este horario.</td>
              </tr>

              <tr v-for="detalle in horarioDetalles" :key="detalle.detalle_id">
                <td>{{ detalle.curso_nombre }}</td>
                <td>{{ detalle.semestre }}</td>
                <td>{{ detalle.curso_codigo }}</td>
                <td>{{ detalle.seccion_letra || '-' }}</td>
                <td>{{ detalle.docente_nombre || '-' }}</td>
                <td>{{ detalle.salon_nombre || '-' }}</td>
                <td>{{ detalle.dia_display || '-' }}</td>
                <td>{{ detalle.hora_inicio }}</td>
                <td>{{ detalle.hora_fin }}</td>
                <td>{{ detalle.es_laboratorio ? 'Laboratorio' : 'Curso' }}</td>
                <td>{{ detalle.modificado_manual ? 'Sí' : 'No' }}</td>
                <td>
                  <button class="btn-small edit" @click="openEditDetalle(detalle)">Editar</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <!-- MODAL EDITAR DETALLE -->
    <div v-if="showDetalleModal" class="modal-backdrop">
      <div class="modal">
        <h2>Editar asignación</h2>

        <div class="form-grid">
          <div class="form-group">
            <label>Salón</label>
            <select v-model.number="detalleForm.salon_id">
              <option :value="null">Sin cambio / Ninguno</option>
              <option v-for="salon in salones" :key="salon.id" :value="salon.id">
                {{ salon.nombre }} (ID {{ salon.id }})
              </option>
            </select>
          </div>

          <div class="form-group">
            <label>Docente</label>
            <select v-model.number="detalleForm.docente_id">
              <option :value="null">Sin cambio / Ninguno</option>
              <option v-for="docente in docentes" :key="docente.id" :value="docente.id">
                {{ docente.nombre }} (ID {{ docente.id }})
              </option>
            </select>
          </div>

          <div class="form-group">
            <label>Periodo inicio ID</label>
            <input type="number" v-model.number="detalleForm.periodo_inicio_id" />
          </div>

          <div class="form-group">
            <label>Periodo fin ID</label>
            <input type="number" v-model.number="detalleForm.periodo_fin_id" />
          </div>

          <div class="form-group">
            <label>Día horario ID</label>
            <input type="number" v-model.number="detalleForm.dia_horario_id" />
          </div>
        </div>

        <div class="modal-actions">
          <button class="btn-secondary" @click="closeDetalleModal">Cancelar</button>
          <button class="btn-run" @click="handleSaveDetalle">Guardar cambio</button>
        </div>

        <div v-if="detalleWarnings.length" class="warning-box">
          <h3>Advertencias</h3>
          <ul>
            <li v-for="(item, index) in detalleWarnings" :key="index">
              {{ item.tipo }} - {{ item.descripcion }}
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- MODAL CONFLICTOS -->
    <div v-if="showConflictosModal" class="modal-backdrop">
      <div class="modal">
        <div class="list-header">
          <h2>Conflictos del horario</h2>
          <button class="btn-secondary" @click="closeConflictosModal">Cerrar</button>
        </div>

        <div v-if="conflictosData">
          <p><strong>Aptitud:</strong> {{ conflictosData.aptitud }}</p>
          <p><strong>Total conflictos:</strong> {{ conflictosData.total_conflictos }}</p>
          <p><strong>Total penalización:</strong> {{ conflictosData.total_penalizacion }}</p>
          <p><strong>Total bonos:</strong> {{ conflictosData.total_bonos }}</p>

          <h3>Lista de conflictos</h3>
          <ul class="info-list">
            <li v-for="(item, index) in conflictosData.conflictos || []" :key="`conf-${index}`">
              <strong>{{ item.tipo }}:</strong> {{ item.descripcion }} ({{ item.penalizacion }})
            </li>
          </ul>

          <h3>Bonos</h3>
          <ul class="info-list">
            <li v-for="(item, index) in conflictosData.bonos || []" :key="`bono-${index}`">
              <strong>{{ item.tipo }}:</strong> {{ item.descripcion }} (+{{ item.bono }})
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- MODAL REPORTE -->
    <div v-if="showReporteModal" class="modal-backdrop">
      <div class="modal">
        <div class="list-header">
          <h2>Reporte del horario</h2>
          <button class="btn-secondary" @click="closeReporteModal">Cerrar</button>
        </div>

        <div v-if="reporteData" class="meta-grid">
          <div><strong>Nombre:</strong> {{ reporteData.nombre }}</div>
          <div><strong>Aptitud final:</strong> {{ reporteData.aptitud_final }}</div>
          <div><strong>Generaciones:</strong> {{ reporteData.generaciones_ejecutadas }}</div>
          <div><strong>Tiempo:</strong> {{ reporteData.tiempo_ejecucion_seg }} s</div>
          <div><strong>Selección:</strong> {{ reporteData.metodo_seleccion }}</div>
          <div><strong>Cruce:</strong> {{ reporteData.metodo_cruce }}</div>
          <div><strong>Mutación:</strong> {{ reporteData.metodo_mutacion }}</div>
          <div><strong>Continuidad:</strong> {{ reporteData.porcentaje_continuidad }}%</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  Title,
  CategoryScale,
  Tooltip,
  Legend,
} from 'chart.js'
import { ejecutarAlgoritmo, getEstadoAlgoritmo, getHistorialAlgoritmo } from '../services/algoritmo/algoritmo.service'
import { getDocentes } from '../services/docentes/docentes.service'
import {
  activarHorario,
  deleteHorario,
  getConflictosHorario,
  getHorarioById,
  getHorarios,
  getReporteHorario,
  updateHorarioDetalle,
} from '../services/horarios/horarios.service'
import { getSalones } from '../services/salones/salones.service'

Chart.register(LineController, LineElement, PointElement, LinearScale, Title, CategoryScale, Tooltip, Legend)

const activeTab = ref('ejecucion')
const error = ref('')
const success = ref('')

const ejecucionForm = reactive({
  nombre: '',
  tamano_poblacion: 150,
  max_generaciones: 500,
  metodo_seleccion: 'torneo',
  metodo_cruce: 'multipunto',
  metodo_mutacion: 'reinsertcion',
  tasa_mutacion: 0.08,
  aptitud_objetivo: 0,
})

const estado = ref({
  corriendo: false,
  generacion: 0,
  mejorAptitud: null,
  conflictos: null,
  horarioId: null,
  error: null,
})

const ultimoResultado = ref(null)
const running = ref(false)
const pollingId = ref(null)
const wsInstance = ref(null)
const wsConnected = ref(false)
const wsReconnectTimeoutId = ref(null)

const chartCanvas = ref(null)
let chartInstance = null
const livePoints = ref([])

const horarios = ref([])
const loadingHorarios = ref(false)
const selectedHorarioMeta = ref(null)
const horarioDetalles = ref([])
const loadingSelectedHorario = ref(false)

const conflictosData = ref(null)
const reporteData = ref(null)
const showConflictosModal = ref(false)
const showReporteModal = ref(false)

const horarioFilters = reactive({
  tipo: '',
  carrera_id: null,
  semestre: null,
})

const showDetalleModal = ref(false)
const selectedDetalle = ref(null)
const detalleWarnings = ref([])

const docentes = ref([])
const salones = ref([])

const detalleForm = reactive({
  salon_id: null,
  docente_id: null,
  periodo_inicio_id: null,
  periodo_fin_id: null,
  dia_horario_id: null,
})

const apiBase = import.meta.env.VITE_API_URL

const buildWsUrl = () => {
  const normalizedBase = String(apiBase || '').replace(/\/$/, '')
  const withoutApiSuffix = normalizedBase.replace(/\/api$/, '')
  const url = new URL(withoutApiSuffix)
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
  url.pathname = '/ws/algoritmo'
  url.search = ''
  url.hash = ''
  return url.toString()
}

const resetMessages = () => {
  error.value = ''
  success.value = ''
}

const isTimeoutError = (err) => {
  return err?.code === 'ECONNABORTED' || String(err?.message || '').toLowerCase().includes('timeout')
}

const buildChart = async () => {
  await nextTick()
  if (!chartCanvas.value) return

  if (chartInstance) {
    chartInstance.destroy()
    chartInstance = null
  }

  chartInstance = new Chart(chartCanvas.value, {
    type: 'line',
    data: {
      labels: [],
      datasets: [
        {
          label: 'Mejor Aptitud',
          data: [],
          tension: 0.2,
        },
        {
          label: 'Conflictos',
          data: [],
          tension: 0.2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
        },
      },
    },
  })
}

const updateChartFromLivePoints = () => {
  if (!chartInstance) return

  chartInstance.data.labels = livePoints.value.map((p) => p.generacion)
  chartInstance.data.datasets[0].data = livePoints.value.map((p) => p.mejorAptitud)
  chartInstance.data.datasets[1].data = livePoints.value.map((p) => p.conflictos)
  chartInstance.update()
}

const updateChartFromHistorial = (historial) => {
  if (!chartInstance) return

  chartInstance.data.labels = historial.map((p) => p.generacion)
  chartInstance.data.datasets[0].data = historial.map((p) => p.mejor_aptitud)
  chartInstance.data.datasets[1].data = historial.map((p) => p.conflictos)
  chartInstance.update()
}

const renderCurrentChart = async () => {
  await buildChart()

  if (estado.value?.horarioId && !estado.value?.corriendo) {
    await cargarHistorialFinal(estado.value.horarioId)
    return
  }

  if (livePoints.value.length > 0) {
    updateChartFromLivePoints()
  }
}

const startPolling = () => {
  if (wsConnected.value) return
  stopPolling()

  pollingId.value = window.setInterval(async () => {
    await consultarEstado(true)
  }, 1500)
}

const stopPolling = () => {
  if (pollingId.value) {
    clearInterval(pollingId.value)
    pollingId.value = null
  }
}

const consultarEstado = async (silent = false) => {
  if (!silent) resetMessages()

  try {
    const { data } = await getEstadoAlgoritmo()
    estado.value = data
    running.value = Boolean(data.corriendo)

    if (data.corriendo && !pollingId.value) {
      startPolling()
    }

    if (data.generacion && data.mejorAptitud !== null) {
      const exists = livePoints.value.some((p) => p.generacion === data.generacion)
      if (!exists) {
        livePoints.value.push({
          generacion: data.generacion,
          mejorAptitud: data.mejorAptitud,
          conflictos: data.conflictos,
        })
        updateChartFromLivePoints()
      }
    }

    if (!data.corriendo && data.horarioId) {
      stopPolling()
      await cargarHistorialFinal(data.horarioId)
      await loadHorarios()
    }

    if (!data.corriendo && data.error) {
      stopPolling()
      error.value = data.error
    }
  } catch (err) {
    if (!silent) {
      error.value = err?.response?.data?.error || 'Error consultando estado del algoritmo'
    }
  }
}

const clearWsReconnect = () => {
  if (wsReconnectTimeoutId.value) {
    clearTimeout(wsReconnectTimeoutId.value)
    wsReconnectTimeoutId.value = null
  }
}

const scheduleWsReconnect = () => {
  if (wsReconnectTimeoutId.value || !running.value) return

  wsReconnectTimeoutId.value = window.setTimeout(() => {
    wsReconnectTimeoutId.value = null
    connectAlgoritmoWs()
  }, 2000)
}

const handleWsProgreso = (payload) => {
  if (!payload || typeof payload.generacion !== 'number') return

  estado.value = {
    ...estado.value,
    corriendo: true,
    generacion: payload.generacion,
    mejorAptitud: payload.mejorAptitud ?? estado.value.mejorAptitud,
    conflictos: payload.conflictos ?? estado.value.conflictos,
  }

  running.value = true

  const exists = livePoints.value.some((point) => point.generacion === payload.generacion)
  if (!exists) {
    livePoints.value.push({
      generacion: payload.generacion,
      mejorAptitud: payload.mejorAptitud,
      conflictos: payload.conflictos,
    })
    updateChartFromLivePoints()
  }
}

const handleWsEstado = async (payload) => {
  if (!payload) return

  estado.value = payload
  running.value = Boolean(payload.corriendo)

  if (!payload.corriendo && payload.horarioId) {
    await cargarHistorialFinal(payload.horarioId)
    await loadHorarios()
  }

  if (!payload.corriendo && payload.error) {
    error.value = payload.error
  }
}

const connectAlgoritmoWs = () => {
  clearWsReconnect()

  try {
    const ws = new WebSocket(buildWsUrl())
    wsInstance.value = ws

    ws.onopen = () => {
      wsConnected.value = true
      stopPolling()
    }

    ws.onmessage = async (event) => {
      let data
      try {
        data = JSON.parse(event.data)
      } catch {
        return
      }

      if (data?.type === 'progreso') {
        handleWsProgreso(data.payload)
        return
      }

      if (data?.type === 'estado') {
        await handleWsEstado(data.payload)
        return
      }

      if (data?.type === 'error' && data?.payload?.message) {
        error.value = data.payload.message
      }
    }

    ws.onclose = () => {
      wsConnected.value = false
      wsInstance.value = null

      if (running.value) {
        startPolling()
        scheduleWsReconnect()
      }
    }

    ws.onerror = () => {
      ws.close()
    }
  } catch {
    wsConnected.value = false
    if (running.value) {
      startPolling()
      scheduleWsReconnect()
    }
  }
}

const closeAlgoritmoWs = () => {
  clearWsReconnect()
  wsConnected.value = false

  if (wsInstance.value) {
    wsInstance.value.close()
    wsInstance.value = null
  }
}

const cargarHistorialFinal = async (horarioId) => {
  try {
    const { data } = await getHistorialAlgoritmo(horarioId)
    if (Array.isArray(data)) {
      updateChartFromHistorial(data)
    }
  } catch (err) {
    error.value = err?.response?.data?.error || 'Error cargando historial del algoritmo'
  }
}

const handleEjecutar = async () => {
  resetMessages()
  detalleWarnings.value = []
  conflictosData.value = null
  reporteData.value = null
  showConflictosModal.value = false
  showReporteModal.value = false
  livePoints.value = []
  updateChartFromLivePoints()

  try {
    running.value = true
    startPolling()
    const payload = { ...ejecucionForm }
    const { data } = await ejecutarAlgoritmo(payload)

    ultimoResultado.value = data
    success.value = 'Algoritmo ejecutado correctamente'
    estado.value = {
      corriendo: false,
      generacion: data?.stats?.generaciones_ejecutadas ?? 0,
      mejorAptitud: data?.stats?.aptitud_final ?? null,
      conflictos: data?.historial_resumen?.ultima_generacion?.conflictos ?? null,
      horarioId: data?.horario_id ?? null,
      error: null,
    }

    if (data?.horario_id) {
      await cargarHistorialFinal(data.horario_id)
      await loadHorarios()
      activeTab.value = 'horarios'
    }

    running.value = false
    stopPolling()
  } catch (err) {
    if (isTimeoutError(err)) {
      success.value = 'Ejecución iniciada. El proceso sigue corriendo en segundo plano; actualizando estado...'
      running.value = true
      startPolling()
      return
    }

    error.value = err?.response?.data?.error || 'Error ejecutando el algoritmo'
    running.value = false
    stopPolling()
  }
}

const loadHorarios = async () => {
  loadingHorarios.value = true

  try {
    const { data } = await getHorarios()
    horarios.value = Array.isArray(data) ? data : []
  } catch (err) {
    error.value = err?.response?.data?.error || 'Error cargando horarios'
  } finally {
    loadingHorarios.value = false
  }
}

const loadCatalogos = async () => {
  try {
    const [docentesRes, salonesRes] = await Promise.all([
      getDocentes(),
      getSalones(),
    ])

    docentes.value = Array.isArray(docentesRes.data) ? docentesRes.data : []
    salones.value = Array.isArray(salonesRes.data) ? salonesRes.data : []
  } catch (err) {
    error.value = err?.response?.data?.error || 'Error cargando docentes y salones'
  }
}

const selectHorario = async (horario) => {
  selectedHorarioMeta.value = horario
  conflictosData.value = null
  reporteData.value = null
  showConflictosModal.value = false
  showReporteModal.value = false
  await loadSelectedHorario()
}

const volverAListaHorarios = () => {
  selectedHorarioMeta.value = null
  horarioDetalles.value = []
  conflictosData.value = null
  reporteData.value = null
  showConflictosModal.value = false
  showReporteModal.value = false
}

const buildHorarioParams = () => {
  const params = {}
  if (horarioFilters.tipo) params.tipo = horarioFilters.tipo
  if (horarioFilters.carrera_id) params.carrera_id = horarioFilters.carrera_id
  if (horarioFilters.semestre) params.semestre = horarioFilters.semestre
  return params
}

const loadSelectedHorario = async () => {
  if (!selectedHorarioMeta.value) return

  loadingSelectedHorario.value = true

  try {
    const { data } = await getHorarioById(selectedHorarioMeta.value.id, buildHorarioParams())
    selectedHorarioMeta.value = data.horario
    horarioDetalles.value = Array.isArray(data.detalles) ? data.detalles : []
  } catch (err) {
    error.value = err?.response?.data?.error || 'Error cargando detalle del horario'
  } finally {
    loadingSelectedHorario.value = false
  }
}

const clearHorarioFilters = async () => {
  horarioFilters.tipo = ''
  horarioFilters.carrera_id = null
  horarioFilters.semestre = null
  await loadSelectedHorario()
}

const handleConflictos = async () => {
  if (!selectedHorarioMeta.value) return
  resetMessages()

  try {
    const { data } = await getConflictosHorario(selectedHorarioMeta.value.id)
    conflictosData.value = data
    showConflictosModal.value = true
  } catch (err) {
    error.value = err?.response?.data?.error || 'Error obteniendo conflictos'
  }
}

const closeConflictosModal = () => {
  showConflictosModal.value = false
}

const handleReporte = async () => {
  if (!selectedHorarioMeta.value) return
  resetMessages()

  try {
    const { data } = await getReporteHorario(selectedHorarioMeta.value.id)
    reporteData.value = data
    showReporteModal.value = true
  } catch (err) {
    error.value = err?.response?.data?.error || 'Error obteniendo reporte'
  }
}

const closeReporteModal = () => {
  showReporteModal.value = false
}

const handleActivarHorario = async (id) => {
  const ok = confirm(`¿Activar el horario ${id} como oficial?`)
  if (!ok) return

  resetMessages()

  try {
    const { data } = await activarHorario(id)
    success.value = data.mensaje || 'Horario activado correctamente'
    await loadHorarios()

    if (selectedHorarioMeta.value?.id === id) {
      await loadSelectedHorario()
    }
  } catch (err) {
    error.value = err?.response?.data?.error || 'Error activando horario'
  }
}

const handleDeleteHorario = async (id) => {
  const ok = confirm(`¿Eliminar el horario ${id}?`)
  if (!ok) return

  resetMessages()

  try {
    const { data } = await deleteHorario(id)
    success.value = data.mensaje || 'Horario eliminado correctamente'

    if (selectedHorarioMeta.value?.id === id) {
      volverAListaHorarios()
    }

    await loadHorarios()
  } catch (err) {
    error.value = err?.response?.data?.error || 'Error eliminando horario'
  }
}

const buildExportUrl = () => {
  if (!selectedHorarioMeta.value) return '#'

  const url = new URL(`${apiBase}/horarios/${selectedHorarioMeta.value.id}/exportar/csv`)
  const params = buildHorarioParams()

  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value)
  })

  return url.toString()
}

const handleExportCsv = () => {
  if (!selectedHorarioMeta.value) return
  window.open(buildExportUrl(), '_blank')
}

const openEditDetalle = (detalle) => {
  selectedDetalle.value = detalle
  detalleWarnings.value = []

  detalleForm.salon_id = detalle.salon_id ?? null
  detalleForm.docente_id = detalle.docente_id ?? null
  detalleForm.periodo_inicio_id = detalle.periodo_inicio_id ?? null
  detalleForm.periodo_fin_id = detalle.periodo_fin_id ?? null
  detalleForm.dia_horario_id = detalle.dia_horario_id ?? null

  showDetalleModal.value = true
}

const closeDetalleModal = () => {
  showDetalleModal.value = false
  selectedDetalle.value = null
  detalleWarnings.value = []
}

const buildDetallePayload = () => {
  const payload = {}

  if (detalleForm.salon_id !== null && detalleForm.salon_id !== undefined) {
    payload.salon_id = detalleForm.salon_id
  }

  if (detalleForm.docente_id !== null && detalleForm.docente_id !== undefined) {
    payload.docente_id = detalleForm.docente_id
  }

  if (detalleForm.periodo_inicio_id !== null && detalleForm.periodo_inicio_id !== undefined) {
    payload.periodo_inicio_id = detalleForm.periodo_inicio_id
  }

  if (detalleForm.periodo_fin_id !== null && detalleForm.periodo_fin_id !== undefined) {
    payload.periodo_fin_id = detalleForm.periodo_fin_id
  }

  if (detalleForm.dia_horario_id !== null && detalleForm.dia_horario_id !== undefined) {
    payload.dia_horario_id = detalleForm.dia_horario_id
  }

  return payload
}

const handleSaveDetalle = async () => {
  if (!selectedHorarioMeta.value || !selectedDetalle.value) return

  resetMessages()

  try {
    const { data } = await updateHorarioDetalle(
      selectedHorarioMeta.value.id,
      selectedDetalle.value.detalle_id,
      buildDetallePayload()
    )

    success.value = data.mensaje || 'Cambio guardado correctamente'
    detalleWarnings.value = Array.isArray(data.advertencias) ? data.advertencias : []
    await loadSelectedHorario()
  } catch (err) {
    error.value = err?.response?.data?.error || 'Error guardando cambio manual'
  }
}

const formatDate = (value) => {
  if (!value) return '-'
  try {
    return new Date(value).toLocaleString()
  } catch {
    return value
  }
}

onMounted(async () => {
  connectAlgoritmoWs()
  await buildChart()
  await consultarEstado(true)
  await loadHorarios()
  await loadCatalogos()
  await renderCurrentChart()
})

watch(activeTab, async (value) => {
  resetMessages()

  if (value === 'ejecucion') {
    await consultarEstado(true)
    await nextTick()
    await renderCurrentChart()
  }

  if (value === 'horarios') {
    await loadHorarios()
  }
})

onBeforeUnmount(() => {
  closeAlgoritmoWs()
  stopPolling()
  if (chartInstance) {
    chartInstance.destroy()
  }
})
</script>

<style scoped>
.tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.tab-btn {
  border: none;
  background: #e5e7eb;
  color: #111827;
  padding: 10px 14px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}

.tab-btn.active {
  background: #2563eb;
  color: white;
}

.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18px;
}

.card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 18px;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.08);
  width: 100%;
}

.section-title {
  margin: 0 0 14px 0;
  font-size: 18px;
  font-weight: 700;
  color: #111827;
}

.config-grid,
.filters-grid,
.form-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group input,
.form-group select {
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
}

.form-actions,
.filter-actions,
.modal-actions {
  grid-column: 1 / -1;
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  flex-wrap: wrap;
}

.btn-run {
  background: #16a34a;
  color: white;
  border: none;
  padding: 10px 18px;
  border-radius: 6px;
  cursor: pointer;
}

.btn-run:hover {
  background: #15803d;
}

.btn-run:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-secondary {
  background: #e5e7eb;
  color: #111827;
  border: none;
  padding: 10px 14px;
  border-radius: 6px;
  cursor: pointer;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 14px;
  margin-bottom: 18px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.08);
}

.stat-label {
  display: block;
  color: #6b7280;
  font-size: 13px;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 22px;
  font-weight: 700;
  color: #111827;
}

.chart-wrapper {
  height: 360px;
}

.table-wrapper {
  width: 100%;
  overflow-x: auto;
}

.table {
  width: 100%;
  border-collapse: collapse;
  min-width: 1200px;
}

th,
td {
  padding: 12px;
  border-bottom: 1px solid #e5e7eb;
  text-align: left;
}

th {
  background: #f3f4f6;
}

.details-table {
  margin-top: 16px;
  min-width: 1150px;
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
  color: white;
  cursor: pointer;
  font-size: 13px;
}

.view {
  background: #2563eb;
}

.edit {
  background: #f59e0b;
}

.success {
  background: #16a34a;
}

.danger {
  background: #dc2626;
}

.badge {
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}

.active {
  background: #dcfce7;
  color: #166534;
}

.inactive {
  background: #fee2e2;
  color: #991b1b;
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

.empty {
  text-align: center;
  color: #6b7280;
}

.meta-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.report-mini p,
.info-list li {
  margin: 6px 0;
}

.info-list {
  padding-left: 18px;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  z-index: 60;
}

.modal {
  background: white;
  border-radius: 12px;
  padding: 24px;
  width: min(900px, 100%);
  max-height: 90vh;
  overflow: auto;
}

.warning-box {
  margin-top: 16px;
  background: #fff7ed;
  border: 1px solid #fdba74;
  border-radius: 10px;
  padding: 14px;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.page {
  width: 110%;
  max-width: 1800px;
  margin: 0 auto;
  padding: 20px 30px;
}

@media (max-width: 1100px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .config-grid,
  .filters-grid,
  .form-grid,
  .meta-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 700px) {
  .stats-grid,
  .config-grid,
  .filters-grid,
  .form-grid,
  .meta-grid {
    grid-template-columns: 1fr;
  }

  .tabs,
  .header-row,
  .list-header {
    flex-direction: column;
    align-items: stretch;
  }

}
</style>

