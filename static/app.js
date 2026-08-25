let socket;
let myDeviceID = null;

let peerConnection = null;
let connectedPeerID = null;

const statusElement = document.getElementById("status");
const devicesElement = document.getElementById("devices");

const rtcConfiguration = {
    iceServers: []
};

function connectWebSocket() {
    socket = new WebSocket(`ws://${window.location.host}/ws`);

    socket.onopen = () => {
        statusElement.textContent = "Connected to server";
    };

    socket.onmessage = async (event) => {
        const message = JSON.parse(event.data);

        if (message.type === "identity") {
            myDeviceID = message.id;
            console.log("My device ID:", myDeviceID);
        }

        if (message.type === "devices") {
            updateDeviceList(message.devices);
        }

        if (message.type === "connect-request") {
            await handleConnectionRequest(message.from);
        }

        if (message.type === "webrtc-offer") {
            await handleOffer(message);
        }

        if (message.type === "webrtc-answer") {
            await handleAnswer(message);
        }
    };

    socket.onclose = () => {
        statusElement.textContent = "Disconnected from server";
    };

    socket.onerror = (error) => {
        console.error("WebSocket error:", error);
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
        const device = document.createElement("button");

        device.textContent = `Connect to ${deviceID}`;
        device.className = "device";

        device.addEventListener("click", () => {
            requestConnection(deviceID);
        });

        devicesElement.appendChild(device);
    }
}

function requestConnection(targetDeviceID) {
    console.log("Requesting connection to:", targetDeviceID);

    connectedPeerID = targetDeviceID;

    socket.send(JSON.stringify({
        type: "connect-request",
        target: targetDeviceID
    }));
}

async function handleConnectionRequest(fromDeviceID) {
    console.log(`${fromDeviceID} wants to connect`);

    connectedPeerID = fromDeviceID;

    await createPeerConnection();

    const offer = await peerConnection.createOffer();

    await peerConnection.setLocalDescription(offer);

    socket.send(JSON.stringify({
        type: "webrtc-offer",
        target: fromDeviceID,
        sdp: offer.sdp
    }));

    console.log("WebRTC offer sent");
}

async function handleOffer(message) {
    console.log("Received WebRTC offer from:", message.from);

    connectedPeerID = message.from;

    await createPeerConnection();

    await peerConnection.setRemoteDescription({
        type: "offer",
        sdp: message.sdp
    });

    const answer = await peerConnection.createAnswer();

    await peerConnection.setLocalDescription(answer);

    socket.send(JSON.stringify({
        type: "webrtc-answer",
        target: message.from,
        sdp: answer.sdp
    }));

    console.log("WebRTC answer sent");
}

async function handleAnswer(message) {
    console.log("Received WebRTC answer from:", message.from);

    await peerConnection.setRemoteDescription({
        type: "answer",
        sdp: message.sdp
    });

    console.log("Remote description set");
}

async function createPeerConnection() {
    if (peerConnection) {
        return;
    }

    peerConnection = new RTCPeerConnection(rtcConfiguration);

    peerConnection.onconnectionstatechange = () => {
        console.log(
            "WebRTC connection state:",
            peerConnection.connectionState
        );
    };

    peerConnection.oniceconnectionstatechange = () => {
        console.log(
            "ICE connection state:",
            peerConnection.iceConnectionState
        );
    };

    // For now, we're only testing the connection.
    // We'll use a DataChannel for file transfer later.
    peerConnection.ondatachannel = (event) => {
        const channel = event.channel;

        channel.onopen = () => {
            console.log("Data channel opened");
        };

        channel.onmessage = (event) => {
            console.log("Data channel message:", event.data);
        };
    };
}

connectWebSocket();