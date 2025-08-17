import File from "../models/file.model.js";
import * as Y from 'yjs';
import { Awareness } from 'y-protocols/awareness.js';
import { applyAwarenessUpdate } from 'y-protocols/awareness.js';


const documents = new Map();
const awarenessStates = new Map();

export default function fileSocketHandler(io, socket) {

  const validateRoomMembership = (roomId) => {
    if (!roomId) {
      socket.emit("file:error", { message: "Room ID is required" });
      return false;
    }
    if (!socket.rooms.has(roomId)) {
      socket.emit("file:error", { message: "Access denied: Not a member of this room" });
      return false;
    }
    return true;
  };

  socket.on("filetree:get", async ({ roomId }) => {
    try {
      if (!validateRoomMembership(roomId)) return;
      const files = await File.find({ roomId }, { content: 0, __v: 0 })
        .sort({ parent: 1, name: 1 });
      socket.emit("filetree:data", files);
    } catch (err) {
      socket.emit("filetree:error", { message: "Failed to fetch file tree" });
    }
  });

  socket.on("yjs:init", async ({ roomId, filePath }) => {
    try {
      if (!validateRoomMembership(roomId)) return;
      const docKey = `${roomId}:${filePath}`;

      if (!documents.has(docKey)) {
        const ydoc = new Y.Doc();
        const awareness = new Awareness(ydoc);
        const ytext = ydoc.getText('monaco');

        const file = await File.findOne({ roomId, path: filePath, type: 'file' });
        if (file?.content) ytext.insert(0, file.content);
        
        awarenessStates.set(docKey, awareness);
        documents.set(docKey, ydoc);

        socket.on('disconnect', () => {
          awareness.setLocalState(null);
        });

        let saveTimeout;
        ytext.observe(() => {
          clearTimeout(saveTimeout);
          saveTimeout = setTimeout(async () => {
            await File.findOneAndUpdate(
              { roomId, path: filePath, type: 'file' },
              { content: ytext.toString(), updatedAt: new Date() }
            );
          }, 2000);
        });
      }

      socket.emit("yjs:ready", {
        filePath,
        state: Y.encodeStateAsUpdate(documents.get(docKey))
      });

    } catch (err) {
      socket.emit("file:error", { message: "Failed to initialize document" });
    }
  });

  socket.on("yjs:update", ({ roomId, filePath, update }) => {
    if (!validateRoomMembership(roomId)) return;
    const docKey = `${roomId}:${filePath}`;
    const ydoc = documents.get(docKey);
    if (ydoc) {
      Y.applyUpdate(ydoc, new Uint8Array(update));
      socket.to(roomId).emit("yjs:update", { filePath, update });
    }
  });

  socket.on("awareness:update", ({ roomId, filePath, update }) => {
    if (!validateRoomMembership(roomId)) return;
    const docKey = `${roomId}:${filePath}`;
    const awareness = awarenessStates.get(docKey);

    if (awareness) {
      try {
        applyAwarenessUpdate(awareness, new Uint8Array(update), socket.id);
        console.log(update);
        socket.to(roomId).emit("awareness:update", { filePath, update });
      } catch (e) {
        console.error("Failed to apply awareness update:", e);
      }
    }
  });


  socket.on("file:add", async ({ roomId, name, path, type, parent }) => {
    try {
      if (!validateRoomMembership(roomId)) return;
      if (!name || !path || !type) {
        socket.emit("file:error", { message: "Missing required fields" });
        return;
      }

      const existing = await File.findOne({ roomId, path });
      if (existing) {
        socket.emit("file:error", { message: "Already exists" });
        return;
      }

      const file = await File.create({
        roomId, name, path, type, parent: parent || null,
        content: type === 'file' ? '' : undefined
      });
      io.to(roomId).emit("file:refresh", file);
      socket.emit("file:added", { file });

    } catch {
      socket.emit("file:error", { message: "Failed to create file/folder" });
    }
  });

  socket.on("file:delete", async ({ roomId, path }) => {
    try {
      if (!validateRoomMembership(roomId)) return;
      await File.deleteMany({
        roomId,
        $or: [{ path }, { parent: { $regex: `^${path}` } }]
      });
      documents.delete(`${roomId}:${path}`);
      io.to(roomId).emit("file:refresh", { deleted: path });
    } catch {
      socket.emit("file:error", { message: "Failed to delete" });
    }
  });

  socket.on("file:rename", async ({ roomId, oldPath, newPath, newName }) => {
    try {
      if (!validateRoomMembership(roomId)) return;
      const existing = await File.findOne({ roomId, path: newPath });
      if (existing) {
        socket.emit("file:error", { message: "Name exists" });
        return;
      }

      const file = await File.findOne({ roomId, path: oldPath });
      if (!file) {
        socket.emit("file:error", { message: "Not found" });
        return;
      }

      const session = await File.startSession();
      try {
        await session.withTransaction(async () => {
          await File.findOneAndUpdate(
            { roomId, path: oldPath },
            { path: newPath, name: newName },
            { session }
          );

          if (file.type === 'folder') {
            const children = await File.find({
              roomId, parent: { $regex: `^${oldPath}` }
            }, null, { session });

            for (const child of children) {
              await File.findOneAndUpdate(
                { _id: child._id },
                {
                  parent: child.parent.replace(oldPath, newPath),
                  path: child.path.replace(oldPath, newPath)
                },
                { session }
              );
            }
          }
        });
        io.to(roomId).emit("file:refresh", { oldPath, newPath });
      } finally {
        await session.endSession();
      }
    } catch {
      socket.emit("file:error", { message: "Rename failed" });
    }
  });
}
