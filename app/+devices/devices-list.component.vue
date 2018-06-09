<template>
    <div class="collection with-header">
        <h3 class="collection-header">Bulbs</h3>
        <router-link v-for="bulb in bulbs"
                     class="collection-item"
                     :to="`/device/${bulb.id}`">
            {{ bulb.name }}
        </router-link>

        <h3 class="collection-header">Remotes</h3>
        <a v-for="remote in remotes" class="collection-item">
            {{ remote.name }}
        </a>
    </div>
</template>

<script>
    import {fetchDevices} from '../repository/device'

    export default {
        name: 'device-list',
        data() {
            return {
                devices: []
            }
        },
        mounted() {
            fetchDevices().then(devices => this.devices = devices);
        },
        computed: {
            bulbs() {
                return Object.values(this.devices)
                    .filter(device => device.type === 'lightbulb');
            },

            remotes() {
                return Object.values(this.devices)
                    .filter(device => device.type === 'remote');
            }
        }
    }
</script>
