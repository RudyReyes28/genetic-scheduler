<template>
  <nav class="navbar">
    <div class="logo">
      Scheduler IA
    </div>

    <div class="links">
      <RouterLink to="/">Inicio</RouterLink>

      <div class="dropdown">
        <button class="dropdown-btn" @click="toggleCursosMenu">
          Cursos ▾
        </button>

        <div v-if="showCursosMenu" class="dropdown-menu">
          <RouterLink to="/cursos" class="dropdown-item" @click="closeCursosMenu">
            Gestionar Cursos
          </RouterLink>
          <RouterLink to="/laboratorios" class="dropdown-item" @click="closeCursosMenu">
            Gestionar Laboratorios
          </RouterLink>
          <RouterLink to="/secciones" class="dropdown-item" @click="closeCursosMenu">
            Gestionar Secciones
          </RouterLink>
          <RouterLink to="/secciones-laboratorio" class="dropdown-item" @click="closeCursosMenu">
            Gestionar Secciones-Laboratorio
          </RouterLink>
          <RouterLink to="/docente-curso" class="dropdown-item" @click="closeCursosMenu">
            Docente - Curso
          </RouterLink>
          <RouterLink to="/periodos" class="dropdown-item" @click="closeCursosMenu">
            Ver Periodos
          </RouterLink>
          <RouterLink to="/dias-horario" class="dropdown-item" @click="closeCursosMenu">
            Ver Días-Horario
          </RouterLink>
        </div>
      </div>

      <RouterLink to="/docentes">Docentes</RouterLink>
      <RouterLink to="/carreras">Carreras</RouterLink>
      <RouterLink to="/salones">Salones</RouterLink>
      <RouterLink to="/generacion">Generación</RouterLink>
      <RouterLink to="/configuracion-agente">Config. Agente</RouterLink>
      <RouterLink to="/importaciones">Importaciones</RouterLink>
      <RouterLink to="/reportes">Reportes</RouterLink>
      <RouterLink to="/acerca-de">Acerca de</RouterLink>
    </div>
  </nav>
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

.navbar{
  display:flex;
  justify-content:space-between;
  align-items:center;
  background:#1f2937;
  padding:15px 40px;
}

.logo{
  color:white;
  font-weight:bold;
  font-size:18px;
}

.links{
  display:flex;
  gap:20px;
  align-items:center;
}

a{
  color:#cbd5e1;
  text-decoration:none;
  font-weight:500;
}

a:hover{
  color:white;
}

.router-link-active{
  color:#4ade80;
}

.dropdown{
  position:relative;
}

.dropdown-btn{
  background:transparent;
  border:none;
  color:#cbd5e1;
  font-weight:500;
  cursor:pointer;
  font-size:14px;
}

.dropdown-btn:hover{
  color:white;
}

.dropdown-menu{
  position:absolute;
  top:26px;
  left:0;
  min-width:180px;
  background:#111827;
  border:1px solid #374151;
  border-radius:8px;
  overflow:hidden;
  z-index:50;
}

.dropdown-item{
  display:block;
  padding:10px 12px;
  color:#cbd5e1;
}

.dropdown-item:hover{
  background:#1f2937;
  color:white;
}

</style>