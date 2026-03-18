<template>
  <div class="page">
    <div class="header-row">
      <div>
        <h1 class="page-title">Mantenimiento y Reset</h1>
        <p class="page-subtitle">Gestión del estado de la base de datos</p>
      </div>
    </div>

    <!-- Alertas -->
    <div v-if="error" class="alert error">{{ error }}</div>
    <div v-if="success" class="alert success">{{ success }}</div>

    <!-- Card de Estado -->
    <div class="card estado-card">
      <div class="card-header">
        <h2>Estado Actual de la Base de Datos</h2>
        <button class="btn btn-small" @click="refrescarEstado" :disabled="loadingEstado">
          {{ loadingEstado ? 'Cargando...' : 'Refrescar' }}
        </button>
      </div>

      <div v-if="loadingEstado" class="loading-placeholder">
        Cargando estado...
      </div>

      <div v-else-if="estado" class="estado-grid">
        <div class="estado-item">
          <span class="label">Carreras</span>
          <span class="value">{{ estado.carreras }}</span>
        </div>
        <div class="estado-item">
          <span class="label">Docentes</span>
          <span class="value">{{ estado.docentes }}</span>
        </div>
        <div class="estado-item">
          <span class="label">Cursos</span>
          <span class="value">{{ estado.cursos }}</span>
        </div>
        <div class="estado-item">
          <span class="label">Salones</span>
          <span class="value">{{ estado.salones }}</span>
        </div>
        <div class="estado-item">
          <span class="label">Laboratorios</span>
          <span class="value">{{ estado.laboratorios }}</span>
        </div>
        <div class="estado-item">
          <span class="label">Secciones</span>
          <span class="value">{{ estado.secciones }}</span>
        </div>
        <div class="estado-item">
          <span class="label">Sección Laboratorio</span>
          <span class="value">{{ estado.seccion_laboratorio }}</span>
        </div>
        <div class="estado-item">
          <span class="label">Docente - Curso</span>
          <span class="value">{{ estado.docente_curso }}</span>
        </div>
        <div class="estado-item">
          <span class="label">Períodos</span>
          <span class="value">{{ estado.periodos }}</span>
        </div>
        <div class="estado-item">
          <span class="label">Horarios</span>
          <span class="value">{{ estado.horarios }}</span>
        </div>
        <div class="estado-item">
          <span class="label">Horario Detalle</span>
          <span class="value">{{ estado.horario_detalle }}</span>
        </div>
        <div class="estado-item">
          <span class="label">Horario Historial</span>
          <span class="value">{{ estado.horario_historial }}</span>
        </div>
      </div>

      <div v-else class="empty-state">
        No se pudo cargar el estado
      </div>
    </div>

    <!-- Acciones de Reset -->
    <div class="actions-grid">
      <!-- Card: Eliminar Horarios -->
      <div class="action-card warning">
        <div class="action-header">
          <h3>Eliminar Horarios</h3>
          <p>Elimina todos los horarios generados, detalles e historial</p>
        </div>

        <div v-if="mostrarConfirmacionHorarios" class="confirmation-box">
          <p class="warning-text">
            ⚠️ Esta acción eliminará:
          </p>
          <ul>
            <li>Horarios: {{ estado?.horarios || 0 }} registros</li>
            <li>Horario Detalle: {{ estado?.horario_detalle || 0 }} registros</li>
            <li>Horario Historial: {{ estado?.horario_historial || 0 }} registros</li>
          </ul>
          <p class="warning-text">¿Estás seguro?</p>
          <div class="confirmation-buttons">
            <button
              class="btn btn-danger"
              @click="ejecutarEliminarHorarios"
              :disabled="loadingHorarios"
            >
              {{ loadingHorarios ? 'Eliminando...' : 'Sí, eliminar horarios' }}
            </button>
            <button
              class="btn btn-secondary"
              @click="mostrarConfirmacionHorarios = false"
              :disabled="loadingHorarios"
            >
              Cancelar
            </button>
          </div>
        </div>

        <button
          v-else
          class="btn btn-warning btn-block"
          @click="mostrarConfirmacionHorarios = true"
          :disabled="loadingHorarios || !estado"
        >
          Eliminar Horarios
        </button>
      </div>

      <!-- Card: Limpiar Todo -->
      <div class="action-card danger">
        <div class="action-header">
          <h3>Limpiar Base de Datos Completamente</h3>
          <p>Elimina TODOS los datos excepto configuración y calendario</p>
        </div>

        <div v-if="mostrarConfirmacionCompleto" class="confirmation-box">
          <p class="danger-text">
            🚨 ADVERTENCIA: Esta acción es IRREVERSIBLE
          </p>
          <p class="warning-text">
            Se eliminarán:
          </p>
          <ul class="danger-list">
            <li>Secciones Laboratorio</li>
            <li>Secciones</li>
            <li>Docente - Curso</li>
            <li>Laboratorios</li>
            <li>Cursos</li>
            <li>Docentes</li>
            <li>Salones</li>
            <li>Horarios, Detalles e Historial</li>
          </ul>
          <p class="warning-text">Se mantendrán: Únicamente la configuración del algoritmo y el calendario</p>
          <p class="danger-text bold">¿Realmente estás seguro de que quieres continuar?</p>

          <div class="confirmation-text-box">
            <p>Por favor escribe <strong>"LIMPIAR TODO"</strong> para confirmar:</p>
            <input
              v-model="confirmacionTexto"
              type="text"
              placeholder="Escribe 'LIMPIAR TODO'"
              class="confirmation-input"
            />
          </div>

          <div class="confirmation-buttons">
            <button
              class="btn btn-danger-intense"
              @click="ejecutarLimpiarCompleto"
              :disabled="
                loadingCompleto || confirmacionTexto !== 'LIMPIAR TODO'
              "
            >
              {{ loadingCompleto ? 'Limpiando...' : 'Confirmar Limpieza Total' }}
            </button>
            <button
              class="btn btn-secondary"
              @click="
                mostrarConfirmacionCompleto = false;
                confirmacionTexto = '';
              "
              :disabled="loadingCompleto"
            >
              Cancelar
            </button>
          </div>
        </div>

        <button
          v-else
          class="btn btn-danger btn-block"
          @click="mostrarConfirmacionCompleto = true"
          :disabled="loadingCompleto || !estado"
        >
          Limpiar Completamente
        </button>
      </div>
    </div>

    <!-- Resultados -->
    <div v-if="resultados.length > 0" class="results-card">
      <h3>Resultados de Operaciones</h3>
      <div v-for="(resultado, index) in resultados" :key="index" class="resultado-item">
        <div class="resultado-header">
          <span class="badge" :class="resultado.tipo">{{ resultado.tipo }}</span>
          <span class="timestamp">{{ resultado.timestamp }}</span>
        </div>
        <p v-if="resultado.mensaje" class="resultado-mensaje">{{ resultado.mensaje }}</p>
        <div v-if="resultado.detalles" class="resultado-detalles">
          <table class="table">
            <tbody>
              <tr v-for="(valor, clave) in resultado.detalles" :key="clave">
                <td class="label">{{ clave }}</td>
                <td class="valor">{{ typeof valor === 'object' ? JSON.stringify(valor) : valor }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import {
  getEstadoBaseDatos,
  eliminarHorarios,
  limpiarBaseDatosCompleta,
} from '../services/reset/reset.service'

const estado = ref(null)
const loading = ref(false)
const loadingEstado = ref(false)
const loadingHorarios = ref(false)
const loadingCompleto = ref(false)
const error = ref('')
const success = ref('')

const mostrarConfirmacionHorarios = ref(false)
const mostrarConfirmacionCompleto = ref(false)
const confirmacionTexto = ref('')

const resultados = ref([])

const resetMessages = () => {
  error.value = ''
  success.value = ''
}

const refrescarEstado = async () => {
  loadingEstado.value = true
  resetMessages()

  try {
    const { data } = await getEstadoBaseDatos()
    estado.value = data
  } catch (err) {
    error.value = err?.response?.data?.error || 'Error al cargar el estado de la base de datos'
  } finally {
    loadingEstado.value = false
  }
}

const ejecutarEliminarHorarios = async () => {
  loadingHorarios.value = true
  resetMessages()

  try {
    const { data } = await eliminarHorarios()
    success.value = data.mensaje || 'Horarios eliminados correctamente'

    // Agregar a resultados
    resultados.value.unshift({
      tipo: 'Horarios Eliminados',
      mensaje: data.mensaje,
      detalles: data.eliminados,
      timestamp: new Date().toLocaleTimeString(),
    })

    mostrarConfirmacionHorarios.value = false
    await refrescarEstado()
  } catch (err) {
    error.value = err?.response?.data?.error || 'Error al eliminar los horarios'
  } finally {
    loadingHorarios.value = false
  }
}

const ejecutarLimpiarCompleto = async () => {
  loadingCompleto.value = true
  resetMessages()

  try {
    const { data } = await limpiarBaseDatosCompleta()
    success.value = data.mensaje || 'Base de datos limpiada correctamente'

    // Agregar a resultados
    resultados.value.unshift({
      tipo: 'Base de Datos Limpiada',
      mensaje: data.mensaje,
      detalles: data.tablas_limpiadas,
      timestamp: new Date().toLocaleTimeString(),
    })

    mostrarConfirmacionCompleto.value = false
    confirmacionTexto.value = ''
    await refrescarEstado()
  } catch (err) {
    error.value = err?.response?.data?.error || 'Error al limpiar la base de datos'
  } finally {
    loadingCompleto.value = false
  }
}

onMounted(refrescarEstado)
</script>

<style scoped>
.page {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.page-title {
  margin: 0;
  font-size: 28px;
  color: #1f2937;
}

.page-subtitle {
  margin: 5px 0 0 0;
  color: #6b7280;
  font-size: 14px;
}

.alert {
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
  font-weight: 500;
}

.alert.error {
  background: #fee2e2;
  color: #991b1b;
  border: 1px solid #fecaca;
}

.alert.success {
  background: #dcfce7;
  color: #166534;
  border: 1px solid #bbf7d0;
}

.card {
  background: white;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.08);
  margin-bottom: 20px;
  padding: 20px;
}

.estado-card {
  border-left: 4px solid #3b82f6;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #e5e7eb;
}

.card-header h2 {
  margin: 0;
  font-size: 18px;
  color: #1f2937;
}

.estado-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 15px;
}

