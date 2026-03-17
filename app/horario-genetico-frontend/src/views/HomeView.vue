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

        <div class="dropdown">
          <button class="dropdown-btn" @click="toggleCursosMenu">
            Ir a vistas de cursos
          </button>

          <div v-if="showCursosMenu" class="dropdown-menu">
            <RouterLink to="/cursos" class="dropdown-item" @click="closeCursosMenu">
              Gestionar Cursos
            </RouterLink>
            <RouterLink to="/laboratorios" class="dropdown-item" @click="closeCursosMenu">
              Gestionar Laboratorios
            </RouterLink>
          </div>
        </div>
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

<script setup>
import { ref } from 'vue'

const showCursosMenu = ref(false)

const toggleCursosMenu = () => {
  showCursosMenu.value = !showCursosMenu.value
}

const closeCursosMenu = () => {
  showCursosMenu.value = false
}
</script>

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

.dropdown{
  margin-top:14px;
  position:relative;
}

.dropdown-btn{
  border:none;
  padding:8px 12px;
  border-radius:6px;
  cursor:pointer;
  background:#2563eb;
  color:white;
}

.dropdown-menu{
  margin-top:8px;
  border:1px solid #e5e7eb;
  border-radius:8px;
  background:white;
  overflow:hidden;
}

.dropdown-item{
  display:block;
  padding:10px 12px;
  text-decoration:none;
  color:#111827;
}

.dropdown-item:hover{
  background:#f3f4f6;
}

</style>