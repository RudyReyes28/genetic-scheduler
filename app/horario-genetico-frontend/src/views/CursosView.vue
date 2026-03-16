<template>
  <div class="page">

    <h1 class="page-title">Cursos</h1>
    <p class="page-subtitle">
      Gestión de cursos disponibles
    </p>

    <button class="btn">
      Agregar Curso
    </button>

    <table class="table">

      <thead>
        <tr>
          <th>Código</th>
          <th>Nombre</th>
          <th>Semestre</th>
          <th>Carrera</th>
        </tr>
      </thead>

      <tbody>
        <tr>
          <td>IPC1</td>
          <td>Introducción a la Programación</td>
          <td>1</td>
          <td>Sistemas</td>
        </tr>
      </tbody>

    </table>

  </div>
</template>

<style scoped>

.btn{
  margin-bottom:15px;
  background:#2563eb;
  color:white;
  border:none;
  padding:8px 14px;
  border-radius:5px;
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
  padding:10px;
  border-bottom:1px solid #ddd;
}

th{
  text-align:left;
  background:#f3f4f6;
}

</style>