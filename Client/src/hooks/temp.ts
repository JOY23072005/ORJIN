// src/hooks/useYjsEditor.ts
import { useEffect, useRef, useState } from 'react';
import * as Y from 'yjs';
import { MonacoBinding } from 'y-monaco';
import { useSocket } from '../context/SocketProvider';
import * as monaco from 'monaco-editor';

interface YjsInitPayload {
  roomId: string;
  filePath: string;
}

interface YjsReadyPayload {
  filePath: string;
  state: number[]; // Array sent from server
}

interface YjsUpdatePayload {
  filePath: string;
  update: number[];
}

export const useYjsEditor = (
  roomId: string | undefined,
  filePath: string | undefined,
  editor: monaco.editor.IStandaloneCodeEditor | null
) => {
  const socket = useSocket();

  // Use state for values that need to trigger re-renders
  const [ydoc, setYdoc] = useState<Y.Doc | null>(null);
  const [binding, setBinding] = useState<MonacoBinding | null>(null);
  
  // Keep refs for cleanup
  const ydocRef = useRef<Y.Doc | null>(null);
  const bindingRef = useRef<MonacoBinding | null>(null);

  useEffect(() => {
    // Clean up previous instances
    if (bindingRef.current) {
      bindingRef.current.destroy();
      bindingRef.current = null;
      setBinding(null);
    }
    
    if (ydocRef.current) {
      ydocRef.current.destroy();
      ydocRef.current = null;
      setYdoc(null);
    }

    if (!roomId || !filePath || !editor) return;

    const newYdoc = new Y.Doc();
    const ytext = newYdoc.getText('monaco');
    
    ydocRef.current = newYdoc;
    setYdoc(newYdoc);

    const newBinding = new MonacoBinding(
      ytext,
      editor.getModel()!,
      new Set([editor]),
      null
    );
    
    bindingRef.current = newBinding;
    setBinding(newBinding);

    // Ask server for doc state
    socket.emit('yjs:init', { roomId, filePath } as YjsInitPayload);

    const handleReady = ({ filePath: receivedPath, state }: YjsReadyPayload) => {
      if (receivedPath === filePath && ydocRef.current) {
        Y.applyUpdate(ydocRef.current, new Uint8Array(state));
      }
    };

    const handleUpdate = ({ filePath: receivedPath, update }: YjsUpdatePayload) => {
      if (receivedPath === filePath && ydocRef.current) {
        Y.applyUpdate(ydocRef.current, new Uint8Array(update));
      }
    };

    socket.on('yjs:ready', handleReady);
    socket.on('yjs:update', handleUpdate);

    const updateHandler = (update: Uint8Array) => {
      socket.emit('yjs:update', {
        roomId,
        filePath,
        update: Array.from(update),
      } as YjsUpdatePayload & YjsInitPayload);
    };

    newYdoc.on('update', updateHandler);

    return () => {
      socket.off('yjs:ready', handleReady);
      socket.off('yjs:update', handleUpdate);
      if (ydocRef.current) {
        ydocRef.current.off('update', updateHandler);
        ydocRef.current.destroy();
      }
      if (bindingRef.current) {
        bindingRef.current.destroy();
      }
      ydocRef.current = null;
      bindingRef.current = null;
      setYdoc(null);
      setBinding(null);
    };
  }, [roomId, filePath, editor, socket]);

  return {
    ydoc,
    binding,
  };
};