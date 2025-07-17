import { Excalidraw } from '@excalidraw/excalidraw'
import '@excalidraw/excalidraw/index.css';
import React, { useRef, useState } from 'react'
import * as Y from 'yjs';

export default function CanvasBoardn() {
  const excalidrawRef = useRef<any>(null);
  const [viewMode,setViewMode] = useState<boolean>(false)

  const ydoc = new Y.Doc();
  const YElemets = ydoc.getArray('elements');
  const YAppState = ydoc.getMap('appState');



  return (
    <div>
      <Excalidraw
        excalidrawAPI={(api) => { excalidrawRef.current = api; }}
        theme="dark"
        viewModeEnabled={viewMode}
      />
    </div>
  )
}
