import { createRouter, createWebHistory } from 'vue-router'
import RepClientView from '../views/RepClientView.vue'
import LoadView from '../views/GetData.vue'
import ClientDataView from "../views/ClientDataView.vue"

const routes = [
  {
    path: '/',
    name: 'home',
    component: RepClientView
  },
  {
    path: '/load',
    name: 'load',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    //component: () => import(/* webpackChunkName: "about" */ '../views/AboutView.vue')
    component: LoadView
  }, {
    path: '/data',
    name: 'data',
    component: ClientDataView
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router
