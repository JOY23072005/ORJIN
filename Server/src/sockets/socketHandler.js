import canvasSocketHandler from './canvasSocket.js';
import fileSocketHandler from './fileSocket.js';
import roomSocketHandler from './roomSocket.js';

export default function socketHandler(io) {
  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    // Initialize each socket module
    roomSocketHandler(io, socket);
    fileSocketHandler(io, socket);
    canvasSocketHandler(io, socket);

    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id);
    });
  });
}
