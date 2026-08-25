let socket;
let myDeviceID = null;

const statusElement = document.getElementById("status");
const devicesElement = document.getElementById("devices");

function connectWebSocket() {
    socket = new WebSocket(`ws://${window.location.host}/ws`);

    socket.onopen = () => {
        statusElement.textContent = "Connected to server";
    };

    socket.onmessage = (event) => {
        const message = JSON.parse(event.data);

        if (message.type === "identity") {
            myDeviceID = message.id;

            console.log("My device ID:", myDeviceID);
        }

        if (message.type === "devices") {
            updateDeviceList(message.devices);
        }
    };

    socket.onclose = () => {
        statusElement.textContent = "Disconnected from server";
    };

    socket.onerror = () => {
        statusElement.textContent = "WebSocket error";
    };
}

function updateDeviceList(devices) {
    devicesElement.innerHTML = "";

    const otherDevices = devices.filter(
        deviceID => deviceID !== myDeviceID
    );

    if (otherDevices.length === 0) {
        devicesElement.innerHTML = "<p>No other devices online.</p>";
        return;
    }

    for (const deviceID of otherDevices) {
        const device = document.createElement("div");

        device.textContent = deviceID;
        device.className = "device";

        devicesElement.appendChild(device);
    }
}

connectWebSocket();