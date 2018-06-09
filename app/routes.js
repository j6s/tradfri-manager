import Router from 'vue-router'
import DeviceListComponent from './+devices/devices-list.component.vue'
import DeviceDetailComponent from './+devices/device-detail.component.vue'

export const router = new Router({
    routes: [
        {path: '', redirect: '/device'},
        {path: '/device', component: DeviceListComponent},
        {path: '/device/:id', component: DeviceDetailComponent, props: true}
    ]
})
