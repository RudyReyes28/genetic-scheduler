<template>
  <div class="page">
    <h1 class="page-title">Reportes</h1>
    <p class="page-subtitle">
      Consulta y exportación de resultados del algoritmo genético
    </p>

    <div class="report-grid">
      <div class="report-card">
        <h3>Horario General</h3>
        <p>Visualizar el horario completo generado para cursos y laboratorios.</p>
        <button class="btn">Ver reporte</button>
      </div>

      <div class="report-card">
        <h3>Solo Cursos</h3>
        <p>Consultar únicamente los bloques correspondientes a cursos teóricos.</p>
        <button class="btn">Ver reporte</button>
      </div>

      <div class="report-card">
        <h3>Solo Laboratorios</h3>
        <p>Filtrar y visualizar únicamente los laboratorios asignados.</p>
        <button class="btn">Ver reporte</button>
      </div>

      <div class="report-card">
        <h3>Exportar PDF / CSV</h3>
        <p>Descargar reportes en formatos PDF y CSV para entrega o revisión.</p>
        <button class="btn success">Exportar</button>
      </div>
    </div>
  </div>
</template>

<script setup>
</script>

<style scoped>
.report-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.report-card {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 20px;
  transition: 0.2s;
}

.report-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.08);
}

.report-card h3 {
  margin-top: 0;
  margin-bottom: 10px;
  color: #111827;
}

.report-card p {
  color: #4b5563;
  margin-bottom: 16px;
  line-height: 1.5;
}

.btn {
  background: #2563eb;
  color: white;
  border: none;
  padding: 9px 14px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}

.btn:hover {
  background: #1d4ed8;
}

.success {
  background: #16a34a;
}

.success:hover {
  background: #15803d;
}
</style>