.estado-item {
  background: #f9fafb;
  padding: 15px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  text-align: center;
}

.estado-item .label {
  display: block;
  font-size: 12px;
  color: #6b7280;
  text-transform: uppercase;
  margin-bottom: 8px;
}

.estado-item .value {
  display: block;
  font-size: 24px;
  font-weight: bold;
  color: #3b82f6;
}

.loading-placeholder {
  padding: 40px;
  text-align: center;
  color: #6b7280;
}

.empty-state {
  padding: 40px;
  text-align: center;
  color: #9ca3af;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.action-card {
  background: white;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.08);
  padding: 20px;
}

.action-card.warning {
  border-left: 4px solid #f59e0b;
}

.action-card.danger {
  border-left: 4px solid #dc2626;
}

.action-header {
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #e5e7eb;
}

.action-header h3 {
  margin: 0 0 8px 0;
  color: #1f2937;
  font-size: 16px;
}

.action-header p {
  margin: 0;
  color: #6b7280;
  font-size: 13px;
}

.confirmation-box {
  background: #fef3c7;
  border: 1px solid #fbbf24;
  border-radius: 8px;
  padding: 15px;
  margin-top: 10px;
}

.action-card.danger .confirmation-box {
  background: #fee2e2;
  border: 1px solid #fca5a5;
}

