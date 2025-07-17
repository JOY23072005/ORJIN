import React, { useEffect, useRef, useState, useCallback } from 'react';
import Editor, { type OnMount } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import FileTree from './FileTree';
import { PanelBottom, PanelLeft, Play, Users } from 'lucide-react';
import { useFileTree } from '../context/FileTreeContext.tsx';
import { getFileTypeInfo, buildFileTree, getOpenState } from '../lib/utility';
import { getLanguageId, runCode } from '../lib/api.ts';
import { useSocket } from '@context/SocketProvider.tsx';
import { useParams } from 'react-router-dom';
import { useYjsEditor } from '../hooks/useYjsEditor.ts';

const FileEditor: React.FC = () => {
  const { fileTree, selectedFile, setSelectedFile, setFileTree } = useFileTree();
  const socket = useSocket();
  const { roomId } = useParams();

  // UI State
  const [sidebarWidth, setSidebarWidth] = useState(300);
  const [terminalHeight, setTerminalHeight] = useState(200);
  const [isDraggingSidebar, setIsDraggingSidebar] = useState(false);
  const [isDraggingTerminal, setIsDraggingTerminal] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showTerminal, setShowTerminal] = useState(false);
  // const [collaborators, setCollaborators] = useState<any[]>([]);
  const [output, setOutput] = useState<string | null>(null);
  const [isEditorReady, setIsEditorReady] = useState(false);

  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize Yjs for selected file - only when editor is ready
  const { ydoc, 
    // binding
   } = useYjsEditor(
    roomId,
    selectedFile?.path,
    isEditorReady ? editorRef.current : null
  );

  // Fetch file tree
  const fetchFileTree = useCallback(() => {
    if (!roomId) return;
    const currentOpenState = getOpenState(fileTree);
    socket.emit("filetree:get", { roomId });
    socket.once("filetree:data", (tree) => {
      setFileTree(buildFileTree(tree, currentOpenState));
    });
  }, [roomId, socket, fileTree]);

  useEffect(() => {
    fetchFileTree();
    setSelectedFile(null);
  }, []);

  useEffect(() => {
    socket.on('file:refresh', fetchFileTree);
    return () => {
      socket.off('file:refresh', fetchFileTree);
    };
  }, [fetchFileTree]);

  // Enhanced layout update function
  const updateEditorLayout = useCallback(() => {
    if (editorRef.current) {
      requestAnimationFrame(() => {
        editorRef.current?.layout();
        // Force a second layout call to ensure proper sizing
        setTimeout(() => {
          editorRef.current?.layout();
        }, 10);
      });
    }
  }, []);

  // Resize handlers
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingSidebar) {
        e.preventDefault();
        const containerRect = containerRef.current?.getBoundingClientRect();
        if (containerRect) {
          const newWidth = Math.max(200, Math.min(600, e.clientX - containerRect.left));
          setSidebarWidth(newWidth);
        }
      }
    };

    const handleMouseUp = () => {
      setIsDraggingSidebar(false);
      updateEditorLayout();
    };

    if (isDraggingSidebar) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
    };
  }, [isDraggingSidebar, updateEditorLayout]);

  // Terminal resize handler
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingTerminal) {
        e.preventDefault();
        const containerRect = containerRef.current?.getBoundingClientRect();
        if (containerRect) {
          const newHeight = Math.max(100, Math.min(400, containerRect.bottom - e.clientY));
          setTerminalHeight(newHeight);
        }
      }
    };

    const handleMouseUp = () => {
      setIsDraggingTerminal(false);
      updateEditorLayout();
    };

    if (isDraggingTerminal) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'row-resize';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
    };
  }, [isDraggingTerminal, updateEditorLayout]);

  // Layout updates with better timing
  useEffect(() => {
    const timer = setTimeout(updateEditorLayout, 100);
    return () => clearTimeout(timer);
  }, [showSidebar, showTerminal, updateEditorLayout]);

  useEffect(() => {
    const handleResize = () => updateEditorLayout();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateEditorLayout]);

  // Trigger layout when file changes
  useEffect(() => {
    if (selectedFile && isEditorReady) {
      // Small delay to ensure editor is ready for the new file
      const timer = setTimeout(() => {
        updateEditorLayout();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [selectedFile, isEditorReady, updateEditorLayout]);

  const handleEditorMount: OnMount = (editor, 
    // monacoInstance
  ) => {
    editorRef.current = editor;
    
    // Comprehensive editor initialization
    const initializeEditor = () => {
      editor.layout();
      setIsEditorReady(true);
      
      // Additional layout calls to ensure proper initialization
      setTimeout(() => editor.layout(), 50);
      setTimeout(() => editor.layout(), 100);
      setTimeout(() => editor.layout(), 200);
    };

    // Wait for editor to be fully mounted
    if (editor.getModel()) {
      initializeEditor();
    } else {
      // If model isn't ready, wait for it
      const disposable = editor.onDidChangeModel(() => {
        initializeEditor();
        disposable.dispose();
      });
    }
  };

  const toggleSidebar = () => setShowSidebar(prev => !prev);
  const toggleTerminal = () => setShowTerminal(prev => !prev);

  const handleCodeRunner = async () => {
    if (selectedFile && ydoc) {
      const extension = selectedFile.name.split('.').pop()?.toLowerCase();
      if (!extension) return;
      
      try {
        const langId = await getLanguageId(extension);
        if (langId) {
          const ytext = ydoc.getText('monaco');
          const content = ytext.toString();
          console.log('Running code:', { extension, langId, content });
          if (!showTerminal) setShowTerminal(true);
          setOutput("Running...");
          const result = await runCode({
            sourceCode: content,
            languageId: langId,
            stdin: '5\n6'
          });
          
          console.log('Code execution result:', result);
          
          // Handle error cases
          if (result?.error) {
            setOutput(`Error: ${result.error}`);
            return;
          }
          
          // Handle different types of output
          let outputText = '';
          if (result?.compile_output) {
            outputText += `Compilation Output:\n${result.compile_output}\n\n`;
          }
          if (result?.stdout) {
            outputText += `Output:\n${result.stdout}\n`;
          }
          if (result?.stderr) {
            outputText += `Error:\n${result.stderr}\n`;
          }
          if (result?.status && result.status.description !== 'Accepted') {
            outputText += `Status: ${result.status.description}\n`;
          }
          if (result?.time) {
            outputText += `Execution Time: ${result.time}s\n`;
          }
          if (result?.memory) {
            outputText += `Memory Used: ${result.memory} KB\n`;
          }
          if (!outputText.trim()) {
            outputText = 'No output generated';
          }
          
          setOutput(outputText);
        } else {
          if (!showTerminal) setShowTerminal(true);
          setOutput(`Error: Unsupported file extension: ${extension}`);
        }
      } catch (error) {
        console.error('Error running code:', error);
        if (!showTerminal) setShowTerminal(true);
        setOutput('Error running code: ' + (error || 'Unknown error'));
      }
    }
  };

  return (
    <div className="w-full h-screen flex flex-col bg-[#1e1e1e]" ref={containerRef}>
      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        {showSidebar && (
          <div
            className="relative bg-[#181818] flex-shrink-0 transition-all duration-200"
            style={{ width: sidebarWidth }}
          >
            <FileTree onFileSelect={setSelectedFile} />
            <div
              className="absolute top-0 right-0 w-1 h-full bg-transparent hover:bg-blue-500 cursor-col-resize z-10"
              onMouseDown={(e) => {
                e.preventDefault();
                setIsDraggingSidebar(true);
              }}
            />
          </div>
        )}

        {/* Editor area */}
        <div className="flex flex-col flex-1 min-w-0">
          {/* Top bar */}
          <div className="h-10 bg-gray-800 text-gray-300 px-4 flex items-center justify-between border-b border-gray-700">
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-medium truncate">
                {selectedFile?.name ?? 'No file selected'}
              </h3>
              {ydoc && (
                <div className="flex items-center space-x-1 text-xs text-green-400">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span>Synced</span>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <Play
                className={`cursor-pointer transition-colors w-4 h-4 ${
                  selectedFile && ydoc ? 'hover:text-white' : 'text-gray-600 cursor-not-allowed'
                }`}
                onClick={selectedFile && ydoc ? handleCodeRunner : undefined}
              />
              <Users className="cursor-pointer hover:text-white transition-colors w-4 h-4" />
              <PanelLeft
                className="cursor-pointer hover:text-white transition-colors w-4 h-4"
                onClick={toggleSidebar}
              />
              <PanelBottom
                className="cursor-pointer hover:text-white transition-colors w-4 h-4"
                onClick={toggleTerminal}
              />
            </div>
          </div>

          {/* Editor */}
          <div className="flex flex-col flex-1 min-h-0">
            <div
              className="flex-1 min-h-0 relative"
              style={{
                height: showTerminal ? `calc(100% - ${terminalHeight}px)` : '100%'
              }}
            >
              {selectedFile ? (
                <Editor
                  height="100%"
                  width="100%"
                  language={getFileTypeInfo(selectedFile.name)?.type}
                  onMount={handleEditorMount}
                  theme="vs-dark"
                  options={{
                    fontSize: 14,
                    wordWrap: 'on',
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    automaticLayout: false, // Keep this false and handle manually
                    lineNumbers: 'on',
                    glyphMargin: true,
                    folding: true,
                    lineDecorationsWidth: 10,
                    lineNumbersMinChars: 3,
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <p className="text-lg mb-2">No file selected</p>
                    <p className="text-sm text-gray-400">Choose a file to start collaborative editing</p>
                  </div>
                </div>
              )}
            </div>

            {/* Terminal */}
            {showTerminal && (
              <div className="relative bg-black flex-shrink-0" style={{ height: terminalHeight }}>
                <div
                  className="absolute top-0 left-0 right-0 h-1 bg-transparent hover:bg-blue-500 cursor-row-resize z-10"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setIsDraggingTerminal(true);
                  }}
                />
                <div className="h-full pt-1">
                  <div className="bg-black text-green-400 font-mono p-4 rounded h-full overflow-y-auto overflow-x-hidden text-sm">
                    <pre>{output || "Waiting for result..."}</pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileEditor;