import React, { useState, useRef, useEffect } from 'react';
import { 
  ChevronRight, 
  ChevronDown, 
  File, 
  Folder, 
  FolderOpen,
  MoreHorizontal,
  Edit3,
  Trash2
} from 'lucide-react';
import { getFileTypeInfo, type FileTypeInfo, type FileNode,
  // buildFileTree
 } from '../lib/utility';
import { useFileTree } from "../context/FileTreeContext";
import { useSocket } from "../context/SocketProvider";
import { useParams } from 'react-router-dom';

interface FileIconProps {
  fileName: string;
  className?: string;
}

interface FileTreeNodeProps {
  node: FileNode;
  level?: number;
  onToggle: (node: FileNode) => void;
  onSelect: (node: FileNode) => void;
  selectedId: string | null;
  onContextMenu: (e: React.MouseEvent, node: FileNode) => void;
  setCurrentFolder: (path: string | null) => void;
}

interface FileTreeProps {
  onFileSelect: (node: FileNode) => void;
}

const FileIcon: React.FC<FileIconProps> = ({ fileName, className = "" }) => {
  const fileTypeInfo: FileTypeInfo = getFileTypeInfo(fileName);
  const iconClass: string = `w-4 h-4 ${className} ${fileTypeInfo.color}`;
  return <File className={iconClass} />;
};

