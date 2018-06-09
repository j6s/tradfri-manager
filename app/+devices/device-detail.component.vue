<template>
    <div v-if="device">
        <h1>{{ device.name }}</h1>
        <h6>
            {{ device.deviceInfo.manufacturer }}
            {{ device.deviceInfo.modelNumber }}
        </h6>

        <template v-for="light,index in device.lightList" class="table">


            <div class="switch form-element">
                <label for="onOff">
                    Off
                    <input type="checkbox" v-model="light.onOff" id="onOff">
                    <span class="lever"></span>
                    On
                </label>
            </div>

            <div class="form-element" v-if="light.hue">
                <label for="color-picker">Color</label>
                <color-picker :value="getColor(index)" @input="setColor(index, $event)" id="color-picker"
                              class="form-control" style="max-width: 400px;" :disable-alpha="true"></color-picker>
            </div>

            <template v-else>

                <div class="form-element">
                    <label for="dimmer">Dimmer: {{ light.dimmer }}</label>
                    <input type="range" min="0" max="100" v-model="light.dimmer" id="dimmer">
                </div>

                <div class="form-element" v-if="light.colorTemperature !== undefined">
                    <label for="temperature">Temperature: {{ light.colorTemperature }}</label>
                    <input type="range" min="0" max="100" v-model="light.colorTemperature" id="temperature">
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

            /**
             * Fetches the hsl values from the device data.
             *
             * @param {int} lightIndex - The index of the bulb in the lightList.
             */
            getColor(lightIndex) {
                if (
                    !this.device ||
                    !this.device.lightList[lightIndex]
                ) {
                    return {h: 0, s: 0, l: 0};
                }
                return {
                    h: this.device.lightList[lightIndex].hue,
                    s: this.device.lightList[lightIndex].saturation / 100,
                    l: this.device.lightList[lightIndex].dimmer / 100
                }
            },

            /**
             * Sets the HSL value for the given bulb.
             *
             * @param {int} lightIndex - The index of the bulb in the lightList.
             * @param {Object} color - The color to set. This is an object that must
             *                contain the key `hsl`.
             */
            setColor(lightIndex, color) {
                this.device.lightList[lightIndex].hue = color.hsl.h;
                this.device.lightList[lightIndex].saturation = color.hsl.s * 100;
                this.device.lightList[lightIndex].dimmer = color.hsl.l * 100;
            }
        }
    }
</script>
