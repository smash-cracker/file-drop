let socket;
let myDeviceID = null;

function connectWebSocket() {
    socket = new WebSocket(`ws://${window.location.host}/ws`);

    socket.onopen = () => {
        console.log("WebSocket connected");
    };

    socket.onmessage = (event) => {
        const message = JSON.parse(event.data);

        if (message.type === "identity") {
            myDeviceID = message.id;

            console.log("My device ID:", myDeviceID);
        }

        if (message.type === "devices") {
            console.log("Online devices:", message.devices);
        }
    };

    socket.onclose = () => {
        console.log("WebSocket disconnected");
    };

    socket.onerror = (error) => {
        console.error("WebSocket error:", error);
    };
}

connectWebSocket();