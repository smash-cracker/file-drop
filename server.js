import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";
const dev = process.env.NODE_ENV !== "production";
const hostname = dev ? "localhost" : "0.0.0.0";
const port = 7779;
const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();
app.prepare().then(() => {
    const httpServer = createServer(handler);
    const io = new Server(httpServer);
    io.on("connection", (socket) => {
        console.log("User connected:", socket.id);
        socket.on("join-room", (roomCode) => {
            socket.join(roomCode);
            console.log(`User ${socket.id} joined room: ${roomCode}`);
            const clients = io.sockets.adapter.rooms.get(roomCode);
            if (clients && clients.size === 2) {
                io.to(roomCode).emit("peer-connected");
                console.log(`Room ${roomCode} is now full. Signaling ready.`);
            }
        });
        socket.on("signal", ({ roomCode, data }) => {
            socket.to(roomCode).emit("signal", data);
        });
        socket.on("disconnecting", () => {
            for (const room of socket.rooms) {
                if (room !== socket.id) {
                    socket.to(room).emit("peer-disconnected");
                    console.log(`User ${socket.id} disconnected from room: ${room}`);
                }
            }
        });
        socket.on("disconnect", () => {
            console.log("User disconnected:", socket.id);
        });
    });
    httpServer.listen(port, () => {
        console.log(`> Ready on http://${hostname}:${port}`);
    });
});
