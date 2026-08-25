const socket = new WebSocket(`ws://${window.location.host}/ws`);

socket.onopen = () => {
    console.log("WebSocket connected");

    socket.send("Hello from browser");
};

socket.onmessage = (event) => {
    console.log("Server replied:", event.data);
};

socket.onclose = () => {
    console.log("WebSocket disconnected");
};

socket.onerror = (error) => {
    console.error("WebSocket error:", error);
};