import { createRouter, createWebHistory } from 'vue-router'

import HomeView from '../views/HomeView.vue'
import CursosView from '../views/CursosView.vue'
import DocentesView from '../views/DocentesView.vue'
import SalonesView from '../views/SalonesView.vue'
import GeneracionView from '../views/GeneracionView.vue'
import ReportesView from '../views/ReportesView.vue'
import AcercaDeView from '../views/AcercaDeView.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
  },
  {
    path: '/cursos',
    name: 'cursos',
    component: CursosView,
  },
  {
    path: '/docentes',
    name: 'docentes',
    component: DocentesView,
  },
  {
    path: '/salones',
    name: 'salones',
    component: SalonesView,
  },
  {
    path: '/generacion',
    name: 'generacion',
    component: GeneracionView,
  },
  {
    path: '/reportes',
    name: 'reportes',
    component: ReportesView,
  },
  {
    path: '/acerca-de',
    name: 'acercaDe',
    component: AcercaDeView,
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router