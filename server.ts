import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
    const httpServer = createServer(handler);
    const io = new Server(httpServer);

    io.on("connection", (socket) => {
        console.log("User connected:", socket.id);

        // Join a room based on the 6-digit code
        socket.on("join-room", (roomCode: string) => {
            socket.join(roomCode);
            console.log(`User ${socket.id} joined room: ${roomCode}`);

            // Check if both peers are in the room
            const clients = io.sockets.adapter.rooms.get(roomCode);
            if (clients && clients.size === 2) {
                // Log and notify both peers that they are connected
                io.to(roomCode).emit("peer-connected");
                console.log(`Peer connected in room: ${roomCode}`);
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
