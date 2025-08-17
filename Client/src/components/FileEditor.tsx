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
import { useTheme } from "../context/ThemeContext";
import RoomMembersList from './RoomMemberList.tsx';

interface RemoteCursor {
  id: string;
  name: string;
  color: string;
  position: monaco.Position | null;
}

const FileEditor: React.FC = () => {
  const { fileTree, selectedFile, setSelectedFile, setFileTree } = useFileTree();
  const socket = useSocket();
  const { roomId } = useParams();
  const { theme } = useTheme();

  // UI State
  const [usersShow,setUsersShow] = useState<boolean>(false);
  const [sidebarWidth, setSidebarWidth] = useState(300);
  const [terminalHeight, setTerminalHeight] = useState(200);
  const [isDraggingSidebar, setIsDraggingSidebar] = useState(false);
  const [isDraggingTerminal, setIsDraggingTerminal] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showTerminal, setShowTerminal] = useState(false);

  // const [collaborators, setCollaborators] = useState<any[]>([]);
  const [remoteCursors, setRemoteCursors] = useState<RemoteCursor[]>([]);
  const cursorDecorations = useRef<string[]>([]);

  const [output, setOutput] = useState<string | null>(null);
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [isLoading,setIsLoading] = useState<boolean>(false);

  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize Yjs for selected file - only when editor is ready
  const { ydoc, 
    // binding,
    awareness
   } = useYjsEditor(
    roomId,
    selectedFile?.path,
    isEditorReady ? editorRef.current : null
  );

    useEffect(() => {
    if (!awareness || !editorRef.current) return;

    const updateCursors = () => {
      const states = awareness.getStates();
      const cursors: RemoteCursor[] = [];
      
      states.forEach((state, clientId) => {
        // Skip our own cursor
        if (String(clientId) === socket.id) return;
        
        const user1 = state.user;
        const cursor = state.cursor;
        
        if (user1 && cursor && cursor.position) {
          cursors.push({
            id: clientId.toString(),
            name: user1.name || `User-${clientId.toString().slice(0, 4)}`,
            color: user1.color || `hsl(${Math.random() * 360}, 70%, 70%)`,
            position: cursor.position
          });
          // setCollaborators((prev)=>[...prev,user]);
        }
      });
      
      setRemoteCursors(cursors);
    };

    // Initial update
    updateCursors();
    
    // Listen for awareness changes
    awareness.on('change', updateCursors);

    return () => {
      awareness.off('change', updateCursors);
    };
  }, [awareness, socket.id]);

  // Effect to render cursor decorations in Monaco
  useEffect(() => {
    if (!editorRef.current || !remoteCursors.length) {
      // Clear existing decorations if no cursors
      if (cursorDecorations.current.length > 0) {
        editorRef.current?.deltaDecorations(cursorDecorations.current, []);
        cursorDecorations.current = [];
      }
      return;
    }

    const editor = editorRef.current;
    const newDecorations: monaco.editor.IModelDeltaDecoration[] = [];

    remoteCursors.forEach((cursor) => {
      if (!cursor.position) return;

      // Create cursor line decoration
      newDecorations.push({
        range: new monaco.Range(
          cursor.position.lineNumber,
          cursor.position.column,
          cursor.position.lineNumber,
          cursor.position.column
        ),
        options: {
          className: `remote-cursor-${cursor.id}`,
          stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
          afterContentClassName: `remote-cursor-line-${cursor.id}`,
        }
      });

      // Create selection decoration if needed (for future selection support)
      // You can extend this to show text selections as well
    });

    // Apply decorations
    const newDecorationIds = editor.deltaDecorations(
      cursorDecorations.current,
      newDecorations
    );
    cursorDecorations.current = newDecorationIds;

    // Inject CSS for cursor styling
    injectCursorStyles(remoteCursors);

  }, [remoteCursors]);

  // Function to inject cursor CSS styles
  const injectCursorStyles = (cursors: RemoteCursor[]) => {
    let styleElement = document.getElementById('remote-cursor-styles') as HTMLStyleElement;
    
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = 'remote-cursor-styles';
      document.head.appendChild(styleElement);
    }

    const styles = cursors.map(cursor => `
      .remote-cursor-line-${cursor.id}::after {
        content: '';
        position: absolute;
        top: 0;
        bottom: 0;
        left: 0;
        width: 2px;
        background-color: ${cursor.color};
        pointer-events: none;
        z-index: 10;
        animation: blink 1s infinite;
      }
      
      .remote-cursor-${cursor.id} {
        position: relative;
      }
      
      .remote-cursor-${cursor.id}::before {
        content: '${cursor.name}';
        position: absolute;
        top: -20px;
        left: 0;
        background-color: ${cursor.color};
        color: white;
        padding: 2px 6px;
        font-size: 10px;
        border-radius: 3px;
        white-space: nowrap;
        pointer-events: none;
        z-index: 15;
        opacity: 0;
        transition: opacity 0.2s;
      }
      
      .remote-cursor-${cursor.id}:hover::before {
        opacity: 1;
      }
    `).join('\n');

    // Add blinking animation
    const blinkAnimation = `
      @keyframes blink {
        0%, 50% { opacity: 1; }
        51%, 100% { opacity: 0; }
      }
    `;

    styleElement.textContent = styles + blinkAnimation;
  };

  // Update the handleEditorMount to track cursor position
  const handleEditorMount: OnMount = (editor) => {
    editorRef.current = editor;
    
    // Comprehensive editor initialization
    const initializeEditor = () => {
      editor.layout();
      setIsEditorReady(true);
      
      // Set up cursor position tracking for awareness
      editor.onDidChangeCursorPosition((e) => {
        if (awareness) {
          awareness.setLocalStateField('cursor', {
            position: e.position
          });
        }
      });
      
      // Set up cursor selection tracking (optional)
      editor.onDidChangeCursorSelection((e) => {
        if (awareness) {
          awareness.setLocalStateField('selection', {
            startPosition: e.selection.getStartPosition(),
            endPosition: e.selection.getEndPosition()
          });
        }
      });
      
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


  // Fetch file tree
  const fetchFileTree = useCallback(() => {
    if (!roomId) return;
    setIsLoading(true);
    const currentOpenState = getOpenState(fileTree);
    socket.emit("filetree:get", { roomId });
    socket.once("filetree:data", (tree) => {
      // console.log("filetree received",tree)
      setFileTree(buildFileTree(tree, currentOpenState));
      setIsLoading(false);
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
    <div
      className={`w-full h-screen flex flex-col ${
        theme === "dark" ? "bg-[#1e1e1e]" : "bg-gray-100"
      }`}
      ref={containerRef}
    >
      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        { showSidebar && (usersShow? ( <RoomMembersList cursors={remoteCursors}/>) : (
          <div
            className={`relative flex-shrink-0 transition-all duration-200 ${
              theme === "dark" ? "bg-[#181818]" : "bg-gray-200"
            }`}
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
        ))}

        {/* Editor area */}
        <div className="flex flex-col flex-1 min-w-0">
          {/* Top bar */}
          <div
            className={`h-10 px-4 flex items-center justify-between border-b ${
              theme === "dark"
                ? "bg-gray-800 text-gray-300 border-gray-700"
                : "bg-white text-gray-800 border-gray-300"
            }`}
          >
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-medium truncate">
                {selectedFile?.name ?? "No file selected"}
              </h3>
              {!isLoading? (
                <div className="flex items-center space-x-1 text-xs text-green-400">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span>Synced</span>
                </div>
              ):<div className="flex items-center space-x-1 text-xs text-red-400">
                  <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                  <span>not Synced</span>
                </div>}
            </div>

            {/* Show active collaborators */}
            {remoteCursors.length > 0 && (
              <div className="flex items-center space-x-1">
                <div className="flex -space-x-1">
                  {remoteCursors.slice(0, 3).map((cursor) => (
                    <div
                      key={cursor.id}
                      className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-xs font-medium text-white"
                      style={{ backgroundColor: cursor.color }}
                      title={cursor.name}
                    >
                      {cursor.name.charAt(0).toUpperCase()}
                    </div>
                  ))}
                  {remoteCursors.length > 3 && (
                    <div className="w-6 h-6 rounded-full border-2 border-white bg-gray-500 flex items-center justify-center text-xs font-medium text-white">
                      +{remoteCursors.length - 3}
                    </div>
                  )}
                </div>
                <span className="text-xs text-gray-400">
                  {remoteCursors.length} active
                </span>
              </div>
            )}

            <div className="flex gap-3">
              <Play
                className={`cursor-pointer transition-colors w-4 h-4 ${
                  selectedFile && ydoc
                    ? theme === "dark"
                      ? "hover:text-white"
                      : "hover:text-black"
                    : "text-gray-400 cursor-not-allowed"
                }`}
                onClick={selectedFile && ydoc ? handleCodeRunner : undefined}
              />
              <Users
                className={`cursor-pointer transition-colors w-4 h-4 ${
                  theme === "dark" ? "hover:text-white" : "hover:text-black"
                }`}
                onClick={()=>{setUsersShow((prev)=>!prev); console.log(usersShow);}}
              />
              <PanelLeft
                className={`cursor-pointer transition-colors w-4 h-4 ${
                  theme === "dark" ? "hover:text-white" : "hover:text-black"
                }`}
                onClick={toggleSidebar}
              />
              <PanelBottom
                className={`cursor-pointer transition-colors w-4 h-4 ${
                  theme === "dark" ? "hover:text-white" : "hover:text-black"
                }`}
                onClick={toggleTerminal}
              />
            </div>
          </div>

          {/* Editor */}
          <div className="flex flex-col flex-1 min-h-0">
            <div
              className="flex-1 min-h-0 relative"
              style={{
                height: showTerminal
                  ? `calc(100% - ${terminalHeight}px)`
                  : "100%",
              }}
            >
              {selectedFile ? (
                <Editor
                  height="100%"
                  width="100%"
                  language={getFileTypeInfo(selectedFile.name)?.type}
                  onMount={handleEditorMount}
                  theme={theme === "dark" ? "vs-dark" : "light"}
                  options={{
                    fontSize: 14,
                    wordWrap: "on",
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    automaticLayout: false,
                    lineNumbers: "on",
                    glyphMargin: true,
                    folding: true,
                    lineDecorationsWidth: 10,
                    lineNumbersMinChars: 3,
                  }}
                />
              ) : (
                <div
                  className={`flex items-center justify-center h-full ${
                    theme === "dark" ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  <div className="text-center">
                    <p className="text-lg mb-2">No file selected</p>
                    <p className="text-sm">Choose a file to start collaborative editing</p>
                  </div>
                </div>
              )}
            </div>

            {/* Terminal */}
            {showTerminal && (
              <div
                className={`relative flex-shrink-0 ${
                  theme === "dark" ? "bg-black" : "bg-gray-100"
                }`}
                style={{ height: terminalHeight }}
              >
                <div
                  className="absolute top-0 left-0 right-0 h-1 bg-transparent hover:bg-blue-500 cursor-row-resize z-10"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setIsDraggingTerminal(true);
                  }}
                />
                <div className="h-full pt-1">
                  <div
                    className={`font-mono p-4 rounded h-full overflow-y-auto overflow-x-hidden text-sm ${
                      theme === "dark"
                        ? "bg-black text-green-400"
                        : "bg-white text-green-700"
                    }`}
                  >
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