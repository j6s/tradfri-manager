let promise;

/**
 * Fetches all devices from the backend.
 * This list is cached is that sucessive calls do not
 * fetch the list every time.
 *
 * @returns {Promise<*[]>}
 */
export function fetchDevices(force = false) {
    if (!promise || force) {
        promise = fetch('/api/device')
            .then(response => response.json())
    }

    return promise;
}

/**
 * Retrieves the information of the device with the given id.
 *
 * @param {string} id
 * @returns {Promise<*>}
 */
export async function getDeviceInformation(id) {
    const devices = await fetchDevices();
    return devices[id];
}

/**
 * Posts the state of the given device to the backend and
 * refetches the information.
 *
 * The returned promise is resolved with the new state of
 * the device.
 *
 * @param {*} device
 * @param {number} transitionTime
 * @returns {Promise<*>}
 */
export function postDeviceState(device, transitionTime = 1) {
    return fetch('/api/device', {
        method: 'POST',
        body: JSON.stringify({device, transitionTime}),
        headers: {
            'Content-Type': 'application/json'
        }
    }).then(response => {
        if (response.status !== 200) {
            return response.json().then(error => {
                console.error(error);
                throw error;
            });
        }

        promise = null;
        return response.json();
    });
}
