<template>
  <div class="page">

    <h1 class="page-title">
      Sistema de Generación de Horarios
    </h1>

    <p class="page-subtitle">
      Algoritmo Genético para optimización de horarios - CUNOC
    </p>

    <div class="cards">

      <div class="card">
        <h3>Cursos</h3>
        <p>Gestión de cursos del sistema</p>
      </div>

      <div class="card">
        <h3>Docentes</h3>
        <p>Administración de profesores</p>
      </div>

      <div class="card">
        <h3>Salones</h3>
        <p>Configuración de aulas disponibles</p>
      </div>

    </div>

  </div>
</template>

<style scoped>

.cards{
  display:flex;
  gap:20px;
  margin-top:20px;
}

.card{
  flex:1;
  padding:20px;
  border-radius:8px;
  background:#f9fafb;
  border:1px solid #e5e7eb;
  transition:0.2s;
}

.card:hover{
  transform:translateY(-3px);
  box-shadow:0 4px 10px rgba(0,0,0,0.08);
}

.card h3{
  margin-bottom:10px;
}

</style>