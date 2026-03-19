<template>
  <div class="page page-horario-tablas">
    <div class="header-row">
      <div>
        <h1 class="page-title">Horario General en Tablas</h1>
        <p class="page-subtitle">
          Visualización por matriz de periodos (filas) y salones (columnas)
        </p>
      </div>
    </div>

    <div v-if="error" class="alert error">{{ error }}</div>
    <div v-if="success" class="alert success">{{ success }}</div>

    <div class="card controls-card">
      <div class="controls-grid">
        <div class="form-group">
          <label>Horario</label>
          <select v-model.number="selectedHorarioId" @change="handleSeleccionHorario">
            <option :value="null">Selecciona un horario</option>
            <option v-for="horario in horarios" :key="horario.id" :value="horario.id">
              #{{ horario.id }} - {{ horario.nombre || 'Sin nombre' }}
              (Aptitud: {{ horario.aptitud_final }})
            </option>
          </select>
        </div>

        <div class="actions">
          <button class="btn-secondary" @click="loadHorarios" :disabled="loadingHorarios">
            {{ loadingHorarios ? 'Recargando...' : 'Recargar horarios' }}
          </button>
          <button
            class="btn-secondary"
            @click="loadDetalleHorario"
            :disabled="!selectedHorarioId || loadingDetalle"
          >
            {{ loadingDetalle ? 'Cargando...' : 'Cargar horario' }}
          </button>
          <button
            class="btn-secondary"
            @click="exportarHorarioPdf"
            :disabled="!selectedHorarioId || detalles.length === 0 || exportingPdf"
          >
            {{ exportingPdf ? 'Exportando PDF...' : 'Exportar PDF' }}
          </button>
        </div>
      </div>

      <div v-if="horarioSeleccionado" class="meta-grid">
        <div><strong>ID:</strong> {{ horarioSeleccionado.id }}</div>
        <div><strong>Nombre:</strong> {{ horarioSeleccionado.nombre || '-' }}</div>
        <div><strong>Aptitud:</strong> {{ horarioSeleccionado.aptitud_final }}</div>
        <div><strong>Generaciones:</strong> {{ horarioSeleccionado.generaciones_ejecutadas }}</div>
        <div><strong>Tiempo:</strong> {{ horarioSeleccionado.tiempo_ejecucion_ms }} ms</div>
      </div>
    </div>

    <div v-if="loadingDetalle" class="card empty">Cargando detalle del horario...</div>

    <div v-else-if="selectedHorarioId && detalles.length === 0" class="card empty">
      No hay detalle para este horario
    </div>

    <template v-else-if="detalles.length > 0">
      <div class="card section-card">
        <h2 class="section-title">Horario Teórico (Lunes, Miércoles y Viernes)</h2>
        <p class="section-subtitle">Filas: periodos • Columnas: salones</p>

        <div v-if="tablaTeoricos.periodos.length === 0" class="empty">No hay clases teóricas</div>

        <div v-else class="table-wrapper">
          <table class="schedule-table">
            <thead>
              <tr>
                <th class="sticky-col">Periodo</th>
                <th v-for="salon in tablaTeoricos.salones" :key="`teo-${salon}`">{{ salon }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="periodo in tablaTeoricos.periodos" :key="`teo-row-${periodo}`">
                <td class="sticky-col period-label">{{ periodo }}</td>
                <td
                  v-for="salon in tablaTeoricos.salones"
                  :key="`teo-cell-${periodo}-${salon}`"
                  class="cell"
                >
                  <template v-if="getCellItems(tablaTeoricos, periodo, salon).length">
                    <div
                      v-for="item in getCellItems(tablaTeoricos, periodo, salon)"
                      :key="item.detalle_id"
                      class="cell-item teorico"
                    >
                      <div class="cell-main">{{ item.curso_nombre }}</div>
                      <div class="cell-sub">
                        {{ item.curso_codigo }} • Sec. {{ item.seccion_letra || '-' }} • Sem. {{ item.semestre }}
                      </div>
                      <div class="cell-sub">Doc.: {{ item.docente_nombre || 'Sin asignar' }}</div>
                    </div>
                  </template>
                  <span v-else class="dash">-</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="card section-card">
        <h2 class="section-title">Horario Laboratorio (Martes y Jueves)</h2>
        <p class="section-subtitle">Filas: periodos • Columnas: salones</p>

        <div v-if="tablaLaboratorios.periodos.length === 0" class="empty">No hay laboratorios</div>

        <div v-else class="table-wrapper">
          <table class="schedule-table">
            <thead>
              <tr>
                <th class="sticky-col">Periodo</th>
                <th v-for="salon in tablaLaboratorios.salones" :key="`lab-${salon}`">{{ salon }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="periodo in tablaLaboratorios.periodos" :key="`lab-row-${periodo}`">
                <td class="sticky-col period-label">{{ periodo }}</td>
                <td
                  v-for="salon in tablaLaboratorios.salones"
                  :key="`lab-cell-${periodo}-${salon}`"
                  class="cell"
                >
                  <template v-if="getCellItems(tablaLaboratorios, periodo, salon).length">
                    <div
                      v-for="item in getCellItems(tablaLaboratorios, periodo, salon)"
                      :key="item.detalle_id"
                      class="cell-item laboratorio"
                    >
                      <div class="cell-main">{{ item.curso_nombre }}</div>
                      <div class="cell-sub">
                        {{ item.curso_codigo }} • Sec. {{ item.seccion_letra || '-' }} • Sem. {{ item.semestre }}
                      </div>
                      <div class="cell-sub">Doc.: {{ item.docente_nombre || 'Sin asignar' }}</div>
                      <div class="cell-sub">Día: {{ item.dia_display || item.dias_nombre || '-' }}</div>
                    </div>
                  </template>
                  <span v-else class="dash">-</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { getHorarioById, getHorarios } from '../services/horarios/horarios.service'

const horarios = ref([])
const selectedHorarioId = ref(null)
const detalles = ref([])

const loadingHorarios = ref(false)
const loadingDetalle = ref(false)
const exportingPdf = ref(false)
const error = ref('')
const success = ref('')

const resetMessages = () => {
  error.value = ''
  success.value = ''
}

const formatTimeRange = (horaInicio, horaFin) => {
  return `${horaInicio || '--:--:--'} - ${horaFin || '--:--:--'}`
}

const normalizeSalon = (name) => {
  const value = String(name || '').trim()
  return value || 'Sin salón'
}

const compareTimeRange = (a, b) => {
  const [startA] = a.split(' - ')
  const [startB] = b.split(' - ')
  return String(startA).localeCompare(String(startB))
}

const buildScheduleTable = (items) => {
  const periodosSet = new Set()
  const salonesSet = new Set()
  const matrix = new Map()

  for (const item of items) {
    const periodo = formatTimeRange(item.hora_inicio, item.hora_fin)
    const salon = normalizeSalon(item.salon_nombre)

    periodosSet.add(periodo)
    salonesSet.add(salon)

    const key = `${periodo}__${salon}`
    if (!matrix.has(key)) {
      matrix.set(key, [])
    }

    matrix.get(key).push(item)
  }

  const periodos = [...periodosSet].sort(compareTimeRange)
  const salones = [...salonesSet].sort((a, b) => a.localeCompare(b))

  return {
    periodos,
    salones,
    matrix,
  }
}

const horarioSeleccionado = computed(() => {
  return horarios.value.find((item) => item.id === selectedHorarioId.value) || null
})

const detallesTeoricos = computed(() => {
  return detalles.value.filter((item) => !item.es_laboratorio)
})

const detallesLaboratorios = computed(() => {
  return detalles.value.filter((item) => item.es_laboratorio)
})

const tablaTeoricos = computed(() => buildScheduleTable(detallesTeoricos.value))
const tablaLaboratorios = computed(() => buildScheduleTable(detallesLaboratorios.value))

const getCellItems = (tableData, periodo, salon) => {
  const key = `${periodo}__${salon}`
  return tableData.matrix.get(key) || []
}

const toSafeDocente = (value) => {
  return value || 'Sin asignar'
}

const buildCellPdfText = (items) => {
  if (!items.length) return '-'

  return items
    .map((item) => {
      const nombreCurso = item.curso_nombre || 'Sin nombre'
      const codigo = item.curso_codigo || '-'
      const seccion = item.seccion_letra || '-'
      const docente = toSafeDocente(item.docente_nombre)
      const base = `${nombreCurso}\n${codigo} (${seccion}) - ${docente}`

      if (item.es_laboratorio) {
        const dia = item.dia_display || item.dias_nombre || '-'
        return `${base}\nDía: ${dia}`
      }

      return base
    })
    .join('\n')
}

const buildMatrixPdfColumns = (tableData) => {
  return ['Periodo', ...tableData.salones]
}

const buildMatrixPdfRows = (tableData) => {
  return tableData.periodos.map((periodo) => {
    const row = [periodo]

    for (const salon of tableData.salones) {
      const items = getCellItems(tableData, periodo, salon)
      row.push(buildCellPdfText(items))
    }

    return row
  })
}

const addSectionTableToPdf = (doc, title, tableData, isFirst = false) => {
  const yTitle = isFirst ? 42 : doc.lastAutoTable.finalY + 16
  doc.setFontSize(11)
  doc.text(title, 14, yTitle)

  if (!tableData.periodos.length || !tableData.salones.length) {
    doc.setFontSize(9)
    doc.text('Sin datos disponibles para esta sección.', 14, yTitle + 8)
    return
  }

  const columns = buildMatrixPdfColumns(tableData)
  const body = buildMatrixPdfRows(tableData)

  autoTable(doc, {
    startY: yTitle + 4,
    head: [columns],
    body,
    theme: 'grid',
    styles: {
      fontSize: 6.5,
      cellPadding: 1.5,
      overflow: 'linebreak',
      valign: 'top',
    },
    headStyles: {
      fillColor: [37, 99, 235],
      textColor: [255, 255, 255],
    },
    columnStyles: {
      0: { cellWidth: 28 },
    },
    horizontalPageBreak: true,
    margin: {
      top: 10,
      left: 8,
      right: 8,
      bottom: 10,
    },
    tableWidth: 'auto',
  })
}

const exportarHorarioPdf = async () => {
  if (!selectedHorarioId.value || detalles.value.length === 0) return

  resetMessages()
  exportingPdf.value = true

  try {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
    const nombreHorario = horarioSeleccionado.value?.nombre || 'Sin nombre'
    const fecha = new Date().toLocaleString()

    doc.setFontSize(14)
    doc.text('Horario General en Tablas', 14, 16)
    doc.setFontSize(10)
    doc.text(`Horario: #${selectedHorarioId.value} - ${nombreHorario}`, 14, 23)
    doc.text(`Generado: ${fecha}`, 14, 29)
    doc.text('Filas: Periodos | Columnas: Salones', 14, 35)

    addSectionTableToPdf(doc, 'Teóricos (Lunes, Miércoles y Viernes)', tablaTeoricos.value, true)
    addSectionTableToPdf(doc, 'Laboratorios (Martes y Jueves)', tablaLaboratorios.value)

    const fileSafeName = String(nombreHorario || 'horario').replace(/[\\/:*?"<>|]/g, '_')
    doc.save(`horario_tablas_${selectedHorarioId.value}_${fileSafeName}.pdf`)
    success.value = 'PDF exportado correctamente'
  } catch (err) {
    error.value = err?.message || 'Error exportando PDF'
  } finally {
    exportingPdf.value = false
  }
}

const loadHorarios = async () => {
  loadingHorarios.value = true
  resetMessages()

  try {
    const { data } = await getHorarios()
    horarios.value = Array.isArray(data) ? data : []

    if (!selectedHorarioId.value && horarios.value.length > 0) {
      const activo = horarios.value.find((item) => item.es_activo)
      selectedHorarioId.value = activo?.id || horarios.value[0].id
    }
  } catch (err) {
    error.value = err?.response?.data?.error || 'Error cargando horarios'
  } finally {
    loadingHorarios.value = false
  }
}

const loadDetalleHorario = async () => {
  if (!selectedHorarioId.value) return

  loadingDetalle.value = true
  resetMessages()

  try {
    const { data } = await getHorarioById(selectedHorarioId.value)
    detalles.value = Array.isArray(data?.detalles) ? data.detalles : []
    success.value = 'Horario cargado correctamente'
  } catch (err) {
    error.value = err?.response?.data?.error || 'Error cargando el detalle del horario'
    detalles.value = []
  } finally {
    loadingDetalle.value = false
  }
}

const handleSeleccionHorario = async () => {
  detalles.value = []
  if (selectedHorarioId.value) {
    await loadDetalleHorario()
  }
}

onMounted(async () => {
  await loadHorarios()
  if (selectedHorarioId.value) {
    await loadDetalleHorario()
  }
})
</script>

<style scoped>
.page-horario-tablas {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card {
  background: white;
  border-radius: 12px;
  padding: 18px;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.08);
}

.controls-grid {
  display: grid;
  grid-template-columns: 1.5fr auto;
  gap: 14px;
  align-items: end;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-weight: 600;
  color: #374151;
}

.form-group select {
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
}

.actions {
  display: flex;
  gap: 10px;
}

.btn-secondary {
  border: none;
  background: #2563eb;
  color: white;
  border-radius: 8px;
  padding: 10px 14px;
  cursor: pointer;
  font-weight: 600;
}

.btn-secondary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.meta-grid {
  margin-top: 12px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 8px;
  color: #374151;
}

.section-title {
  margin: 0;
}

.section-subtitle {
  margin: 6px 0 14px;
  color: #4b5563;
}

.table-wrapper {
  overflow: auto;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
}

.schedule-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 980px;
}

.schedule-table th,
.schedule-table td {
  border-bottom: 1px solid #e5e7eb;
  border-right: 1px solid #f3f4f6;
  padding: 8px;
  vertical-align: top;
}

.schedule-table th {
  background: #f9fafb;
  position: sticky;
  top: 0;
  z-index: 2;
  white-space: nowrap;
}

.sticky-col {
  position: sticky;
  left: 0;
  background: #f9fafb;
  z-index: 3;
  min-width: 140px;
}

.period-label {
  font-weight: 600;
  color: #1f2937;
}

.cell {
  min-width: 220px;
}

.cell-item {
  border-radius: 8px;
  padding: 8px;
  margin-bottom: 8px;
}

.cell-item:last-child {
  margin-bottom: 0;
}

.cell-item.teorico {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
}

.cell-item.laboratorio {
  background: #ecfdf5;
  border: 1px solid #bbf7d0;
}

.cell-main {
  font-weight: 700;
  color: #111827;
  margin-bottom: 4px;
}

.cell-sub {
  color: #374151;
  font-size: 12px;
  line-height: 1.3;
}

.dash {
  color: #9ca3af;
}

.alert {
  padding: 10px;
  border-radius: 8px;
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
  color: #6b7280;
}

@media (max-width: 900px) {
  .controls-grid {
    grid-template-columns: 1fr;
  }
}
</style>
