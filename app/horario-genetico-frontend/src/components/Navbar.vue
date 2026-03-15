<template>
  <nav class="navbar">
    <RouterLink to="/">Inicio</RouterLink>
    <RouterLink to="/cursos">Cursos</RouterLink>
    <RouterLink to="/docentes">Docentes</RouterLink>
    <RouterLink to="/salones">Salones</RouterLink>
    <RouterLink to="/generacion">Generación</RouterLink>
    <RouterLink to="/reportes">Reportes</RouterLink>
    <RouterLink to="/acerca-de">Acerca de</RouterLink>
  </nav>
</template>

<script setup>
</script>

<style scoped>
.navbar {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: #f2f2f2;
  flex-wrap: wrap;
}

a {
  text-decoration: none;
  color: #333;
  font-weight: 600;
}

.router-link-active {
  color: #42b883;
}
</style>