const roomToLinesMap = new Map();

export default function canvasSocketHandler(io, socket) {
  socket.on("canvas:join", ({ roomId }) => {
    if (!roomId) {
      console.error("canvas:join missing roomId");
      return;
    }

    if (!roomToLinesMap.has(roomId)) {
      roomToLinesMap.set(roomId, []);
    }

    const lines = roomToLinesMap.get(roomId) || [];
    console.log(`[canvas] ${socket.id} joining ${roomId}`);

    // Join socket room for broadcasting
    socket.join(roomId);

    // Send the current drawing state to the new user
    socket.emit('canvasState', lines);
  });

  socket.on('drawing', ({ data, roomId }) => {
    const lines = roomToLinesMap.get(roomId);
    if (!lines) return;

    const existingLineIndex = lines.findIndex(l => l.id === data.line.id);
    if (existingLineIndex !== -1) {
      lines[existingLineIndex] = data.line;
    } else {
      lines.push(data.line);
    }

    socket.to(roomId).emit('drawing', {data,roomId});
  });

  socket.on('clear', ({roomId}) => {
    roomToLinesMap.set(roomId,[]);
    socket.to(roomId).emit('clear');
  });
}
