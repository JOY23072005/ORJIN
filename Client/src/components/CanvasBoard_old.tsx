import React, { useEffect, useRef, useState } from 'react';
import { Excalidraw, exportToBlob, serializeAsJSON } from '@excalidraw/excalidraw';
import '@excalidraw/excalidraw/index.css';

const sampleElements = [
  {
    id: 'rect1',
    type: 'rectangle',
    x: 100,
    y: 100,
    width: 200,
    height: 100,
    angle: 0,
    strokeColor: '#4f46e5',
    backgroundColor: 'transparent',
    fillStyle: 'hachure',
    strokeWidth: 2,
    roughness: 1,
    opacity: 100,
    groupIds: [],
    roundness: null,
    seed: 1,
    version: 1,
    versionNonce: 1,
    isDeleted: false,
    boundElementIds: null,
    updated: Date.now(),
    link: null,
    locked: false,
    customData: {},
  },
  {
    id: 'text1',
    type: 'text',
    x: 120,
    y: 130,
    width: 180,
    height: 40,
    angle: 0,
    strokeColor: '#f59e42',
    backgroundColor: 'transparent',
    fillStyle: 'solid',
    strokeWidth: 1,
    roughness: 0,
    opacity: 100,
    groupIds: [],
    roundness: null,
    seed: 2,
    version: 1,
    versionNonce: 2,
    isDeleted: false,
    boundElementIds: null,
    updated: Date.now(),
    link: null,
    locked: false,
    customData: {},
    text: 'Sample Drawing',
    fontSize: 24,
    fontFamily: 1,
    textAlign: 'center',
    verticalAlign: 'middle',
    baseline: 20,
  },
];

const CanvasBoard: React.FC = () => {
  const excalidrawRef = useRef<any>(null); // Use 'any' or the correct type if available
  const [viewMode, setViewMode] = useState(false);

  // Export as PNG
  const handleExportPNG = async () => {
    if (!excalidrawRef.current) return;
    const blob = await exportToBlob({
      elements: excalidrawRef.current.getSceneElements(),
      appState: excalidrawRef.current.getAppState(),
      files: excalidrawRef.current.getFiles(),
      mimeType: 'image/png',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'excalidraw-canvas.png';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export as JSON
  const handleExportJSON = () => {
    if (!excalidrawRef.current) return;
    const json = serializeAsJSON(
      excalidrawRef.current.getSceneElements(),
      excalidrawRef.current.getAppState(),
      excalidrawRef.current.getFiles(),
      'local'
    );
    // For now, just log it
    console.log(json);
    alert('Canvas JSON has been logged to the console.');
  };

  // Clear Canvas
  const handleClear = () => {
    excalidrawRef.current?.updateScene({ elements: [] });
  };

  // Load Sample Drawing
  const handleLoadSample = () => {
    excalidrawRef.current?.updateScene({ elements: sampleElements });
  };

  // Toggle View/Edit Mode
  const handleToggleMode = () => {
    setViewMode((prev) => !prev);
  };

  const getScene = ()=>{
    // console.log(excalidrawRef.current.getSceneElements());
    excalidrawRef.current.updateScene({ elements: []})
  }

  return (
    <div className="flex flex-col h-screen min-h-[600px] bg-gray-950 rounded-xl shadow-lg overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-center gap-2 p-2 bg-gray-900 text-white rounded-t-lg shadow z-10">
        <button className="btn btn-primary px-3 py-1 rounded-lg" onClick={handleExportPNG}>
          Export as PNG
        </button>
        <button className="btn px-3 py-1 rounded-lg bg-secondary-600 hover:bg-secondary-700" onClick={handleExportJSON}>
          Export JSON
        </button>
        <button className="btn px-3 py-1 rounded-lg bg-red-600 hover:bg-red-700" onClick={handleClear}>
          Clear Canvas
        </button>
        <button className="btn px-3 py-1 rounded-lg bg-green-600 hover:bg-green-700" onClick={getScene}>{/* handleLoadSample */}
          Load Sample Drawing
        </button>
        <button className="btn px-3 py-1 rounded-lg bg-gray-700 hover:bg-gray-600 ml-auto" onClick={handleToggleMode}>
          {viewMode ? 'Switch to Edit Mode' : 'Switch to View Mode'}
        </button>
      </div>
      {/* Excalidraw Canvas */}
      <div className="flex-1 min-h-0 min-w-0 h-full w-full">
        <Excalidraw
          excalidrawAPI={(api) => { excalidrawRef.current = api; }}
          theme="dark"
          viewModeEnabled={viewMode}
        />
      </div>
    </div>
  );
};

export default CanvasBoard;