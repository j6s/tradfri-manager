<template>
	<div class="collection with-header">
		<h3 class="collection-header">Bulbs</h3>
		<router-link v-for="bulb in bulbs"
				class="collection-item"
				:to="'/device/' + bulb.instanceId">
			{{ bulb.name }}
		</router-link>

		<h3 class="collection-header">Remotes</h3>
		<a v-for="remote in remotes" class="collection-item">
			{{ remote.name }}
		</a>
	</div>
</template>

<script>
	import { fetchDevices } from '../repository/device'

	const DEVICE_TYPE_REMOTE = 0;
	const DEVICE_TYPE_BULB = 2;

	export default {
		name: 'device-list',
		data() { return {
			devices: []
		} },
		mounted() {
			fetchDevices().then(devices => this.devices = devices);
		},
		computed: {
			bulbs() {
				return Object.values(this.devices)
					.filter(device => device.type === DEVICE_TYPE_BULB);
			},

			remotes() {
				return Object.values(this.devices)
					.filter(device => device.type === DEVICE_TYPE_REMOTE);
			}
		}
	}
</script>