.warning-text {
  margin: 10px 0;
  color: #92400e;
  font-size: 13px;
  font-weight: 500;
}

.action-card.danger .warning-text {
  color: #7f1d1d;
}

.danger-text {
  margin: 10px 0;
  color: #7f1d1d;
  font-size: 14px;
  font-weight: bold;
}

.bold {
  font-weight: bold;
}

.confirmation-box ul {
  margin: 10px 0;
  padding-left: 20px;
  font-size: 13px;
}

.confirmation-box li {
  margin: 5px 0;
  color: #92400e;
}

.action-card.danger .confirmation-box li {
  color: #7f1d1d;
}

.danger-list {
  background: rgba(220, 38, 38, 0.1);
  padding: 10px 20px;
  border-radius: 6px;
}

.confirmation-text-box {
  background: white;
  padding: 12px;
  border-radius: 6px;
  margin: 12px 0;
}

.confirmation-text-box p {
  margin: 0 0 8px 0;
  font-size: 13px;
  color: #374151;
}

.confirmation-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
  font-family: monospace;
}

.confirmation-buttons {
  display: flex;
  gap: 10px;
  margin-top: 12px;
}

.btn {
  padding: 10px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  font-size: 13px;
  transition: 0.2s;
}

.btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.btn-block {
  width: 100%;
  padding: 12px;
  font-size: 14px;
}

.btn-small {
  padding: 8px 12px;
  font-size: 12px;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-secondary {
  background: #e5e7eb;
  color: #374151;
}

.btn-warning {
  background: #f59e0b;
  color: white;
}

.btn-danger {
  background: #dc2626;
  color: white;
}

.btn-danger-intense {
  background: #7f1d1d;
  color: white;
}

.results-card {
  background: white;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.08);
  padding: 20px;
}

.results-card h3 {
  margin-top: 0;
  color: #1f2937;
}

.resultado-item {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 12px;
  background: #f9fafb;
}

.resultado-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.badge {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.badge.warning {
  background: #fef3c7;
  color: #92400e;
}

.badge.danger {
  background: #fee2e2;
  color: #7f1d1d;
}

.timestamp {
  font-size: 12px;
  color: #9ca3af;
}

.resultado-mensaje {
  margin: 10px 0;
  color: #374151;
  font-size: 14px;
}

.resultado-detalles {
  margin-top: 12px;
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.table td {
  padding: 8px;
  border-bottom: 1px solid #e5e7eb;
}

.table td.label {
  font-weight: 500;
  color: #374151;
  width: 40%;
}

.table td.valor {
  color: #6b7280;
  word-break: break-word;
}

@media (max-width: 768px) {
  .actions-grid {
    grid-template-columns: 1fr;
  }

  .estado-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .btn-block {
    width: 100%;
  }
}
</style>
