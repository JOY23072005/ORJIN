// src/index.js
import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server as SocketServer } from 'socket.io';
import fileSocketHandler from './sockets/fileSocket.js';
import canvasSocketHandler from './sockets/canvasSocket.js';
import { connectDB } from './utils/db.js';
import dotenv from "dotenv";
dotenv.config();

const app = express();

// ✅ Setup CORS with correct origin
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
}));

app.use(express.json());

const server = http.createServer(app);

// ✅ Pass matching CORS config to Socket.IO
const io = new SocketServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// ✅ Health check
app.get('/ping', (req, res) => {
  res.status(200).send('pong');
});

// ✅ Connect MongoDB
await connectDB();

// ✅ Attach Socket.IO handlers
fileSocketHandler(io);
canvasSocketHandler(io);

// ✅ Listen on PORT
const PORT = process.env.PORT || 9000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
