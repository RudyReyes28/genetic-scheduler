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

#app{
  width:100%;
  max-width:none;
  margin:0;
  padding:0;
}

.app{
  min-height:100vh;
}

.main-container{
  width:100%;
  max-width:none;
  margin:0;
  padding:30px 0;
  display:flex;
  justify-content:center;
  box-sizing:border-box;
}

.page{
  width:100%;
  max-width:1500px;
  background:white;
  padding:30px;
  border-radius:10px;
  box-shadow:0 3px 10px rgba(0,0,0,0.08);
  box-sizing:border-box;
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