import { useState, useRef, useEffect, Suspense } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useSocket } from '@context/SocketProvider';
import * as KonvaComponents from 'react-konva';
import { useParams } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

// Define the type for a drawing line
type LineData = {
  id: string;
  points: number[];
  color: string;
  brushSize: number;
};

type DrawingEventData = {
  line: LineData;
};

const colors = ['#000000', '#ff0000', '#0000ff', '#008000', '#ffff00', '#ffa500', '#800080'];

const CanvasBoard = () => {
  const [lines, setLines] = useState<LineData[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState<string>('#000000');
  const [brushSize, setBrushSize] = useState<number>(5);
  const socket = useSocket();
  const [userId, setUserId] = useState<string>('');
  const { roomId } = useParams();
  const { theme } = useTheme();

  const stageRef = useRef<any>(null);

  useEffect(() => {
    setUserId(uuidv4());
    socket.emit('canvas:join', { roomId });

    const handleDrawing = ({ data }: { data: DrawingEventData }) => {
      setLines((prevLines) => {
        const existingLineIndex = prevLines.findIndex((l) => l.id === data.line.id);
        if (existingLineIndex !== -1) {
          const updatedLines = [...prevLines];
          updatedLines[existingLineIndex] = data.line;
          return updatedLines;
        }
        return [...prevLines, data.line];
      });
    }

    socket.on('drawing', handleDrawing);

    socket.on('canvasState', (initialLines: LineData[]) => {
      setLines(initialLines);
    });

    socket.on('clear', () => {
      console.log(lines);
      setLines([]);
    });
    return ()=>{
      socket.off('drawing',handleDrawing);
      socket.off('canvasState',setLines);
      socket.off('clear');
    }
  }, []);

  const handleMouseDown = (e: any) => {
    console.log(e);
    setIsDrawing(true);
    const stage = stageRef.current;
    if (stage) {
      const pos = stage.getPointerPosition();
      if (pos) {
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

  const handleMouseMove = (e: any) => {
    console.log(e);
    if (!isDrawing) return;
    const stage = stageRef.current;
    if (stage) {
      const pos = stage.getPointerPosition();
      if (pos) {
        const newLines = lines.slice();
        const lastLine = newLines[newLines.length - 1];
        lastLine.points = lastLine.points.concat([pos.x, pos.y]);
        setLines(newLines);
        socket?.emit('drawing', { data: { line: lastLine }, roomId });
      }
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  const handleClear = () => {
    setLines([]);
    socket?.emit('clear', { roomId });
  };

  const handleTouchStart = (e: any) => {
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
    <div
      className={`flex flex-col h-screen font-sans transition-colors duration-300 ${
        theme === 'dark' ? 'bg-gray-950 text-gray-100' : 'bg-gray-100 text-gray-900'
      }`}
    >
      {/* Header */}
      <header
        className={`p-4 shadow-md flex justify-between items-center transition-colors duration-300 ${
          theme === 'dark' ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-800'
        }`}
      >
        <h1 className="text-2xl font-bold">Collaborative Whiteboard</h1>
        <div className="text-sm">
          Your ID: <span className="font-mono text-xs">{userId}</span>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        {/* Controls */}
        <div
          className={`p-4 rounded-xl shadow-lg flex flex-wrap gap-4 mb-4 transition-colors duration-300 ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          }`}
        >
          <div className="flex items-center gap-2">
            <label className="font-medium">Brush Color:</label>
            <div className="flex gap-2">
              {colors.map((c) => (
                <button
                  key={c}
                  className={`w-8 h-8 rounded-full border-2 transform transition-transform duration-100 hover:scale-110 ${
                    color === c ? 'border-gray-500 scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                  title={c}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="font-medium" htmlFor="brushSize">
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
            <span className="font-mono text-sm">{brushSize}</span>
          </div>

          <button
            onClick={handleClear}
            className="px-4 py-2 bg-red-500 text-white rounded-lg shadow-sm hover:bg-red-600 transition-colors"
          >
            Clear Board
          </button>
        </div>

        {/* Canvas */}
        <div
          className={`flex-1 w-full rounded-xl shadow-lg border overflow-hidden transition-colors duration-300 ${
            theme === 'dark'
              ? 'bg-gray-800 border-gray-700'
              : 'bg-white border-gray-200'
          }`}
          style={{ touchAction: 'none' }}
        >
          <Suspense
            fallback={
              <div className="flex justify-center items-center h-full text-lg text-gray-500">
                Loading drawing canvas...
              </div>
            }
          >
            {KonvaComponents && (
              <KonvaComponents.Stage
                ref={stageRef}
                width={window.innerWidth - 64}
                height={window.innerHeight - 200}
                onMouseDown={handleMouseDown}
                onMousemove={handleMouseMove}
                onMouseup={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                className="cursor-crosshair"
              >
                <KonvaComponents.Layer>
                  {lines.map((line) => (
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