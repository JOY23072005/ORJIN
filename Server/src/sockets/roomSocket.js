import Room from "../models/room.model.js";
import File from "../models/file.model.js";
import crypto from 'crypto';

const roomOwnerMap = new Map();
const roomToUser = new Map();

const generateRoomId = () => crypto.randomBytes(3).toString('hex').toUpperCase();

export default function roomSocketHandler(io, socket) {
  socket.on('rooms:get', async ({ email }) => {
    try {
      const rooms = await Room.find({
        $or: [
          { 'members.userId': email },
          { createdBy: email }
        ]
      }).lean();

      socket.emit('rooms:fetched', {
        rooms: rooms.map(room => ({
          id: room.roomId,
          name: room.name,
          members: room.members,
          createdBy: room.createdBy
        }))
      });
    } catch (error) {
      console.error('Room fetch error:', error);
      socket.emit('room:error', { message: 'Failed to fetch rooms', error: error.message });
    }
  });

  socket.on('room:create', async ({ email, name }) => {
    try {
      let roomId;
      let isUnique = false;
      let attempts = 0;

      while (!isUnique && attempts < 5) {
        roomId = generateRoomId();
        const exists = await Room.exists({ roomId });
        isUnique = !exists;
        attempts++;
      }

      if (!isUnique) throw new Error('Failed to generate unique roomId');

      const newRoom = await Room.create({
        roomId,
        name: name || `Room ${roomId}`,
        createdBy: email,
        members: [{ userId: email, role: 'owner' }]
      });

      roomOwnerMap.set(newRoom.roomId, socket.id);
      socket.emit("room:created", { roomId });

    } catch (error) {
      console.error('Room creation error:', error);
      socket.emit("room:error", { message: "Room creation failed!" });
    }
  });

  socket.on("room:delete", async ({ roomId, email }) => {
    const room = await Room.findOne({ roomId });
    if (!room) {
      socket.emit("room:error", { message: "Room leave/deletion failed!" });
      return;
    }

    socket.leave(roomId);
    if (room.createdBy === email) {
      await Room.deleteOne({ roomId });
      await File.deleteMany({ roomId });
      roomOwnerMap.delete(roomId);

      const sockets = await io.in(roomId).fetchSockets();
      sockets.forEach(s => {
        s.emit('room deleted by owner', roomId);
        s.leave(roomId);
      });
    } else {
      await Room.findOneAndUpdate(
        { roomId },
        { $pull: { members: { userId: email } } }
      );
    }
    socket.emit("room:deleted", { roomId });
  });

  socket.on("room:join", async ({ roomId,isAnonymous, email }) => {
    if (isAnonymous || roomId === "ORJINDummyRoom") {
      socket.join("ORJINDummyRoom");
      socket.data.roomId = roomId;
      io.to(roomId).emit("file:refresh");  // now triggers filetree fetch
      io.to(roomId).emit("room:joined", { roomData: null, member: { userId: "anonymous", role: "viewer" } });
      // console.log("everything emitted to room!");    
      return;
    }

    if (!roomId || !email) {
      socket.emit("room:error", { message: "Room ID is required" });
      return;
    }
    
    const room = await Room.findOne({ roomId });
    if (!room) {
      socket.emit("room:error", { message: `No room exists with RoomId: ${roomId}` });
      return;
    }

    const isMember = room.members.find(m => m?.userId === email);
    if (!isMember && room.createdBy !== email) {
      await Room.findOneAndUpdate(
        { roomId, "members.userId": { $ne: email } },
        { $addToSet: { members: { userId: email, role: 'editor' } } }
      );
    }
    const member = isMember?isMember:{ userId: email, role: 'editor'};
    socket.join(roomId);
    roomToUser[roomId] = email;
    socket.data.roomId = roomId;
    io.to(roomId).emit("file:refresh");
    io.to(roomId).emit("room:joined", { roomData: room, member: member });
  });

  socket.on("room:leave", ({ roomId }) => {
    if (socket.data.roomId === roomId) {
      socket.leave(roomId);
      delete socket.data.roomId;
      console.log(`${socket.id} left the room`);
    }
  });

  socket.on("disconnect", () => {
    if (socket.data.roomId) {
      socket.leave(socket.data.roomId);
    }
  });

}
