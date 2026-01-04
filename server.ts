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

    // Performance optimization: Force websocket transport to remove handshake lag
    const io = new Server(httpServer, {
        transports: ["websocket"],
        cors: {
            origin: "*",
        }
    });

    io.on("connection", (socket) => {
        console.log("User connected:", socket.id);

        socket.on("join-room", (roomCode: string) => {
            socket.join(roomCode);
            console.log(`User ${socket.id} joined room: ${roomCode}`);

            const clients = io.sockets.adapter.rooms.get(roomCode);
            if (clients && clients.size === 2) {
                // Phase 2 requirement: Log "peer connected"
                io.to(roomCode).emit("peer-connected");
                console.log(`Room ${roomCode} is now full. Signaling ready.`);
            }
        });

        /**
         * PHASE 3: WebRTC Signaling Relay
         * This event forwards WebRTC offers, answers, and ICE candidates
         * from one peer to the other person in the same room.
         */
        socket.on("signal", ({ roomCode, data }) => {
            // Forward the data to everyone in the room EXCEPT the sender
            socket.to(roomCode).emit("signal", data);
        });

        // Handle Disconnection (Phase 2 Fix)
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
