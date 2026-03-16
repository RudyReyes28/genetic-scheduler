<template>
  <div class="page">

    <h1 class="page-title">Generación de Horarios</h1>

    <p class="page-subtitle">
      Ejecución del algoritmo genético
    </p>

    <button class="run">
      Ejecutar Algoritmo
    </button>

    <div class="chart">
      Aquí se mostrará la gráfica de evolución
    </div>

  </div>
</template>

<style scoped>

.run{
  background:#16a34a;
  color:white;
  border:none;
  padding:10px 18px;
  border-radius:6px;
  cursor:pointer;
}

.run:hover{
  background:#15803d;
}

.chart{
  margin-top:25px;
  height:300px;
  background:#f3f4f6;
  border-radius:8px;
  display:flex;
  align-items:center;
  justify-content:center;
  color:#555;
}

</style>