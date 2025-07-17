// src/sockets/fileSocket.js
import File from "../models/file.model.js";
import { Server } from "socket.io";
import * as Y from 'yjs';
// import { setupWSConnection } from 'y-websocket';

const documents = new Map(); // Store Y.Doc instances per file

export default function fileSocketHandler(io) {
  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    // Helper function to validate room membership
    const validateRoomMembership = (roomId) => {
      if (!roomId) {
        socket.emit("file:error", { message: "Room ID is required" });
        return false;
      }
      
      if (!socket.rooms.has(roomId)) {
        socket.emit("file:error", { message: "Access denied: You are not a member of this room" });
        return false;
      }
      
      return true;
    };

    // Join a room
    socket.on("room:join", (roomId) => {
      if (!roomId) {
        socket.emit("room:error", { message: "Room ID is required" });
        return;
      }
      
      socket.join(roomId);
      console.log(`Socket ${socket.id} joined room ${roomId}`);
      io.to(roomId).emit("file:refresh");
      socket.emit("room:joined", { roomId });
    });

    // Get file tree
    socket.on("filetree:get", async ({ roomId }) => {
      try {
        if (!validateRoomMembership(roomId)) return;

        const files = await File.find(
          { roomId },
          { content: 0, __v: 0 }
        ).sort({ parent: 1, name: 1 });

        socket.emit("filetree:data", files);
      } catch (err) {
        console.error("filetree:get error", err);
        socket.emit("filetree:error", { message: "Failed to fetch file tree" });
      }
    });

    // Initialize Yjs document for file
    socket.on("yjs:init", async ({ roomId, filePath }) => {
      try {
        if (!validateRoomMembership(roomId)) return;

        const docKey = `${roomId}:${filePath}`;
        
        if (!documents.has(docKey)) {
          const ydoc = new Y.Doc();
          const ytext = ydoc.getText('monaco');
          
          // Load initial content from database
          const file = await File.findOne({ roomId, path: filePath, type: 'file' });
          if (file && file.content) {
            ytext.insert(0, file.content);
          }
          
          documents.set(docKey, ydoc);
          
          // Save to database on changes (debounced)
          let saveTimeout;
          ytext.observe(() => {
            clearTimeout(saveTimeout);
            saveTimeout = setTimeout(async () => {
              try {
                await File.findOneAndUpdate(
                  { roomId, path: filePath, type: 'file' },
                  { content: ytext.toString(), updatedAt: new Date() }
                );
              } catch (err) {
                console.error("Save error:", err);
              }
            }, 2000);
          });
        }

        const ydoc = documents.get(docKey);
        socket.emit("yjs:ready", { 
          filePath, 
          state: Y.encodeStateAsUpdate(ydoc)
        });
        
      } catch (err) {
        console.error("yjs:init error", err);
        socket.emit("file:error", { message: "Failed to initialize document" });
      }
    });

    // Handle Yjs updates
    socket.on("yjs:update", ({ roomId, filePath, update }) => {
      try {
        if (!validateRoomMembership(roomId)) return;

        const docKey = `${roomId}:${filePath}`;
        const ydoc = documents.get(docKey);
        
        if (ydoc) {
          Y.applyUpdate(ydoc, new Uint8Array(update));
          // Broadcast to other clients in the room
          socket.to(roomId).emit("yjs:update", { filePath, update });
        }
      } catch (err) {
        console.error("yjs:update error", err);
      }
    });

    // Add file/folder
    socket.on("file:add", async ({ roomId, name, path, type, parent }) => {
      try {
        if (!validateRoomMembership(roomId)) return;

        if (!name || !path || !type) {
          socket.emit("file:error", { message: "Missing required fields" });
          return;
        }

        const existingFile = await File.findOne({ roomId, path });
        if (existingFile) {
          socket.emit("file:error", { message: "File or folder already exists" });
          return;
        }

        const file = await File.create({
          roomId,
          name,
          path,
          type,
          parent: parent || null,
          content: type === 'file' ? '' : undefined,
        });
        io.to(roomId).emit("file:refresh", file);
        socket.emit("file:added", { file });
        
      } catch (err) {
        console.error("file:add error", err);
        socket.emit("file:error", { message: "Failed to create file/folder" });
      }
    });

    // Delete file/folder
    socket.on("file:delete", async ({ roomId, path }) => {
      try {
        if (!validateRoomMembership(roomId)) return;

        if (!path) {
          socket.emit("file:error", { message: "Missing required fields" });
          return;
        }

        const file = await File.findOne({ roomId, path });
        if (!file) {
          socket.emit("file:error", { message: "File or folder not found" });
          return;
        }

        await File.deleteMany({ 
          roomId, 
          $or: [
            { path },
            { parent: { $regex: `^${path}` } }
          ]
        });

        // Clean up Yjs documents
        const docKey = `${roomId}:${path}`;
        documents.delete(docKey);

        io.to(roomId).emit("file:refresh", { deleted: path });
        
      } catch (err) {
        console.error("file:delete error", err);
        socket.emit("file:error", { message: "Failed to delete file/folder" });
      }
    });

    socket.on("file:rename", async ({ roomId, oldPath, newPath, newName }) => {
      try {
        // Validate room membership
        if (!validateRoomMembership(roomId)) return;

        // Validate input
        if (!oldPath || !newPath || !newName) {
          socket.emit("file:error", { message: "Missing required fields" });
          return;
        }

        // Check if target already exists
        const existingFile = await File.findOne({ roomId, path: newPath });
        if (existingFile) {
          socket.emit("file:error", { message: "A file or folder with this name already exists" });
          return;
        }

        // Find the file to rename
        const file = await File.findOne({ roomId, path: oldPath });
        if (!file) {
          socket.emit("file:error", { message: "File or folder not found" });
          return;
        }

        // Start a transaction for atomic updates
        const session = await File.startSession();
        
        try {
          await session.withTransaction(async () => {
            // Update the file itself
            await File.findOneAndUpdate(
              { roomId, path: oldPath },
              { path: newPath, name: newName },
              { new: true, session }
            );

            // If it's a folder, update all children's parent paths
            if (file.type === 'folder') {
              const children = await File.find({ 
                roomId, 
                parent: { $regex: `^${oldPath}` } 
              }, null, { session });

              for (const child of children) {
                const newParentPath = child.parent.replace(oldPath, newPath);
                const newChildPath = child.path.replace(oldPath, newPath);
                
                await File.findOneAndUpdate(
                  { _id: child._id },
                  { parent: newParentPath, path: newChildPath },
                  { session }
                );
              }
            }
          });

          // Emit refresh to all clients in the room
          io.to(roomId).emit("file:refresh", { oldPath, newPath });
          
        } finally {
          await session.endSession();
        }

      } catch (err) {
        console.error("file:rename error", err);
        socket.emit("file:error", { message: "Failed to rename file/folder" });
      }
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id);
    });
  });
}