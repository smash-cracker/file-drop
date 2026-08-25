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

    if (message.type === "connect-request") {
        console.log(
            `${message.from} wants to connect to you`
        );

        alert(`${message.from} wants to connect to you`);
    }
};

    socket.onclose = () => {
        statusElement.textContent = "Disconnected from server";
    };

    socket.onerror = () => {
        statusElement.textContent = "WebSocket error";
    };
}
function requestConnection(targetDeviceID) {
    console.log("Requesting connection to:", targetDeviceID);

    const message = {
        type: "connect-request",
        target: targetDeviceID
    };

    socket.send(JSON.stringify(message));
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
        const device = document.createElement("button");

        device.textContent = `Connect to ${deviceID}`;
        device.className = "device";

        device.addEventListener("click", () => {
            requestConnection(deviceID);
        });

        devicesElement.appendChild(device);
    }
}

connectWebSocket();