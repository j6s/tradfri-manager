const tradfri = require('node-tradfri-client');
const express = require('express');
const bodyParser = require('body-parser');
const settings = require('./settings.json');
const fs = require('fs');
const AccessoryTypes = require('node-tradfri-client/build/lib/accessory').AccessoryTypes;
const PowerSources = require('node-tradfri-client/build/lib/deviceInfo').PowerSources;

(async () => {
    // Initialize the coap client.
    const client = await initializeCoapClient();
    client.observeDevices();

    // Initialize the express app.
    const app = express();
    app.use(express.static('public'));
    app.use(bodyParser.json());

    /*
     * Get information about all available devices.
     */
    app.get('/api/device', (request, response) => {
        let devices = {};
        for (let device of Object.values(client.devices)) {
            devices[device.instanceId] = formatDevice(device);
        }

        response.set('Content-Type', 'application/json');
        response.send(devices);
    });

    /*
     * Post information about a device.
     */
    app.post('/api/device', (request, response) => {
        response.set('Content-Type', 'application/json');
        const device = request.body.device;
        const transitionTime = request.body.transitionTime || 1;

        // Validate the request.
        if (!device) {
            return response.status(400).send({
                err: 'ERR_NO_DEVICE',
                message: 'The post body must contain the `device` property'
            });
        }

        if (device.type !== 'lightbulb') {
            return response.status(400).send({
                err: 'ERR_NOT_BULB',
                message: 'The passed device must be a bulb'
            });
        }

        console.log(device.id, Object.keys(client.devices));
        if (Object.keys(client.devices).indexOf(device.id.toString()) === -1) {
            return response.status(400).send({
                err: 'ERR_DEVICE_NOT_FOUND',
                message: `No device with the id ${device.id} was found`
            });
        }

        // Update the light properties
        try {
            let state = getState(device);
            state.transitionTime = transitionTime;
            client.operateLight(client.devices[device.id], state);
        } catch (e) {
            return response.status(500).send({
                err: 'ERR_COAP',
                message: `An error occurred while talking to the COAP library: ${e.message}`,
                stack: e.stack.split("\n"),
            });
        }

        // Return the devices new properties.
        response.send(formatDevice(client.devices[device.id]))
    });

    // Start the app.
    settings.port = settings.port || 3111;
    app.listen(settings.port, () => console.log(`Listening on port ${settings.port}`))
})();

/**
 * Initializes the tradfri coap client.
 * This method will automatically discover a tradfri gateway in the
 * network and tries to autenticate with it.
 *
 * If not identify and psk exist, then they are generated for
 * the current app instance.
 *
 * @return {Promise<tradfri.TradfriClient>}
 */
async function initializeCoapClient() {
    // Discover gateways.
    const gateway = await tradfri.discoverGateway();
    const client = new tradfri.TradfriClient(gateway.addresses[0])

    try {
        // Try direct connection using identity & psk.
        await client.connect(settings.identity, settings.psk);
    } catch (e) {
        // Get identity and psk using securityCode.
        const {identity, psk} = await client.authenticate(settings.securityCode);
        await client.connect(identity, psk);
        settings.identity = identity;
        settings.psk = psk;

        // Save the settings file back to disk
        fs.writeFile('settings.json', JSON.stringify(settings, null, 4), 'utf8')
    }

    console.log('Successfully connected');
    return client;
}


/**
 * Formats the given device for usage in API output.
 * This returns a simple Object structure that does not contain any complex
 * types that may not be usable in a JSON context.
 *
 * @typedef {Object} FormattedDevice
 * @property {int} id
 * @property {string} name
 * @property {int} createdAt
 * @property {string} type
 * @property {string} manufacturer
 * @property {string} model
 * @property {string} powerSource
 * @property {boolean} [isOn]               - bulb specific
 * @property {float} [dimmerState]          - white bulb specific
 * @property {float} [colorTemperature]     - white bulb specific
 * @property {Object} hsl                   - color bulb specific
 * @property {float} hsl.h                  - color bulb specific
 * @property {float} hsl.s                  - color bulb specific
 * @property {float} hsl.l                  - color bulb specific
 * @property {float} battery                - remote specific
 *
 * @param {tradfri.Accessory} device
 * @returns {FormattedDevice}
 */
function formatDevice(device) {
    const formatted = {
        id: device.instanceId,
        name: device.name,
        createdAt: device.createdAt,
        type: AccessoryTypes[device.type],
        manufacturer: device.deviceInfo.manufacturer,
        model: device.deviceInfo.modelNumber,
        powerSource: PowerSources[device.deviceInfo.power],
    };

    /*
     * Lightbulb specific properties.
     */
    if (formatted.type === 'lightbulb') {
        const light = device.lightList[0];
        formatted.isOn = light.onOff;

        if (light.spectrum === 'rgb') {
            formatted.hsl = {
                h: light.hue || 0,
                s: light.saturation / 100 || 0,
                l: light.dimmer / 100 || 50,
            }
        }

        if (light.spectrum === 'white') {
            formatted.dimmerState = light.dimmer;
            formatted.temperature = light.colorTemperature;
        }
    }

    if (device.deviceInfo.battery) {
        formatted.battery = device.deviceInfo.battery;
    }

    return formatted;
}

/**
 * Builds a state object from a formatted device that can be used
 * to update a lightbulbs state (e.g. using the `operateLight` method)
 *
 * @typedef {Object} DeviceState
 * @property {boolean} onOff
 * @property {float} dimmer
 * @property {float} [hue]                  - color bulb specific
 * @property {float} [saturation]           - color bulb specific
 * @property {float} [colorTemperature]     - white bulb specific
 *
 * @param {FormattedDevice} device
 * @returns {DeviceState}
 */
function getState(device) {
    let state = { onOff: device.isOn };

    // Colored bulb specific attributes.
    if (device.hsl) {
        state.hue = device.hsl.h || 0;
        state.saturation = device.hsl.s * 100 || 0;
        state.dimmer = device.hsl.l * 100 || 50;
    } else if (device.dimmerState) {
        state.dimmer = device.dimmerState || 50;
    }

    // Light / temperature specific.
    if (device.temperature) {
        state.colorTemperature = device.temperature || 0;
    }

    return state;
}
