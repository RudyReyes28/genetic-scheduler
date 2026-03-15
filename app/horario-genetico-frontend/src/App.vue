<template>
  <div class="app">
    <Navbar />

    <main class="main-container">
      <RouterView />
    </main>
  </div>
</template>

<script setup>
import Navbar from './components/Navbar.vue'
</script>

<style>
body{
  margin:0;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background:#f4f6f9;
}

.main-container{
  max-width:1100px;
  margin:auto;
  padding:30px;
}

.page{
  background:white;
  padding:30px;
  border-radius:10px;
  box-shadow:0 3px 10px rgba(0,0,0,0.08);
}

.page-title{
  font-size:28px;
  font-weight:600;
  margin-bottom:10px;
}

.page-subtitle{
  color:#666;
  margin-bottom:25px;
}
</style>