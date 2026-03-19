<template>
  <div class="page page-reportes">
    <div class="header-row">
      <div>
        <h1 class="page-title">Reportes</h1>
        <p class="page-subtitle">
          Análisis de horarios generados, conflictos, continuidad y desempeño del algoritmo
        </p>
      </div>
    </div>

    <div v-if="error" class="alert error">{{ error }}</div>
    <div v-if="success" class="alert success">{{ success }}</div>

    <!-- LISTA PRINCIPAL -->
    <section v-if="!selectedHorarioId">
      <div class="card">
        <div class="card-header">
          <h2 class="section-title">Horarios generados</h2>

          <div class="header-actions">
            <button class="btn-secondary" @click="loadHorarios">Recargar</button>
            <button class="btn-secondary" @click="exportHorariosCsv">Exportar CSV</button>
            <button class="btn-secondary" @click="exportHorariosPdf">Exportar PDF</button>
          </div>
        </div>

        <div class="filters-grid main-filters-grid">
          <div class="form-group">
            <label>ID horario</label>
            <select v-model="listFilters.id">
              <option value="">Todos</option>
              <option v-for="item in horarioIdOptions" :key="item" :value="String(item)">
                {{ item }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label>Activo</label>
            <select v-model="listFilters.activo">
              <option value="">Todos</option>
              <option value="true">Sí</option>
              <option value="false">No</option>
            </select>
          </div>

          <div class="form-group">
            <label>Método selección</label>
            <select v-model="listFilters.metodo_seleccion">
              <option value="">Todos</option>
              <option
                v-for="item in metodoSeleccionOptions"
                :key="item"
                :value="item"
              >
                {{ item }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label>Método cruce</label>
            <select v-model="listFilters.metodo_cruce">
              <option value="">Todos</option>
              <option
                v-for="item in metodoCruceOptions"
                :key="item"
                :value="item"
              >
                {{ item }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label>Método mutación</label>
            <select v-model="listFilters.metodo_mutacion">
              <option value="">Todos</option>
              <option
                v-for="item in metodoMutacionOptions"
                :key="item"
                :value="item"
              >
                {{ item }}
              </option>
            </select>
          </div>

          <div class="filter-actions">
            <button class="btn-secondary" @click="clearListFilters">Limpiar filtros</button>
          </div>
        </div>

        <div class="table-wrapper">
          <table class="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Fecha</th>
                <th>Aptitud final</th>
                <th>Generaciones</th>
                <th>Tiempo</th>
                <th>Selección</th>
                <th>Cruce</th>
                <th>Mutación</th>
                <th>Activo</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              <tr v-if="loadingHorarios">
                <td colspan="11" class="empty">Cargando horarios...</td>
              </tr>

              <tr v-else-if="filteredHorarios.length === 0">
                <td colspan="11" class="empty">No hay horarios que coincidan con los filtros.</td>
              </tr>

              <tr v-for="horario in filteredHorarios" :key="horario.id">
                <td>{{ horario.id }}</td>
                <td>{{ horario.nombre }}</td>
                <td>{{ formatDate(horario.fecha_generacion) }}</td>
                <td>{{ horario.aptitud_final }}</td>
                <td>{{ horario.generaciones_ejecutadas }}</td>
                <td>{{ formatMs(horario.tiempo_ejecucion_ms) }}</td>
                <td>{{ horario.metodo_seleccion }}</td>
                <td>{{ horario.metodo_cruce }}</td>
                <td>{{ horario.metodo_mutacion }}</td>
                <td>
                  <span :class="horario.es_activo ? 'badge active' : 'badge inactive'">
                    {{ horario.es_activo ? 'Sí' : 'No' }}
                  </span>
                </td>
                <td class="actions">
                  <button class="btn-small view" @click="openHorario(horario)">
                    Ver horario
                  </button>
                  <button class="btn-small warn" @click="openConflictos(horario)">
                    Ver conflictos
                  </button>
                  <button class="btn-small success" @click="openReporte(horario)">
                    Ver reporte
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="summary-grid">
        <div class="summary-card">
          <span class="summary-label">Total horarios</span>
          <span class="summary-value">{{ filteredHorarios.length }}</span>
        </div>

        <div class="summary-card">
          <span class="summary-label">Conflictos finales acumulados</span>
          <span class="summary-value">{{ resumenGlobal.totalConflictosFinales }}</span>
        </div>

        <div class="summary-card">
          <span class="summary-label">Conflictos en todas las generaciones</span>
          <span class="summary-value">{{ resumenGlobal.totalConflictosGeneraciones }}</span>
        </div>

        <div class="summary-card">
          <span class="summary-label">Total generaciones acumuladas</span>
          <span class="summary-value">{{ resumenGlobal.totalGeneraciones }}</span>
        </div>

        <div class="summary-card">
          <span class="summary-label">Tiempo total</span>
          <span class="summary-value">{{ formatMs(resumenGlobal.tiempoTotalMs) }}</span>
        </div>

        <div class="summary-card">
          <span class="summary-label">Promedio continuidad</span>
          <span class="summary-value">{{ resumenGlobal.promedioContinuidad }}%</span>
        </div>

        <div class="summary-card">
          <span class="summary-label">Mejor aptitud encontrada</span>
          <span class="summary-value">{{ resumenGlobal.mejorAptitud }}</span>
        </div>

        <div class="summary-card">
          <span class="summary-label">Promedio iteración estable</span>
          <span class="summary-value">{{ resumenGlobal.promedioIteracionEstable }}</span>
        </div>
      </div>

      <div class="card" v-if="filteredHorarios.length > 0">
        <h2 class="section-title">Resumen general</h2>
        <p class="info-line">
          Horario con mejor aptitud:
          <strong>{{ resumenGlobal.mejorHorarioNombre }}</strong>
        </p>
        <p class="info-line">
          Horario activo actual:
          <strong>{{ resumenGlobal.horarioActivoNombre }}</strong>
        </p>
      </div>
    </section>

    <!-- VISTA HORARIO -->
    <section v-else-if="selectedView === 'horario'">
      <div class="card">
        <div class="card-header">
          <h2 class="section-title">Detalle del horario</h2>

          <div class="header-actions">
            <button class="btn-secondary" @click="goBack">← Volver a horarios</button>
            <button class="btn-secondary" @click="exportHorarioCsv">Exportar CSV</button>
            <button class="btn-secondary" @click="exportHorarioPdf">Exportar PDF</button>
          </div>
        </div>

        <div class="meta-grid" v-if="selectedHorario">
          <div><strong>ID:</strong> {{ selectedHorario.id }}</div>
          <div><strong>Nombre:</strong> {{ selectedHorario.nombre }}</div>
          <div><strong>Fecha:</strong> {{ formatDate(selectedHorario.fecha_generacion) }}</div>
          <div><strong>Aptitud final:</strong> {{ selectedHorario.aptitud_final }}</div>
          <div><strong>Generaciones:</strong> {{ selectedHorario.generaciones_ejecutadas }}</div>
          <div><strong>Tiempo:</strong> {{ formatMs(selectedHorario.tiempo_ejecucion_ms) }}</div>
          <div><strong>Selección:</strong> {{ selectedHorario.metodo_seleccion }}</div>
          <div><strong>Cruce:</strong> {{ selectedHorario.metodo_cruce }}</div>
          <div><strong>Mutación:</strong> {{ selectedHorario.metodo_mutacion }}</div>
          <div><strong>Activo:</strong> {{ selectedHorario.es_activo ? 'Sí' : 'No' }}</div>
          <div><strong>Total asignaciones:</strong> {{ filteredHorarioDetalles.length }}</div>
          <div><strong>Semestres presentes:</strong> {{ semestresPresentes }}</div>
        </div>

        <div class="filters-grid">
          <div class="form-group">
            <label>Tipo</label>
            <select v-model="detailFilters.tipo">
              <option value="">Todos</option>
              <option value="cursos">Cursos</option>
              <option value="laboratorios">Laboratorios</option>
            </select>
          </div>

          <div class="form-group">
            <label>Carrera</label>
            <select v-model="detailFilters.carrera_id">
              <option value="">Todas</option>
              <option
                v-for="item in detalleCarreraOptions"
                :key="item.value"
                :value="String(item.value)"
              >
                {{ item.label }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label>Semestre</label>
            <select v-model="detailFilters.semestre">
              <option value="">Todos</option>
              <option v-for="item in detalleSemestreOptions" :key="item" :value="String(item)">
                {{ item }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label>Docente</label>
            <select v-model="detailFilters.docente_nombre">
              <option value="">Todos</option>
              <option v-for="item in detalleDocenteOptions" :key="item" :value="item">
                {{ item }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label>Salón</label>
            <select v-model="detailFilters.salon_nombre">
              <option value="">Todos</option>
              <option v-for="item in detalleSalonOptions" :key="item" :value="item">
                {{ item }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label>Día</label>
            <select v-model="detailFilters.dia">
              <option value="">Todos</option>
              <option v-for="item in detalleDiaOptions" :key="item" :value="item">
                {{ item }}
              </option>
            </select>
          </div>

          <div class="filter-actions">
            <button class="btn-secondary" @click="clearDetailFilters">Limpiar filtros</button>
          </div>
        </div>

        <div class="chips-row" v-if="docentesPresentes.length">
          <span class="chip-title">Docentes:</span>
          <span class="chip" v-for="docente in docentesPresentes" :key="docente">
            {{ docente }}
          </span>
        </div>

        <div class="chips-row" v-if="salonesPresentes.length">
          <span class="chip-title">Salones:</span>
          <span class="chip" v-for="salon in salonesPresentes" :key="salon">
            {{ salon }}
          </span>
        </div>

        <h3 class="subsection-title">Listado del horario</h3>

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
                <th>Hora inicio</th>
                <th>Hora fin</th>
                <th>Tipo</th>
              </tr>
            </thead>

            <tbody>
              <tr v-if="loadingDetalle">
                <td colspan="10" class="empty">Cargando horario...</td>
              </tr>

              <tr v-else-if="filteredHorarioDetalles.length === 0">
                <td colspan="10" class="empty">No hay asignaciones para mostrar.</td>
              </tr>

              <tr v-for="detalle in filteredHorarioDetalles" :key="detalle.detalle_id">
                <td>{{ detalle.curso_nombre }}</td>
                <td>{{ detalle.semestre }}</td>
                <td>{{ detalle.curso_codigo }}</td>
                <td>{{ detalle.seccion_letra || '-' }}</td>
                <td>{{ detalle.docente_nombre || '-' }}</td>
                <td>{{ detalle.salon_nombre || '-' }}</td>
                <td>{{ detalle.dia_display || detalle.dias_nombre || '-' }}</td>
                <td>{{ detalle.hora_inicio }}</td>
                <td>{{ detalle.hora_fin }}</td>
                <td>{{ detalle.es_laboratorio ? 'Laboratorio' : 'Curso' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <!-- VISTA CONFLICTOS -->
    <section v-else-if="selectedView === 'conflictos'">
      <div class="card">
        <div class="card-header">
          <h2 class="section-title">Conflictos del horario</h2>

          <div class="header-actions">
            <button class="btn-secondary" @click="goBack">← Volver a horarios</button>
            <button class="btn-secondary" @click="exportConflictosCsv">Exportar CSV</button>
            <button class="btn-secondary" @click="exportConflictosPdf">Exportar PDF</button>
          </div>
        </div>

        <div class="meta-grid" v-if="conflictosData">
          <div><strong>Aptitud:</strong> {{ conflictosData.aptitud }}</div>
          <div><strong>Total conflictos:</strong> {{ conflictosData.total_conflictos }}</div>
          <div><strong>Total penalización:</strong> {{ conflictosData.total_penalizacion }}</div>
          <div><strong>Total bonos:</strong> {{ conflictosData.total_bonos }}</div>
        </div>

        <h3 class="subsection-title">Listado de conflictos</h3>
        <div class="two-columns">
          <div class="subcard">
            <h4 class="tab-section-title">Lista de conflictos</h4>
            <div class="table-wrapper">
              <table class="table">
                <thead>
                  <tr>
                    <th>Tipo</th>
                    <th>Descripción</th>
                    <th>Penalización</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="!conflictosData?.conflictos?.length">
                    <td colspan="3" class="empty">No hay conflictos.</td>
                  </tr>
                  <tr v-for="(item, index) in conflictosData?.conflictos || []" :key="index">
                    <td>{{ item.tipo }}</td>
                    <td>{{ item.descripcion }}</td>
                    <td>{{ item.penalizacion }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="subcard">
            <h4 class="tab-section-title">Listado de bonos</h4>
            <div class="table-wrapper">
              <table class="table">
                <thead>
                  <tr>
                    <th>Tipo</th>
                    <th>Descripción</th>
                    <th>Bono</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="!conflictosData?.bonos?.length">
                    <td colspan="3" class="empty">No hay bonos.</td>
                  </tr>
                  <tr v-for="(item, index) in conflictosData?.bonos || []" :key="index">
                    <td>{{ item.tipo }}</td>
                    <td>{{ item.descripcion }}</td>
                    <td>+{{ item.bono }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- VISTA REPORTE -->
    <section v-else-if="selectedView === 'reporte'">
      <div class="card">
        <div class="card-header">
          <h2 class="section-title">Reporte completo del horario</h2>
            <br>
          <p class="warning-text">
            Para que se pueda exportar la gráfica en PDF, primero debes entrar a la pestaña
            <strong>Historial por generación</strong>.
          </p>
          <div class="header-actions">
            <button class="btn-secondary" @click="goBack">← Volver a horarios</button>
            <button class="btn-secondary" @click="exportReporteGeneralCsv">Exportar CSV general</button>
            <button class="btn-secondary" @click="openPdfExportModal">Exportar PDF</button>
          </div>
        </div>

        <div class="summary-grid summary-grid-report" v-if="reporteData">
          <div class="summary-card">
            <span class="summary-label">Aptitud final</span>
            <span class="summary-value">{{ reporteData.aptitud_final }}</span>
          </div>

          <div class="summary-card">
            <span class="summary-label">Total conflictos</span>
            <span class="summary-value">{{ reporteData.total_conflictos }}</span>
          </div>

          <div class="summary-card">
            <span class="summary-label">Generaciones</span>
            <span class="summary-value">{{ reporteData.generaciones_ejecutadas }}</span>
          </div>

          <div class="summary-card">
            <span class="summary-label">Tiempo</span>
            <span class="summary-value">{{ reporteData.tiempo_ejecucion_seg }} s</span>
          </div>

          <div class="summary-card">
            <span class="summary-label">Continuidad</span>
            <span class="summary-value">{{ reporteData.porcentaje_continuidad }}%</span>
          </div>

          <div class="summary-card">
            <span class="summary-label">Iteración de estabilización</span>
            <span class="summary-value">{{ iteracionEstable }}</span>
          </div>
        </div>

        <div class="meta-grid" v-if="reporteData">
          <div><strong>Horario:</strong> {{ reporteData.nombre }}</div>
          <div><strong>Fecha:</strong> {{ formatDate(reporteData.fecha_generacion) }}</div>
          <div><strong>Método selección:</strong> {{ reporteData.metodo_seleccion }}</div>
          <div><strong>Método cruce:</strong> {{ reporteData.metodo_cruce }}</div>
          <div><strong>Método mutación:</strong> {{ reporteData.metodo_mutacion }}</div>
          <div><strong>Tiempo ms:</strong> {{ reporteData.tiempo_ejecucion_ms }}</div>
          <div><strong>Memoria RSS:</strong> {{ reporteData.memoria_mb?.rss }} MB</div>
          <div><strong>Heap total:</strong> {{ reporteData.memoria_mb?.heap_total }} MB</div>
          <div><strong>Heap usado:</strong> {{ reporteData.memoria_mb?.heap_usado }} MB</div>
        </div>

        <div class="report-tabs">
          <button
            class="report-tab-btn"
            :class="{ active: reportTab === 'conflictosTipo' }"
            @click="reportTab = 'conflictosTipo'"
          >
            Conflictos por tipo
          </button>

          <button
            class="report-tab-btn"
            :class="{ active: reportTab === 'listaConflictos' }"
            @click="reportTab = 'listaConflictos'"
          >
            Lista de conflictos
          </button>

          <button
            class="report-tab-btn"
            :class="{ active: reportTab === 'historial' }"
            @click="reportTab = 'historial'"
          >
            Historial por generación
          </button>
        </div>

        <div v-if="reportTab === 'conflictosTipo'" class="subcard">
          <div class="subcard-header">
            <h3 class="tab-section-title">Listado de conflictos por tipo</h3>
            <button class="btn-secondary" @click="exportConflictosTipoCsv">
              Exportar CSV
            </button>
          </div>

          <div class="table-wrapper">
            <table class="table">
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Cantidad</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!conflictosPorTipoArray.length">
                  <td colspan="2" class="empty">No hay datos.</td>
                </tr>
                <tr v-for="item in conflictosPorTipoArray" :key="item.tipo">
                  <td>{{ item.tipo }}</td>
                  <td>{{ item.cantidad }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div v-if="reportTab === 'listaConflictos'" class="subcard">
          <div class="subcard-header">
            <h3 class="tab-section-title">Listado de conflictos del reporte</h3>
            <button class="btn-secondary" @click="exportListaConflictosReporteCsv">
              Exportar CSV
            </button>
          </div>

          <div class="table-wrapper">
            <table class="table">
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Descripción</th>
                  <th>Penalización</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!reporteData?.lista_conflictos?.length">
                  <td colspan="3" class="empty">No hay conflictos.</td>
                </tr>
                <tr v-for="(item, index) in reporteData?.lista_conflictos || []" :key="index">
                  <td>{{ item.tipo }}</td>
                  <td>{{ item.descripcion }}</td>
                  <td>{{ item.penalizacion }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div v-if="reportTab === 'historial'" class="subcard">
          <div class="subcard-header">
            <h3 class="tab-section-title">Historial por generación</h3>
            <button class="btn-secondary" @click="exportHistorialCsv">
              Exportar CSV
            </button>
          </div>

          <div class="chart-wrapper report-chart-wrapper">
            <canvas ref="reportChartCanvas"></canvas>
          </div>

          <div class="table-wrapper historial-table-wrapper">
            <table class="table">
              <thead>
                <tr>
                  <th>Generación</th>
                  <th>Mejor aptitud</th>
                  <th>Conflictos</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!reporteData?.historial?.length">
                  <td colspan="3" class="empty">No hay historial.</td>
                </tr>
                <tr v-for="item in reporteData?.historial || []" :key="item.generacion">
                  <td>{{ item.generacion }}</td>
                  <td>{{ item.mejor_aptitud }}</td>
                  <td>{{ item.conflictos }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>

    <!-- MODAL EXPORTAR PDF -->
    <div v-if="showPdfExportModal" class="modal-backdrop">
      <div class="modal">
        <h2>Selecciona qué incluir en el PDF</h2>

        <div class="checkbox-list">
          <label class="checkbox-item">
            <input v-model="pdfOptions.includeGeneral" type="checkbox" />
            Resumen general
          </label>

          <label class="checkbox-item">
            <input v-model="pdfOptions.includeConflictosTipo" type="checkbox" />
            Listado de conflictos por tipo
          </label>

          <label class="checkbox-item">
            <input v-model="pdfOptions.includeListaConflictos" type="checkbox" />
            Listado de conflictos
          </label>

          <label class="checkbox-item">
            <input v-model="pdfOptions.includeHistorial" type="checkbox" />
            Historial por generación
          </label>

          <label class="checkbox-item">
            <input v-model="pdfOptions.includeGrafica" type="checkbox" />
            Gráfica
          </label>
        </div>

        <div class="modal-actions">
          <button class="btn-secondary" @click="closePdfExportModal">Cancelar</button>
          <button class="btn-primary" @click="exportReportePdfSeleccionado">Exportar PDF</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
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
import {
  getConflictosHorario,
  getHorarioById,
  getHorarios,
  getReporteHorario,
} from '../services/horarios/horarios.service'

Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  Title,
  CategoryScale,
  Tooltip,
  Legend
)

const horarios = ref([])
const loadingHorarios = ref(false)
const error = ref('')
const success = ref('')

const selectedHorarioId = ref(null)
const selectedView = ref('')
const reportTab = ref('conflictosTipo')

const selectedHorario = ref(null)
const horarioDetallesBase = ref([])
const conflictosData = ref(null)
const reporteData = ref(null)

const loadingDetalle = ref(false)

const reportChartCanvas = ref(null)
let reportChartInstance = null

const reportesCache = ref({})

const showPdfExportModal = ref(false)
const pdfOptions = ref({
  includeGeneral: true,
  includeConflictosTipo: true,
  includeListaConflictos: true,
  includeHistorial: true,
  includeGrafica: true,
})

const listFilters = ref({
  id: '',
  activo: '',
  metodo_seleccion: '',
  metodo_cruce: '',
  metodo_mutacion: '',
})

const detailFilters = ref({
  tipo: '',
  carrera_id: '',
  semestre: '',
  docente_nombre: '',
  salon_nombre: '',
  dia: '',
})

const filteredHorarios = computed(() => {
  return horarios.value.filter((item) => {
    const matchesId = !listFilters.value.id || String(item.id) === String(listFilters.value.id)
    const matchesActivo =
      listFilters.value.activo === ''
        ? true
        : String(item.es_activo) === listFilters.value.activo
    const matchesSeleccion =
      !listFilters.value.metodo_seleccion ||
      item.metodo_seleccion === listFilters.value.metodo_seleccion
    const matchesCruce =
      !listFilters.value.metodo_cruce ||
      item.metodo_cruce === listFilters.value.metodo_cruce
    const matchesMutacion =
      !listFilters.value.metodo_mutacion ||
      item.metodo_mutacion === listFilters.value.metodo_mutacion

    return (
      matchesId &&
      matchesActivo &&
      matchesSeleccion &&
      matchesCruce &&
      matchesMutacion
    )
  })
})

const filteredHorarioDetalles = computed(() => {
  return horarioDetallesBase.value.filter((item) => {
    const diaValue = item.dia_display || item.dias_nombre || ''

    const matchesTipo =
      !detailFilters.value.tipo ||
      (detailFilters.value.tipo === 'cursos' && !item.es_laboratorio) ||
      (detailFilters.value.tipo === 'laboratorios' && item.es_laboratorio)

    const matchesCarrera =
      !detailFilters.value.carrera_id ||
      String(item.carrera_id) === String(detailFilters.value.carrera_id)

    const matchesSemestre =
      !detailFilters.value.semestre ||
      String(item.semestre) === String(detailFilters.value.semestre)

    const matchesDocente =
      !detailFilters.value.docente_nombre ||
      String(item.docente_nombre || '') === String(detailFilters.value.docente_nombre)

    const matchesSalon =
      !detailFilters.value.salon_nombre ||
      String(item.salon_nombre || '') === String(detailFilters.value.salon_nombre)

    const matchesDia =
      !detailFilters.value.dia ||
      String(diaValue) === String(detailFilters.value.dia)

    return (
      matchesTipo &&
      matchesCarrera &&
      matchesSemestre &&
      matchesDocente &&
      matchesSalon &&
      matchesDia
    )
  })
})

const horarioIdOptions = computed(() => [...new Set(horarios.value.map((item) => item.id))])

const metodoSeleccionOptions = computed(() =>
  [...new Set(horarios.value.map((item) => item.metodo_seleccion).filter(Boolean))]
)

const metodoCruceOptions = computed(() =>
  [...new Set(horarios.value.map((item) => item.metodo_cruce).filter(Boolean))]
)

const metodoMutacionOptions = computed(() =>
  [...new Set(horarios.value.map((item) => item.metodo_mutacion).filter(Boolean))]
)

const detalleCarreraOptions = computed(() => {
  const map = new Map()

  horarioDetallesBase.value.forEach((item) => {
    if (item.carrera_id) {
      map.set(item.carrera_id, item.carrera_nombre || `Carrera ${item.carrera_id}`)
    }
  })

  return [...map.entries()].map(([value, label]) => ({ value, label }))
})

const detalleSemestreOptions = computed(() =>
  [...new Set(horarioDetallesBase.value.map((item) => item.semestre).filter(Boolean))].sort((a, b) => a - b)
)

const detalleDocenteOptions = computed(() =>
  [...new Set(horarioDetallesBase.value.map((item) => item.docente_nombre).filter(Boolean))].sort()
)

const detalleSalonOptions = computed(() =>
  [...new Set(horarioDetallesBase.value.map((item) => item.salon_nombre).filter(Boolean))].sort()
)

const detalleDiaOptions = computed(() =>
  [...new Set(horarioDetallesBase.value.map((item) => item.dia_display || item.dias_nombre).filter(Boolean))].sort()
)

const resumenGlobal = computed(() => {
  const visibleIds = filteredHorarios.value.map((item) => item.id)
  const reportes = visibleIds
    .map((id) => reportesCache.value[id])
    .filter(Boolean)

  const totalConflictosFinales = reportes.reduce(
    (acc, item) => acc + Number(item?.total_conflictos || 0),
    0
  )

  const totalConflictosGeneraciones = reportes.reduce((acc, item) => {
    const historial = item?.historial || []
    const sumHist = historial.reduce((a, b) => a + Number(b?.conflictos || 0), 0)
    return acc + sumHist
  }, 0)

  const totalGeneraciones = filteredHorarios.value.reduce(
    (acc, item) => acc + Number(item?.generaciones_ejecutadas || 0),
    0
  )

  const tiempoTotalMs = filteredHorarios.value.reduce(
    (acc, item) => acc + Number(item?.tiempo_ejecucion_ms || 0),
    0
  )

  const continuidadValores = reportes
    .map((item) => Number(item?.porcentaje_continuidad || 0))
    .filter((n) => !Number.isNaN(n))

  const promedioContinuidad = continuidadValores.length
    ? (continuidadValores.reduce((a, b) => a + b, 0) / continuidadValores.length).toFixed(2)
    : '0.00'

  const iteracionesEstables = reportes
    .map((item) => calcularIteracionEstable(item?.historial || []))
    .filter((n) => n !== '-')

  const promedioIteracionEstable = iteracionesEstables.length
    ? (
        iteracionesEstables.reduce((a, b) => a + Number(b), 0) / iteracionesEstables.length
      ).toFixed(0)
    : '-'

  const mejorHorario = [...filteredHorarios.value].sort(
    (a, b) => Number(b.aptitud_final) - Number(a.aptitud_final)
  )[0]

  const horarioActivo = filteredHorarios.value.find((item) => item.es_activo)

  return {
    totalConflictosFinales,
    totalConflictosGeneraciones,
    totalGeneraciones,
    tiempoTotalMs,
    promedioContinuidad,
    promedioIteracionEstable,
    mejorAptitud: mejorHorario?.aptitud_final ?? '-',
    mejorHorarioNombre: mejorHorario?.nombre ?? '-',
    horarioActivoNombre: horarioActivo?.nombre ?? 'Ninguno',
  }
})

const semestresPresentes = computed(() => {
  const values = [...new Set(filteredHorarioDetalles.value.map((item) => item.semestre).filter(Boolean))]
  return values.join(', ') || '-'
})

const docentesPresentes = computed(() => {
  return [...new Set(filteredHorarioDetalles.value.map((item) => item.docente_nombre).filter(Boolean))]
})

const salonesPresentes = computed(() => {
  return [...new Set(filteredHorarioDetalles.value.map((item) => item.salon_nombre).filter(Boolean))]
})

const conflictosPorTipoArray = computed(() => {
  const raw = reporteData.value?.conflictos_por_tipo || {}
  return Object.entries(raw).map(([tipo, cantidad]) => ({ tipo, cantidad }))
})

const iteracionEstable = computed(() => {
  return calcularIteracionEstable(reporteData.value?.historial || [])
})

const apiBase = import.meta.env.VITE_API_URL

const resetMessages = () => {
  error.value = ''
  success.value = ''
}

const formatDate = (value) => {
  if (!value) return '-'
  try {
    return new Date(value).toLocaleString()
  } catch {
    return value
  }
}

const formatMs = (value) => {
  const ms = Number(value || 0)
  if (ms < 1000) return `${ms} ms`
  return `${(ms / 1000).toFixed(2)} s`
}

const calcularIteracionEstable = (historial) => {
  if (!historial?.length) return '-'

  const finalAptitud = historial[historial.length - 1].mejor_aptitud
  const finalConflictos = historial[historial.length - 1].conflictos

  let indice = historial.length - 1

  while (indice >= 0) {
    const item = historial[indice]
    if (item.mejor_aptitud !== finalAptitud || item.conflictos !== finalConflictos) {
      break
    }
    indice--
  }

  const estable = historial[indice + 1]
  return estable?.generacion ?? historial[historial.length - 1].generacion
}

const loadHorarios = async () => {
  loadingHorarios.value = true
  resetMessages()

  try {
    const { data } = await getHorarios()
    horarios.value = Array.isArray(data) ? data : []
    await hydrateReportesResumen()
  } catch (err) {
    error.value = err?.response?.data?.error || 'Error cargando horarios'
  } finally {
    loadingHorarios.value = false
  }
}

const hydrateReportesResumen = async () => {
  const pendientes = horarios.value
    .filter((item) => !reportesCache.value[item.id])
    .map(async (horario) => {
      try {
        const { data } = await getReporteHorario(horario.id)
        reportesCache.value[horario.id] = data
      } catch {
        // no bloquea
      }
    })

  await Promise.all(pendientes)
}

const loadHorarioBundle = async (horarioId) => {
  loadingDetalle.value = true
  resetMessages()

  try {
    const [horarioRes, conflictosRes, reporteRes] = await Promise.all([
      getHorarioById(horarioId),
      getConflictosHorario(horarioId),
      getReporteHorario(horarioId),
    ])

    selectedHorario.value = horarioRes.data?.horario || null
    horarioDetallesBase.value = Array.isArray(horarioRes.data?.detalles)
      ? horarioRes.data.detalles
      : []
    conflictosData.value = conflictosRes.data || null
    reporteData.value = reporteRes.data || null
    reportesCache.value[horarioId] = reporteRes.data || null

    await nextTick()
    renderReportChart()
  } catch (err) {
    error.value = err?.response?.data?.error || 'Error cargando información del horario'
  } finally {
    loadingDetalle.value = false
  }
}

const openHorario = async (horario) => {
  selectedHorarioId.value = horario.id
  selectedView.value = 'horario'
  clearDetailFilters()
  await loadHorarioBundle(horario.id)
}

const openConflictos = async (horario) => {
  selectedHorarioId.value = horario.id
  selectedView.value = 'conflictos'
  await loadHorarioBundle(horario.id)
}

const openReporte = async (horario) => {
  selectedHorarioId.value = horario.id
  selectedView.value = 'reporte'
  reportTab.value = 'conflictosTipo'
  await loadHorarioBundle(horario.id)
}

const goBack = () => {
  selectedHorarioId.value = null
  selectedView.value = ''
  selectedHorario.value = null
  horarioDetallesBase.value = []
  conflictosData.value = null
  reporteData.value = null
  clearDetailFilters()
  destroyReportChart()
}

const clearListFilters = () => {
  listFilters.value = {
    id: '',
    activo: '',
    metodo_seleccion: '',
    metodo_cruce: '',
    metodo_mutacion: '',
  }
}

const clearDetailFilters = () => {
  detailFilters.value = {
    tipo: '',
    carrera_id: '',
    semestre: '',
    docente_nombre: '',
    salon_nombre: '',
    dia: '',
  }
}

const buildHorarioCsvUrl = () => {
  if (!selectedHorarioId.value) return '#'
  return `${apiBase}/horarios/${selectedHorarioId.value}/exportar/csv`
}

const exportHorarioCsv = () => {
  if (!selectedHorarioId.value) return
  window.open(buildHorarioCsvUrl(), '_blank')
}

const exportCsvFromRows = (filename, headers, rows) => {
  const csvRows = [
    headers.join(','),
    ...rows.map((row) =>
      row.map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`).join(',')
    ),
  ]

  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

const exportHorariosCsv = () => {
  const headers = [
    'ID',
    'Nombre',
    'Fecha',
    'Aptitud Final',
    'Generaciones',
    'Tiempo ms',
    'Metodo Seleccion',
    'Metodo Cruce',
    'Metodo Mutacion',
    'Activo',
  ]

  const rows = filteredHorarios.value.map((item) => [
    item.id,
    item.nombre,
    formatDate(item.fecha_generacion),
    item.aptitud_final,
    item.generaciones_ejecutadas,
    item.tiempo_ejecucion_ms,
    item.metodo_seleccion,
    item.metodo_cruce,
    item.metodo_mutacion,
    item.es_activo ? 'Sí' : 'No',
  ])

  exportCsvFromRows('horarios_generados.csv', headers, rows)
}

const exportConflictosCsv = () => {
  const headers = ['Tipo', 'Descripcion', 'Penalizacion']
  const rows = (conflictosData.value?.conflictos || []).map((item) => [
    item.tipo,
    item.descripcion,
    item.penalizacion,
  ])

  exportCsvFromRows(
    `conflictos_horario_${selectedHorarioId.value}.csv`,
    headers,
    rows
  )
}

const exportReporteGeneralCsv = () => {
  if (!reporteData.value) return

  const headers = [
    'Horario',
    'Aptitud Final',
    'Generaciones',
    'Tiempo ms',
    'Tiempo seg',
    'Metodo Seleccion',
    'Metodo Cruce',
    'Metodo Mutacion',
    'Total Conflictos',
    'Porcentaje Continuidad',
    'Memoria RSS',
    'Heap Total',
    'Heap Usado',
    'Iteracion Estable',
  ]

  const rows = [[
    reporteData.value.nombre,
    reporteData.value.aptitud_final,
    reporteData.value.generaciones_ejecutadas,
    reporteData.value.tiempo_ejecucion_ms,
    reporteData.value.tiempo_ejecucion_seg,
    reporteData.value.metodo_seleccion,
    reporteData.value.metodo_cruce,
    reporteData.value.metodo_mutacion,
    reporteData.value.total_conflictos,
    reporteData.value.porcentaje_continuidad,
    reporteData.value.memoria_mb?.rss,
    reporteData.value.memoria_mb?.heap_total,
    reporteData.value.memoria_mb?.heap_usado,
    iteracionEstable.value,
  ]]

  exportCsvFromRows(
    `reporte_general_horario_${selectedHorarioId.value}.csv`,
    headers,
    rows
  )
}

const exportConflictosTipoCsv = () => {
  const headers = ['Tipo', 'Cantidad']
  const rows = conflictosPorTipoArray.value.map((item) => [
    item.tipo,
    item.cantidad,
  ])

  exportCsvFromRows(
    `conflictos_por_tipo_horario_${selectedHorarioId.value}.csv`,
    headers,
    rows
  )
}

const exportListaConflictosReporteCsv = () => {
  const headers = ['Tipo', 'Descripcion', 'Penalizacion']
  const rows = (reporteData.value?.lista_conflictos || []).map((item) => [
    item.tipo,
    item.descripcion,
    item.penalizacion,
  ])

  exportCsvFromRows(
    `lista_conflictos_reporte_horario_${selectedHorarioId.value}.csv`,
    headers,
    rows
  )
}

const exportHistorialCsv = () => {
  const headers = ['Generacion', 'Mejor Aptitud', 'Conflictos']
  const rows = (reporteData.value?.historial || []).map((item) => [
    item.generacion,
    item.mejor_aptitud,
    item.conflictos,
  ])

  exportCsvFromRows(
    `historial_generaciones_horario_${selectedHorarioId.value}.csv`,
    headers,
    rows
  )
}

const exportHorariosPdf = () => {
  const doc = new jsPDF('landscape')
  doc.setFontSize(16)
  doc.text('Listado de horarios generados', 14, 15)

  autoTable(doc, {
    startY: 22,
    head: [[
      'ID',
      'Nombre',
      'Aptitud',
      'Generaciones',
      'Tiempo ms',
      'Selección',
      'Cruce',
      'Mutación',
      'Activo',
    ]],
    body: filteredHorarios.value.map((item) => [
      item.id,
      item.nombre,
      item.aptitud_final,
      item.generaciones_ejecutadas,
      item.tiempo_ejecucion_ms,
      item.metodo_seleccion,
      item.metodo_cruce,
      item.metodo_mutacion,
      item.es_activo ? 'Sí' : 'No',
    ]),
  })

  doc.save('horarios_generados.pdf')
}

const exportHorarioPdf = () => {
  const doc = new jsPDF('landscape')
  doc.setFontSize(16)
  doc.text(`Listado del horario ${selectedHorarioId.value}`, 14, 15)

  autoTable(doc, {
    startY: 22,
    head: [[
      'Curso',
      'Semestre',
      'Código',
      'Sección',
      'Docente',
      'Salón',
      'Días',
      'Hora Inicio',
      'Hora Fin',
      'Tipo',
    ]],
    body: filteredHorarioDetalles.value.map((item) => [
      item.curso_nombre,
      item.semestre,
      item.curso_codigo,
      item.seccion_letra || '-',
      item.docente_nombre || '-',
      item.salon_nombre || '-',
      item.dia_display || item.dias_nombre || '-',
      item.hora_inicio,
      item.hora_fin,
      item.es_laboratorio ? 'Laboratorio' : 'Curso',
    ]),
  })

  doc.save(`horario_${selectedHorarioId.value}.pdf`)
}

const exportConflictosPdf = () => {
  const doc = new jsPDF()
  doc.setFontSize(16)
  doc.text(`Listado de conflictos del horario ${selectedHorarioId.value}`, 14, 15)

  doc.setFontSize(11)
  doc.text(`Aptitud: ${conflictosData.value?.aptitud ?? '-'}`, 14, 25)
  doc.text(`Total conflictos: ${conflictosData.value?.total_conflictos ?? 0}`, 14, 31)
  doc.text(`Total penalización: ${conflictosData.value?.total_penalizacion ?? 0}`, 14, 37)
  doc.text(`Total bonos: ${conflictosData.value?.total_bonos ?? 0}`, 14, 43)

  autoTable(doc, {
    startY: 50,
    head: [['Tipo', 'Descripción', 'Penalización']],
    body: (conflictosData.value?.conflictos || []).map((item) => [
      item.tipo,
      item.descripcion,
      item.penalizacion,
    ]),
  })

  doc.save(`conflictos_horario_${selectedHorarioId.value}.pdf`)
}

const openPdfExportModal = () => {
  showPdfExportModal.value = true
}

const closePdfExportModal = () => {
  showPdfExportModal.value = false
}

const exportReportePdfSeleccionado = async () => {
  if (!reporteData.value) return

  await nextTick()

  const doc = new jsPDF()
  doc.setFontSize(16)
  doc.text(`Reporte horario ${selectedHorarioId.value}`, 14, 15)

  let currentY = 22

  if (pdfOptions.value.includeGeneral) {
    doc.setFontSize(13)
    doc.text('Resumen general', 14, currentY)
    currentY += 4

    const resumen = [
      ['Nombre', reporteData.value.nombre],
      ['Aptitud final', String(reporteData.value.aptitud_final)],
      ['Generaciones', String(reporteData.value.generaciones_ejecutadas)],
      ['Tiempo ms', String(reporteData.value.tiempo_ejecucion_ms)],
      ['Tiempo seg', String(reporteData.value.tiempo_ejecucion_seg)],
      ['Método selección', reporteData.value.metodo_seleccion],
      ['Método cruce', reporteData.value.metodo_cruce],
      ['Método mutación', reporteData.value.metodo_mutacion],
      ['Total conflictos', String(reporteData.value.total_conflictos)],
      ['Continuidad', `${reporteData.value.porcentaje_continuidad}%`],
      ['Memoria RSS', `${reporteData.value.memoria_mb?.rss ?? '-'} MB`],
      ['Heap Total', `${reporteData.value.memoria_mb?.heap_total ?? '-'} MB`],
      ['Heap Usado', `${reporteData.value.memoria_mb?.heap_usado ?? '-'} MB`],
      ['Iteración estable', String(iteracionEstable.value)],
    ]

    autoTable(doc, {
      startY: currentY,
      head: [['Campo', 'Valor']],
      body: resumen,
    })

    currentY = doc.lastAutoTable.finalY + 10
  }

  if (pdfOptions.value.includeConflictosTipo) {
    if (currentY > 250) {
      doc.addPage()
      currentY = 20
    }

    doc.setFontSize(13)
    doc.text('Listado de conflictos por tipo', 14, currentY)
    currentY += 4

    autoTable(doc, {
      startY: currentY,
      head: [['Tipo', 'Cantidad']],
      body: conflictosPorTipoArray.value.map((item) => [item.tipo, item.cantidad]),
    })

    currentY = doc.lastAutoTable.finalY + 10
  }

  if (pdfOptions.value.includeListaConflictos) {
    if (currentY > 220) {
      doc.addPage()
      currentY = 20
    }

    doc.setFontSize(13)
    doc.text('Listado de conflictos', 14, currentY)
    currentY += 4

    autoTable(doc, {
      startY: currentY,
      head: [['Tipo', 'Descripción', 'Penalización']],
      body: (reporteData.value.lista_conflictos || []).map((item) => [
        item.tipo,
        item.descripcion,
        item.penalizacion,
      ]),
    })

    currentY = doc.lastAutoTable.finalY + 10
  }

  if (pdfOptions.value.includeHistorial) {
    if (currentY > 220) {
      doc.addPage()
      currentY = 20
    }

    doc.setFontSize(13)
    doc.text('Historial por generación', 14, currentY)
    currentY += 4

    autoTable(doc, {
      startY: currentY,
      head: [['Generación', 'Mejor Aptitud', 'Conflictos']],
      body: (reporteData.value.historial || []).map((item) => [
        item.generacion,
        item.mejor_aptitud,
        item.conflictos,
      ]),
    })

    currentY = doc.lastAutoTable.finalY + 10
  }

  if (pdfOptions.value.includeGrafica && reportChartCanvas.value) {
    const chartImg = reportChartCanvas.value.toDataURL('image/png', 1.0)

    if (currentY > 180) {
      doc.addPage()
      currentY = 20
    }

    doc.setFontSize(13)
    doc.text('Gráfica de evolución', 14, currentY)
    currentY += 6
    doc.addImage(chartImg, 'PNG', 14, currentY, 180, 70)
  }

  doc.save(`reporte_horario_${selectedHorarioId.value}.pdf`)
  closePdfExportModal()
}

const destroyReportChart = () => {
  if (reportChartInstance) {
    reportChartInstance.destroy()
    reportChartInstance = null
  }
}

const renderReportChart = async () => {
  await nextTick()
  if (!reportChartCanvas.value || !reporteData.value?.historial?.length) return

  destroyReportChart()

  reportChartInstance = new Chart(reportChartCanvas.value, {
    type: 'line',
    data: {
      labels: reporteData.value.historial.map((item) => item.generacion),
      datasets: [
        {
          label: 'Mejor Aptitud',
          data: reporteData.value.historial.map((item) => item.mejor_aptitud),
          tension: 0.2,
        },
        {
          label: 'Conflictos',
          data: reporteData.value.historial.map((item) => item.conflictos),
          tension: 0.2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
    },
  })
}

watch(reportTab, async (value) => {
  if (value === 'historial') {
    await nextTick()
    await renderReportChart()
  }
})

onMounted(async () => {
  await loadHorarios()
})

onBeforeUnmount(() => {
  destroyReportChart()
})
</script>

<style scoped>
.page.page-reportes {
  width: min(1720px, calc(100vw - 48px));
  max-width: 1720px;
  margin: 0 auto;
  padding: 24px;
  box-sizing: border-box;
}

.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18px;
}

.card,
.subcard {
  background: white;
  border-radius: 14px;
  padding: 20px;
  margin-bottom: 18px;
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.08);
}

.card-header,
.list-header,
.subcard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.header-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.section-title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #111827;
}

.subsection-title {
  margin: 18px 0 12px;
  font-size: 18px;
  font-weight: 700;
  color: #111827;
}

.tab-section-title {
  margin: 0;
  font-size: 17px;
  font-weight: 700;
  color: #111827;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
}

.form-group select,
.form-group input {
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: white;
}

.main-filters-grid,
.filters-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 16px;
}

.filter-actions {
  display: flex;
  align-items: end;
  justify-content: flex-end;
}

.table-wrapper {
  width: 100%;
  overflow-x: auto;
}

.table {
  width: 100%;
  min-width: 1180px;
  border-collapse: collapse;
}

.details-table {
  min-width: 1380px;
}

th,
td {
  padding: 12px;
  border-bottom: 1px solid #e5e7eb;
  text-align: left;
  vertical-align: top;
}

th {
  background: #f3f4f6;
  color: #111827;
  white-space: nowrap;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 18px;
}

.summary-grid-report {
  grid-template-columns: repeat(6, minmax(0, 1fr));
}

.summary-card {
  background: white;
  border-radius: 14px;
  padding: 18px;
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.08);
}

.summary-label {
  display: block;
  color: #6b7280;
  font-size: 13px;
  margin-bottom: 8px;
}

.summary-value {
  font-size: 22px;
  font-weight: 700;
  color: #111827;
}

.meta-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.two-columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
}

.actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
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

.btn-primary {
  background: #2563eb;
  color: white;
  border: none;
  padding: 10px 14px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
}

.btn-small {
  border: none;
  padding: 7px 10px;
  border-radius: 6px;
  color: white;
  cursor: pointer;
  font-size: 13px;
  white-space: nowrap;
}

.view {
  background: #2563eb;
}

.warn {
  background: #f59e0b;
}

.success {
  background: #16a34a;
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

.chart-wrapper {
  height: 380px;
}

.report-chart-wrapper {
  height: 420px;
  margin-bottom: 18px;
}

.historial-table-wrapper {
  margin-top: 14px;
}

.info-line {
  margin: 6px 0;
}

.chips-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 14px;
}

.chip-title {
  font-weight: 700;
  color: #111827;
}

.chip {
  background: #eef2ff;
  color: #3730a3;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 12px;
}

.report-tabs {
  display: flex;
  gap: 10px;
  margin: 18px 0;
  flex-wrap: wrap;
}

.report-tab-btn {
  border: none;
  background: #e5e7eb;
  color: #111827;
  padding: 10px 14px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}

.report-tab-btn.active {
  background: #2563eb;
  color: white;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  z-index: 100;
}

.modal {
  background: white;
  border-radius: 14px;
  padding: 24px;
  width: min(520px, 100%);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.2);
}

.checkbox-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 18px;
}

.checkbox-item {
  display: flex;
  gap: 10px;
  align-items: center;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 24px;
}

@media (max-width: 1450px) {
  .summary-grid-report {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .meta-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .main-filters-grid,
  .filters-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .page.page-reportes {
    width: calc(100vw - 24px);
    max-width: none;
    padding: 14px;
  }

  .summary-grid,
  .summary-grid-report,
  .meta-grid,
  .main-filters-grid,
  .filters-grid,
  .two-columns {
    grid-template-columns: 1fr;
  }

  .card-header,
  .list-header,
  .subcard-header {
    flex-direction: column;
    align-items: stretch;
  }

}
.warning-text {
  margin-top: 10px;
  margin-bottom: 18px;
  padding: 12px 14px;
  border-radius: 8px;
  background: #fef2f2;
  color: #b91c1c;
  border: 1px solid #fca5a5;
  font-weight: 500;
}


</style>