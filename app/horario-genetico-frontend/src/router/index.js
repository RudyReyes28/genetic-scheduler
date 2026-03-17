import { createRouter, createWebHistory } from 'vue-router'

import HomeView from '../views/HomeView.vue'
import CursosView from '../views/CursosView.vue'
import LaboratoriosView from '../views/LaboratoriosView.vue'
import SeccionesView from '../views/SeccionesView.vue'
import SeccionesLaboratorioView from '../views/SeccionesLaboratorioView.vue'
import DocenteCursoView from '../views/DocenteCursoView.vue'
import PeriodosView from '../views/PeriodosView.vue'
import DiasHorarioView from '../views/DiasHorarioView.vue'
import DocentesView from '../views/DocentesView.vue'
import SalonesView from '../views/SalonesView.vue'
import GeneracionView from '../views/GeneracionView.vue'
import ConfiguracionAgenteView from '../views/ConfiguracionAgenteView.vue'
import ReportesView from '../views/ReportesView.vue'
import AcercaDeView from '../views/AcercaDeView.vue'
import CarrerasView from '../views/CarrerasView.vue'
import ImportacionesView from '../views/ImportacionesView.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
  },
    { path: '/carreras', name: 'carreras', component: CarrerasView },

  {
    path: '/cursos',
    name: 'cursos',
    component: CursosView,
  },
  {
    path: '/laboratorios',
    name: 'laboratorios',
    component: LaboratoriosView,
  },
  {
    path: '/secciones',
    name: 'secciones',
    component: SeccionesView,
  },
  {
    path: '/secciones-laboratorio',
    name: 'seccionesLaboratorio',
    component: SeccionesLaboratorioView,
  },
  {
    path: '/docente-curso',
    name: 'docenteCurso',
    component: DocenteCursoView,
  },
  {
    path: '/periodos',
    name: 'periodos',
    component: PeriodosView,
  },
  {
    path: '/dias-horario',
    name: 'diasHorario',
    component: DiasHorarioView,
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
    path: '/configuracion-agente',
    name: 'configuracionAgente',
    component: ConfiguracionAgenteView,
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
  { path: '/importaciones', name: 'importaciones', component: ImportacionesView },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router