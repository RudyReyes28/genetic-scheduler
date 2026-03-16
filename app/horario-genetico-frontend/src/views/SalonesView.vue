<template>
  <div class="page">
    <h1 class="page-title">Salones</h1>
    <p class="page-subtitle">
      Administración de salones y espacios disponibles
    </p>

    <div class="top-bar">
      <button class="btn">Agregar Salón</button>
    </div>

    <table class="table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Nombre</th>
          <th>Capacidad</th>
          <th>Tipo</th>
          <th>Jornada</th>
        </tr>
      </thead>

      <tbody>
        <tr>
          <td>1</td>
          <td>Salón A-01</td>
          <td>45</td>
          <td>Teórico</td>
          <td>Mañana y Tarde</td>
        </tr>
        <tr>
          <td>2</td>
          <td>Laboratorio 2</td>
          <td>30</td>
          <td>Laboratorio</td>
          <td>Tarde</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
</script>

<style scoped>
.top-bar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 15px;
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

.table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  overflow: hidden;
  border-radius: 8px;
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
</style>