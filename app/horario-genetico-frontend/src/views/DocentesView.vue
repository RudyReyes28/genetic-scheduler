<template>
  <div class="page">

    <h1 class="page-title">Docentes</h1>

    <p class="page-subtitle">
      Administración de docentes disponibles para impartir cursos
    </p>

    <div class="top-bar">
      <button class="btn">Agregar Docente</button>
    </div>

    <table class="table">

      <thead>
        <tr>
          <th>Registro</th>
          <th>Nombre</th>
          <th>Hora Entrada</th>
          <th>Hora Salida</th>
          <th>Cursos posibles</th>
        </tr>
      </thead>

      <tbody>

        <tr>
          <td>DOC001</td>
          <td>Juan Pérez</td>
          <td>07:00</td>
          <td>14:00</td>
          <td>IPC1, Mate1</td>
        </tr>

        <tr>
          <td>DOC002</td>
          <td>José López</td>
          <td>13:00</td>
          <td>21:00</td>
          <td>Base de Datos</td>
        </tr>

      </tbody>

    </table>

  </div>
</template>

<script setup>
</script>

<style scoped>

.top-bar{
  display:flex;
  justify-content:flex-end;
  margin-bottom:15px;
}

.btn{
  background:#2563eb;
  color:white;
  border:none;
  padding:9px 14px;
  border-radius:6px;
  cursor:pointer;
  font-weight:500;
}

.btn:hover{
  background:#1d4ed8;
}

.table{
  width:100%;
  border-collapse:collapse;
  background:white;
  border-radius:8px;
  overflow:hidden;
}

th, td{
  padding:12px;
  border-bottom:1px solid #e5e7eb;
  text-align:left;
}

th{
  background:#f3f4f6;
  color:#374151;
}

tbody tr:hover{
  background:#f9fafb;
}

</style>