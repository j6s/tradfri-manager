<template>
    <div v-if="device">
        <h1>{{ device.name }}</h1>
        <h6>
            {{ device.manufacturer }}
            {{ device.model }}
        </h6>

        <!-- Lightbulb specific attributes -->
        <template v-if="device.type === 'lightbulb'">

            <!-- Toogle the bulb on and off -->
            <div class="switch form-element">
                <label for="isOn">
                    Off
                    <input type="checkbox" v-model="device.isOn" id="isOn">
                    <span class="lever"></span>
                    On
                </label>
            </div>

            <!-- Colorpicker for devices that are capable of full color -->
            <div class="form-element" v-if="device.hsl">
                <label for="color-picker">Color</label>
                <color-picker :value="device.hsl"
                              @input="device.hsl = $event.hsl"
                              id="color-picker"
                              class="color-picker"
                              :disable-alpha="true"></color-picker>
            </div>

            <!-- Dimmer and temperature adjustment for simple bulbs -->
            <template v-else>

                <div class="form-element">
                    <label for="dimmer">Dimmer: {{ device.dimmerState }}</label>
                    <input type="range"
                           min="0"
                           max="100"
                           v-model="device.dimmerState"
                           id="dimmer">
                </div>

                <div class="form-element" v-if="device.temperature !== undefined">
                    <label for="temperature">Temperature: {{ device.temperature }}</label>
                    <input type="range"
                           min="0"
                           max="100"
                           v-model="device.temperature" id="temperature">
                </div>
            </template>

        </template>

        <div class="form-footer">
            <input type="number" min="0" step="0.25" v-model="transitionTime">
            <button @click="save" class="btn waves-effect waves-light" type="submit" name="action">
                Save
                <i class="material-icons right">send</i>
            </button>
        </div>
    </div>
</template>
<style>
    .form-element {
        padding-top: 15px;
    }

    .form-footer {
        padding-top: 35px;
        display: flex;
        justify-content: flex-end;
    }

    .form-footer input {
        width: 50px !important;
        padding: 0 !important;
        margin-right: 15px !important;
    }

    .form-footer button,
    .form-footer input {
        height: 40px !important;
    }

    .color-picker {
        max-width: 400px;
    }
</style>
<script>
    import {getDeviceInformation, postDeviceState} from '../repository/device';
    import {Chrome} from 'vue-color';

    export default {
        name: 'device-detail',
        components: {
            'color-picker': Chrome,
        },
        props: {
            id: String
        },
        data() {
            return {
                transitionTime: 1,
                device: null
            }
        },
        mounted() {
            getDeviceInformation(this.id)
                .then(device => this.device = device);
        },
        methods: {

            /**
             * Saves the current device state to the backend
             */
            async save() {
                this.device = await postDeviceState(this.device, this.transitionTime);
            },
        }
    }
</script>