const FileTreeNode: React.FC<FileTreeNodeProps> = ({ 
  node, 
  level = 0, 
  onToggle, 
  onSelect, 
  selectedId, 
  onContextMenu,
  setCurrentFolder
}) => {
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(node.name);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const socket = useSocket();
  const { roomId } = useParams<{ roomId: string }>();
  const { fileTree } = useFileTree();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggle(node);
    // Don't set current folder when toggling - only when selecting
  };

  const handleSelect = () => {
    onSelect(node);
    // Only set current folder when explicitly selecting a folder
    if (node.type === 'folder') {
      setCurrentFolder(node.path ?? null);
    }
  };

  const handleRename = () => {
    if (!roomId || !newName.trim() || newName === node.name) {
      setIsRenaming(false);
      return;
    }

    const parent = node.path?.split('/').slice(0, -1).join('/') || '';
    const newPath = parent ? `${parent}/${newName.trim()}` : newName.trim();
    
    socket.emit('file:rename', { 
      roomId, 
      oldPath: node.path, 
      newPath,
      newName: newName.trim()
    });
    
    setIsRenaming(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRename();
    } else if (e.key === 'Escape') {
      setNewName(node.name);
      setIsRenaming(false);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowContextMenu(true);
    onContextMenu(e, node);
  };

  const startRename = () => {
    setIsRenaming(true);
    setShowContextMenu(false);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleDelete = () => {
    console.log("handleDelete Called!");
    if (!roomId) {
      console.log(roomId)
      return;
    }
    socket.emit('file:delete', { roomId, path: node.path });
    setShowContextMenu(false);
  };

  const getUniqueName = (base: string, ext: string = ''): string => {
    const siblings = new Set<string>();
    
    // Get the current folder context - use the selected folder as parent
    const targetFolder = node.type === 'folder' ? node.path : node.parent;

    const collect = (nodes: FileNode[]) => {
      for (const n of nodes) {
        // Check if this node is a direct child of our target folder
        if (n.parent === targetFolder || (!targetFolder && !n.parent)) {
          siblings.add(n.name);
        }
        if (n.children) collect(n.children);
      }
    };

    collect(fileTree);

    if (!siblings.has(base + ext)) return base + ext;
    let i = 1;
    while (siblings.has(`${base} (${i})${ext}`)) {
      i++;
    }
    return `${base} (${i})${ext}`;
  };

  const handleAdd = (isFolder: boolean) => {
    if (!roomId) return;
    
    const base = isFolder ? 'new-folder' : 'new-file';
    const ext = isFolder ? '' : '.txt';
    const uniqueName = getUniqueName(base, ext);
    
    // Use the current node as parent context
    const targetFolder = node.type === 'folder' ? node.path : node.parent;
    const fullPath = targetFolder ? `${targetFolder}/${uniqueName}` : uniqueName;
    const parent = targetFolder || '';
    const type = isFolder ? 'folder' : 'file';

    socket.emit('file:add', {
      roomId,
      name: uniqueName,
      path: fullPath,
      type,
      parent,
    });

    setShowContextMenu(false);
  };

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowContextMenu(false);
    };

    if (showContextMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showContextMenu]);

  const paddingLeft = level * 16;

  return (
    <div className="relative">
      <div
        className={`flex items-center py-1 px-2 hover:bg-secondary-600/10 cursor-pointer select-none relative group ${
          selectedId === node.id ? 'bg-secondary-900/30 border-r-2 border-primary-500' : ''
        }`}
        style={{ paddingLeft: paddingLeft + 8 }}
        onClick={handleSelect}
        onContextMenu={handleContextMenu}
      >
        {node.type === 'folder' && (
          <button
            onClick={handleToggle}
            className="flex items-center justify-center w-4 h-4 mr-1 hover:bg-gray-200 rounded"
          >
            {node.isOpen ? (
              <ChevronDown className="w-3 h-3 text-gray-600" />
            ) : (
              <ChevronRight className="w-3 h-3 text-gray-600" />
            )}
          </button>
        )}
        
        {node.type === 'file' && <div className="w-4 h-4 mr-1" />}
        
        <div className="flex items-center mr-2">
          {node.type === 'folder' ? (
            node.isOpen ? (
              <FolderOpen className="w-4 h-4 text-primary-600" />
            ) : (
              <Folder className="w-4 h-4 text-primary-600" />
            )
          ) : (
            <FileIcon fileName={node.name} />
          )}
        </div>
        
        {isRenaming ? (
          <input
            ref={inputRef}
            type="text"
            value={newName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewName(e.target.value)}
            onBlur={handleRename}
            onKeyDown={handleKeyDown}
            className="flex-1 px-1 py-0.5 text-sm border border-primary-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          />
        ) : (
          <span className="flex-1 text-sm text-primary-100 truncate">{node.name}</span>
        )}
        
        {!isRenaming && (
          <button
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              setShowContextMenu(!showContextMenu);
            }}
            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition-opacity"
          >
            <MoreHorizontal className="w-3 h-3 text-gray-500" />
          </button>
        )}
      </div>
      
      {showContextMenu && (
        <div 
          className="absolute top-full left-0 z-50 bg-white border border-gray-200 rounded-md shadow-lg py-1 min-w-[150px]"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={startRename}
            className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            <Edit3 className="w-4 h-4 mr-2" />
            Rename
          </button>
          <button
            onClick={handleDelete}
            className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-gray-100"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </button>
          {node.type === 'folder' && (
            <>
              <hr className="my-1 border-gray-200" />
              <button
                onClick={() => handleAdd(false)}
                className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <File className="w-4 h-4 mr-2" />
                New File
              </button>
              <button
                onClick={() => handleAdd(true)}
                className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <Folder className="w-4 h-4 mr-2" />
                New Folder
              </button>
            </>
          )}
        </div>
      )}
      
      {node.children && node.isOpen && (
        <div>
          {node.children.map((child) => (
            <FileTreeNode
              key={child.id}
              node={child}
              level={level + 1}
              onToggle={onToggle}
              onSelect={onSelect}
              selectedId={selectedId}
              onContextMenu={onContextMenu}
              setCurrentFolder={setCurrentFolder}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const FileTree: React.FC<FileTreeProps> = ({ onFileSelect }) => {
  const { fileTree, setFileTree } = useFileTree();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [currentFolderPath, setCurrentFolderPath] = useState<string | null>(null);
  const socket = useSocket();
  const { roomId } = useParams<{ roomId: string }>();
  
  // Use a ref to track open state that persists across renders
  const openStateRef = useRef<Map<string, boolean>>(new Map());

  // Helper function to get current open state
  const getOpenState = (nodes: FileNode[]): Map<string, boolean> => {
    const openState = new Map<string, boolean>();
    
    const collect = (nodeList: FileNode[]) => {
      for (const node of nodeList) {
        if (node.type === 'folder' && node.isOpen!=undefined) {
          openState.set(node.path || '', node.isOpen);
          if (node.children) {
            collect(node.children);
          }
        }
      }
    };
    
    collect(nodes);
    return openState;
  };

  // Update open state ref whenever fileTree changes
  useEffect(() => {
    if (fileTree.length > 0) {
      openStateRef.current = getOpenState(fileTree);
    }
  }, [fileTree]);

  // Expose buildFileTree function to parent component
  // useEffect(() => {
  //   // Update the FileTree context or parent with the buildFileTree function
  //   // that preserves open state
  //   if (typeof setFileTree === 'function') {
  //     const originalSetFileTree = setFileTree;
  //     const enhancedSetFileTree = (treeOrUpdater: any) => {
  //       if (typeof treeOrUpdater === 'function') {
  //         originalSetFileTree(treeOrUpdater);
  //       } else {
  //         // If it's raw data from server, build it with preserved state
  //         const builtTree = buildFileTree(treeOrUpdater, openStateRef.current);
  //         originalSetFileTree(builtTree);
  //       }
  //     };
      
  //     // You might want to expose this enhanced function to parent
  //     // For now, we'll keep the original logic
  //   }
  // }, [setFileTree]);

  const handleSelect = (node: FileNode) => {
    setSelectedId(node.id);
    if (node.type === "file") {
      onFileSelect(node);
    }
  };

  const handleToggle = (node: FileNode) => {
    const toggle = (nodes: FileNode[]): FileNode[] =>
      nodes.map((n) =>
        n.id === node.id
          ? { ...n, isOpen: !n.isOpen }
          : n.children
          ? { ...n, children: toggle(n.children) }
          : n
      );
    
    // Update the file tree
    setFileTree((prev) => {
      const newTree = toggle(prev);
      // Also update the ref immediately
      openStateRef.current = getOpenState(newTree);
      return newTree;
    });
  };

  const handleContextMenu = (e: React.MouseEvent, node: FileNode) => {
    e.preventDefault();
    e.stopPropagation();
    if(node){
      //donothing ts fix
    }
  };

  const handleAdd = (isFolder: boolean) => {
    if (!roomId) return;
    
    const base = isFolder ? 'new-folder' : 'new-file';
    const ext = isFolder ? '' : '.txt';
    
    // Use the currently selected folder as the parent, or root if none selected
    const targetFolder = currentFolderPath;
    
    // Get unique name within the target folder
    const siblings = new Set<string>();
    const collect = (nodes: FileNode[]) => {
      for (const n of nodes) {
        if (n.parent === targetFolder || (!targetFolder && !n.parent)) {
          siblings.add(n.name);
        }
        if (n.children) collect(n.children);
      }
    };
    collect(fileTree);

    const getUniqueName = (baseName: string, extension: string = ''): string => {
      if (!siblings.has(baseName + extension)) return baseName + extension;
      let i = 1;
      while (siblings.has(`${baseName} (${i})${extension}`)) {
        i++;
      }
      return `${baseName} (${i})${extension}`;
    };

    const uniqueName = getUniqueName(base, ext);
    const fullPath = targetFolder ? `${targetFolder}/${uniqueName}` : uniqueName;
    const parent = targetFolder || '';
    const type = isFolder ? 'folder' : 'file';

    socket.emit('file:add', {
      roomId,
      name: uniqueName,
      path: fullPath,
      type,
      parent,
    });
  };

  return (
    <div className="h-full bg-[#181818] overflow-y-auto">
      <div className="h-10 p-3 bg-gray-800 text-secondary-500">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Files</h3>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => handleAdd(false)}
              className="p-1 btn btn-secondary rounded"
              title="New File"
            >
              <File className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={() => handleAdd(true)}
              className="p-1 btn btn-secondary rounded"
              title="New Folder"
            >
              <Folder className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>
      </div>
      
      <div className="py-2">
        {fileTree.map((node) => (
          <FileTreeNode
            key={node.id}
            node={node}
            onToggle={handleToggle}
            onSelect={handleSelect}
            selectedId={selectedId}
            onContextMenu={handleContextMenu}
            setCurrentFolder={setCurrentFolderPath}
          />
        ))}
      </div>
    </div>
  );
};

export default FileTree;