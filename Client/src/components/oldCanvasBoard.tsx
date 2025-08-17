import React, { useState, useRef, useEffect, Suspense } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useSocket } from '@context/SocketProvider';
import * as KonvaComponents from 'react-konva';
import { useParams } from 'react-router-dom';

// // Use a dynamic import to ensure Konva components are loaded on the client side.
// const KonvaComponents = React.lazy(() => import('react-konva'));

// Define the type for a drawing line
type LineData = {
  id: string;
  points: number[];
  color: string;
  brushSize: number;
};

// Define the drawing event data sent over the socket
type DrawingEventData = {
  line: LineData;
};

// Define the initial state for the colors
const colors = [
  '#000000', // Black
  '#ff0000', // Red
  '#0000ff', // Blue
  '#008000', // Green
  '#ffff00', // Yellow
  '#ffa500', // Orange
  '#800080', // Purple
];

const CanvasBoard = () => {
  // State for the drawing lines and a flag for drawing in progress
  const [lines, setLines] = useState<LineData[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState<string>('#000000');
  const [brushSize, setBrushSize] = useState<number>(5);
  const socket = useSocket();
  const [userId, setUserId] = useState<string>('');
  const { roomId } = useParams();

  // Ref for the Konva Stage component
  const stageRef = useRef<any>(null);

  useEffect(() => {
    // Generate a unique user ID
    setUserId(uuidv4());

    socket.emit('canvas:join',{roomId})

    // Event listener for incoming drawing data from the server
    socket.on('drawing', ({data,roomId}:{data: DrawingEventData,roomId:string}) => {
      // Add the new line to the lines state
      setLines((prevLines) => {
        // If the line already exists (is being updated), replace it
        const existingLineIndex = prevLines.findIndex(l => l.id === data.line.id);
        if (existingLineIndex !== -1) {
            const updatedLines = [...prevLines];
            updatedLines[existingLineIndex] = data.line;
            return updatedLines;
        }
        // Otherwise, add a new line
        return [...prevLines, data.line];
      });
    });

    // Event listener for a complete canvas state from the server (for new users)
    socket.on('canvasState', (initialLines: LineData[]) => {
      setLines(initialLines);
    });
    
    // Listen for a 'clear' event from the server
    socket.on('clear', () => {
      setLines([]);
    });
  }, []);

  // Handler for mouse down event
  const handleMouseDown = (e: any) => {
    setIsDrawing(true);
    const stage = stageRef.current;
    if (stage) {
      const pos = stage.getPointerPosition();
      if (pos) {
        // Create a new line with a unique ID and add it to the state
        const newLine: LineData = {
          id: uuidv4(),
          points: [pos.x, pos.y],
          color: color,
          brushSize: brushSize,
        };
        setLines([...lines, newLine]);
      }
    }
  };

  // Handler for mouse move event
  const handleMouseMove = (e: any) => {
    if (!isDrawing) {
      return;
    }
    const stage = stageRef.current;
    if (stage) {
      const pos = stage.getPointerPosition();
      if (pos) {
        // Get the last line and add the new point
        const newLines = lines.slice();
        const lastLine = newLines[newLines.length - 1];
        lastLine.points = lastLine.points.concat([pos.x, pos.y]);
        setLines(newLines);
        // Emit the drawing data to the server
        socket?.emit('drawing', {data:{ line: lastLine },roomId:roomId });
      }
    }
  };

  // Handler for mouse up event
  const handleMouseUp = () => {
    setIsDrawing(false);
  };
  
  const handleClear = () => {
    // Clear the local state and inform the server to clear for all clients
    setLines([]);
    socket?.emit('clear',{roomId:roomId});
  };

  // Add touch event handlers
  const handleTouchStart = (e: any) => {
    // Prevent the default behavior to avoid scrolling
    e.evt.preventDefault();
    handleMouseDown(e);
  };

  const handleTouchMove = (e: any) => {
    e.evt.preventDefault();
    handleMouseMove(e);
  };

  const handleTouchEnd = () => {
    handleMouseUp();
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100 font-sans">
      {/* Header and User ID display */}
      <header className="p-4 bg-white shadow-md flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Collaborative Whiteboard</h1>
        <div className="text-sm text-gray-600">
          Your ID: <span className="font-mono text-xs">{userId}</span>
        </div>
      </header>

      {/* Main content area with controls and canvas */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        {/* Controls */}
        <div className="bg-white p-4 rounded-xl shadow-lg flex flex-wrap gap-4 mb-4">
          <div className="flex items-center gap-2">
            <label className="text-gray-700 font-medium">Brush Color:</label>
            <div className="flex gap-2">
              {colors.map((c) => (
                <button
                  key={c}
                  className={`w-8 h-8 rounded-full border-2 transform transition-transform duration-100 hover:scale-110 ${color === c ? 'border-gray-500 scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                  title={c}
                />
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-gray-700 font-medium" htmlFor="brushSize">
              Brush Size:
            </label>
            <input
              id="brushSize"
              type="range"
              min="1"
              max="50"
              value={brushSize}
              onChange={(e) => setBrushSize(parseInt(e.target.value))}
              className="w-32"
            />
            <span className="text-gray-600 font-mono text-sm">{brushSize}</span>
          </div>
          <button
            onClick={handleClear}
            className="px-4 py-2 bg-red-500 text-white rounded-lg shadow-sm hover:bg-red-600 transition-colors"
          >
            Clear Board
          </button>
        </div>

        {/* Konva drawing canvas */}
        <div
          className="flex-1 w-full bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
          style={{ touchAction: 'none' }} // Prevents browser from handling touch as scroll
        >
          <Suspense fallback={<div className="flex justify-center items-center h-full text-lg text-gray-500">Loading drawing canvas...</div>}>
            {KonvaComponents && (
              <KonvaComponents.Stage
                ref={stageRef}
                width={window.innerWidth - 64} // Adjust for padding
                height={window.innerHeight - 200} // Adjust for header and controls
                onMouseDown={handleMouseDown}
                onMousemove={handleMouseMove}
                onMouseup={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                className="cursor-crosshair"
              >
                <KonvaComponents.Layer>
                  {lines.map((line, i) => (
                    <KonvaComponents.Line
                      key={line.id}
                      points={line.points}
                      stroke={line.color}
                      strokeWidth={line.brushSize}
                      tension={0.5}
                      lineCap="round"
                      lineJoin="round"
                      globalCompositeOperation="source-over"
                    />
                  ))}
                </KonvaComponents.Layer>
              </KonvaComponents.Stage>
            )}
          </Suspense>
        </div>
      </div>
    </div>
  );
};

export default CanvasBoard;
