const tradfri = require('node-tradfri-client');
const express = require('express');
const bodyParser = require('body-parser');
const settings = require('./settings.json');
const fs = require('fs');

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
        response.set('Content-Type', 'application/json')
        response.send(JSON.stringify(client.devices))
    });

    /*
     * Post information about a device.
     */
    app.post('/api/device', (request, response) => {
        const device = request.body.device;
        const transitionTime = request.body.transitionTime || 1;

        device.lightList.forEach((state, index) => {
            const light = client.devices[device.instanceId];
            state.transitionTime = transitionTime;
            console.log({light, state})
            client.operateLight(light, state);
        });

        response.set('Content-Type', 'application/json')
        response.send(JSON.stringify(client.devices[device.instanceId]))
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
