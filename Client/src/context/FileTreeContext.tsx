import React, { createContext, useContext, useState } from 'react';
import { type FileNode } from '../lib/utility'; // your FileNode type

interface FileTreeContextType {
  fileTree: FileNode[];
  setFileTree: React.Dispatch<React.SetStateAction<FileNode[]>>;
  selectedFile: FileNode | null;
  setSelectedFile: (file: FileNode | null) => void;
}

const FileTreeContext = createContext<FileTreeContextType | undefined>(undefined);

export const FileTreeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);


  return (
    <FileTreeContext.Provider
      value={{
        fileTree,
        setFileTree,
        selectedFile,
        setSelectedFile
      }}
    >
      {children}
    </FileTreeContext.Provider>
  );
};

// Custom hook
export const useFileTree = (): FileTreeContextType => {
  const context = useContext(FileTreeContext);
  if (!context) throw new Error('useFileTree must be used within FileTreeProvider');
  return context;
};
