<template>
  <div class="page">

    <h1 class="page-title">Acerca de</h1>

    <p class="page-subtitle">
      Proyecto de Inteligencia Artificial 1
    </p>

    <div class="info">

      <p><b>Universidad:</b> Universidad San Carlos de Guatemala</p>
      <p><b>Centro:</b> Centro Universitario de Occidente (CUNOC)</p>
      <p><b>Carrera:</b> Ingeniería en Ciencias y Sistemas</p>
      <p><b>Curso:</b> Inteligencia Artificial 1</p>
      <p><b>Docente:</b> Ing. Daniel Gonzalez</p>

    </div>

    <div class="project">

      <h2>Descripción del Proyecto</h2>

      <p>
        Este sistema tiene como objetivo generar automáticamente horarios académicos
        para la División de Ciencias de la Ingeniería del CUNOC mediante el uso de
        algoritmos genéticos.
      </p>

      <p>
        El algoritmo evalúa múltiples combinaciones posibles de asignación de cursos,
        docentes, salones y horarios, buscando minimizar conflictos y optimizar
        el uso de los recursos disponibles. Entre las restricciones consideradas se
        encuentran la disponibilidad de docentes, la capacidad de los salones,
        los horarios permitidos y la evitación de traslapes entre cursos del mismo
        semestre.
      </p>

      <p>
        A través de múltiples generaciones, el algoritmo evoluciona las soluciones
        hasta encontrar un horario óptimo o cercano al óptimo, reduciendo conflictos
        y mejorando la organización académica.
      </p>

    </div>

    <div class="team">

      <h2>Desarrolladores</h2>

      <ul>
        <li><b>Rudy Reyes</b> — 202031213</li>
        <li><b>Eiler Gomez</b> — 202031693</li>
      </ul>

    </div>

  </div>
</template>

<style scoped>

.info{
  margin-top:20px;
  line-height:1.8;
}

.project{
  margin-top:30px;
}

.project h2{
  margin-bottom:10px;
}

.project p{
  margin-bottom:12px;
  line-height:1.6;
  color:#444;
}

.team{
  margin-top:30px;
}

.team ul{
  padding-left:20px;
}

.team li{
  margin-bottom:8px;
}

</style>