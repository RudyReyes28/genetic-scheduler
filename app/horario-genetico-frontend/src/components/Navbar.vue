<template>
  <nav class="navbar">
    <div class="logo">
      Scheduler IA
    </div>

    <div class="links">
      <RouterLink to="/">Inicio</RouterLink>
      <RouterLink to="/cursos">Cursos</RouterLink>
      <RouterLink to="/docentes">Docentes</RouterLink>
      <RouterLink to="/carreras">Carreras</RouterLink>
      <RouterLink to="/salones">Salones</RouterLink>
      <RouterLink to="/generacion">Generación</RouterLink>
      <RouterLink to="/reportes">Reportes</RouterLink>
      <RouterLink to="/acerca-de">Acerca de</RouterLink>
    </div>
  </nav>
</template>

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

</style>