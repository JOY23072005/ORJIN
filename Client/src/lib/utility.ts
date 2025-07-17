// TypeScript interfaces
interface FileNode {
  id: string;                    // unique frontend identifier
  name: string;
  type: 'file' | 'folder';
  isOpen?: boolean;
  children?: FileNode[];
  path: string;                  // full path like 'src/index.js'
  roomId: string;                // added
  content?: string;             // optional, for files
  parent?: string;              // added, e.g., 'src'
}



//File type definitions
type FileType = 
  | 'javascript'
  | 'typescript'
  | 'css'
  | 'html'
  | 'json'
  | 'markdown'
  | 'python'
  | 'java'
  | 'cpp'
  | 'csharp'
  | 'php'
  | 'ruby'
  | 'go'
  | 'rust'
  | 'swift'
  | 'xml'
  | 'yaml'
  | 'dockerfile'
  | 'shell'
  | 'image'
  | 'video'
  | 'audio'
  | 'pdf'
  | 'archive'
  | 'text'
  | 'config'
  | 'unknown';

interface FileTypeInfo {
  type: FileType;
  color: string;
  category: 'code' | 'markup' | 'data' | 'media' | 'document' | 'config' | 'other';
  language?: string;
}

const fileTypeMap: Record<string, FileTypeInfo> = {
    // JavaScript/TypeScript
    'js': { type: 'javascript', color: 'text-yellow-500', category: 'code', language: 'JavaScript' },
    'jsx': { type: 'javascript', color: 'text-yellow-500', category: 'code', language: 'JavaScript' },
    'ts': { type: 'typescript', color: 'text-blue-500', category: 'code', language: 'TypeScript' },
    'tsx': { type: 'typescript', color: 'text-blue-500', category: 'code', language: 'TypeScript' },
    'mjs': { type: 'javascript', color: 'text-yellow-500', category: 'code', language: 'JavaScript' },
    'cjs': { type: 'javascript', color: 'text-yellow-500', category: 'code', language: 'JavaScript' },
    
    // Web technologies
    'html': { type: 'html', color: 'text-orange-500', category: 'markup', language: 'HTML' },
    'htm': { type: 'html', color: 'text-orange-500', category: 'markup', language: 'HTML' },
    'css': { type: 'css', color: 'text-blue-400', category: 'markup', language: 'CSS' },
    'scss': { type: 'css', color: 'text-pink-500', category: 'markup', language: 'SCSS' },
    'sass': { type: 'css', color: 'text-pink-500', category: 'markup', language: 'Sass' },
    'less': { type: 'css', color: 'text-blue-600', category: 'markup', language: 'Less' },
    
    // Data formats
    'json': { type: 'json', color: 'text-green-500', category: 'data', language: 'JSON' },
    'xml': { type: 'xml', color: 'text-orange-600', category: 'data', language: 'XML' },
    'yaml': { type: 'yaml', color: 'text-purple-500', category: 'data', language: 'YAML' },
    'yml': { type: 'yaml', color: 'text-purple-500', category: 'data', language: 'YAML' },
    'toml': { type: 'config', color: 'text-gray-600', category: 'config', language: 'TOML' },
    
    // Documentation
    'md': { type: 'markdown', color: 'text-gray-700', category: 'document', language: 'Markdown' },
    'markdown': { type: 'markdown', color: 'text-gray-700', category: 'document', language: 'Markdown' },
    'txt': { type: 'text', color: 'text-gray-600', category: 'document', language: 'Text' },
    'pdf': { type: 'pdf', color: 'text-red-500', category: 'document', language: 'PDF' },
    
    // Programming languages
    'py': { type: 'python', color: 'text-green-600', category: 'code', language: 'Python' },
    'java': { type: 'java', color: 'text-red-600', category: 'code', language: 'Java' },
    'cpp': { type: 'cpp', color: 'text-blue-600', category: 'code', language: 'C++' },
    'c': { type: 'cpp', color: 'text-blue-600', category: 'code', language: 'C' },
    'h': { type: 'cpp', color: 'text-blue-600', category: 'code', language: 'C/C++ Header' },
    'cs': { type: 'csharp', color: 'text-purple-600', category: 'code', language: 'C#' },
    'php': { type: 'php', color: 'text-indigo-500', category: 'code', language: 'PHP' },
    'rb': { type: 'ruby', color: 'text-red-500', category: 'code', language: 'Ruby' },
    'go': { type: 'go', color: 'text-cyan-500', category: 'code', language: 'Go' },
    'rs': { type: 'rust', color: 'text-orange-700', category: 'code', language: 'Rust' },
    'swift': { type: 'swift', color: 'text-orange-500', category: 'code', language: 'Swift' },
    
    // Shell scripts
    'sh': { type: 'shell', color: 'text-green-700', category: 'code', language: 'Shell' },
    'bash': { type: 'shell', color: 'text-green-700', category: 'code', language: 'Bash' },
    'zsh': { type: 'shell', color: 'text-green-700', category: 'code', language: 'Zsh' },
    'fish': { type: 'shell', color: 'text-green-700', category: 'code', language: 'Fish' },
    'ps1': { type: 'shell', color: 'text-blue-700', category: 'code', language: 'PowerShell' },
    
    // Config files
    'env': { type: 'config', color: 'text-gray-600', category: 'config', language: 'Environment' },
    'ini': { type: 'config', color: 'text-gray-600', category: 'config', language: 'INI' },
    'conf': { type: 'config', color: 'text-gray-600', category: 'config', language: 'Config' },
    'config': { type: 'config', color: 'text-gray-600', category: 'config', language: 'Config' },
    'dockerfile': { type: 'dockerfile', color: 'text-blue-500', category: 'config', language: 'Dockerfile' },
    
    // Images
    'png': { type: 'image', color: 'text-purple-500', category: 'media', language: 'PNG Image' },
    'jpg': { type: 'image', color: 'text-purple-500', category: 'media', language: 'JPEG Image' },
    'jpeg': { type: 'image', color: 'text-purple-500', category: 'media', language: 'JPEG Image' },
    'gif': { type: 'image', color: 'text-purple-500', category: 'media', language: 'GIF Image' },
    'svg': { type: 'image', color: 'text-purple-500', category: 'media', language: 'SVG Image' },
    'webp': { type: 'image', color: 'text-purple-500', category: 'media', language: 'WebP Image' },
    'ico': { type: 'image', color: 'text-purple-500', category: 'media', language: 'Icon' },
    
    // Video
    'mp4': { type: 'video', color: 'text-red-500', category: 'media', language: 'MP4 Video' },
    'avi': { type: 'video', color: 'text-red-500', category: 'media', language: 'AVI Video' },
    'mov': { type: 'video', color: 'text-red-500', category: 'media', language: 'MOV Video' },
    'mkv': { type: 'video', color: 'text-red-500', category: 'media', language: 'MKV Video' },
    'webm': { type: 'video', color: 'text-red-500', category: 'media', language: 'WebM Video' },
    
    // Audio
    'mp3': { type: 'audio', color: 'text-green-500', category: 'media', language: 'MP3 Audio' },
    'wav': { type: 'audio', color: 'text-green-500', category: 'media', language: 'WAV Audio' },
    'flac': { type: 'audio', color: 'text-green-500', category: 'media', language: 'FLAC Audio' },
    'ogg': { type: 'audio', color: 'text-green-500', category: 'media', language: 'OGG Audio' },
    
    // Archives
    'zip': { type: 'archive', color: 'text-yellow-600', category: 'other', language: 'ZIP Archive' },
    'rar': { type: 'archive', color: 'text-yellow-600', category: 'other', language: 'RAR Archive' },
    'tar': { type: 'archive', color: 'text-yellow-600', category: 'other', language: 'TAR Archive' },
    'gz': { type: 'archive', color: 'text-yellow-600', category: 'other', language: 'GZ Archive' },
    '7z': { type: 'archive', color: 'text-yellow-600', category: 'other', language: '7-Zip Archive' },
  };


// File type detection function
const getFileTypeInfo = (fileName: string): FileTypeInfo => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  if (!extension) {
    return { type: 'unknown', color: 'text-gray-500', category: 'other' };
  }

  return fileTypeMap[extension] || { type: 'unknown', color: 'text-gray-500', category: 'other' };
};

// ✅ Recursive tree updater to update file content
// const updateTree = (
//   nodes: FileNode[],
//   id: string,
//   updater: (node: FileNode) => FileNode
// ): FileNode[] => {
//   return nodes.map((node) => {
//     if (node.id === id) return updater(node);
//     if (node.children) {
//       return {
//         ...node,
//         children: updateTree(node.children, id, updater)
//       };
//     }
//     return node;
//   });
// };

export const getUniqueName = (base: string, existingNames: Set<string>, ext = ''): string => {
  if (!existingNames.has(base + ext)) return base + ext;
  let i = 1;
  while (existingNames.has(`${base} (${i})${ext}`)) {
    i++;
  }
  return `${base} (${i})${ext}`;
};

export const buildFileTree = (files: any[], preserveOpenState?: Map<string, boolean>): FileNode[] => {
    const fileMap = new Map<string, FileNode>();
    const roots: FileNode[] = [];

    // First pass: create all nodes
    files.forEach((file) => {
      const node: FileNode = {
        id: file._id,
        name: file.name,
        type: file.type,
        path: file.path,
        roomId: file.roomId,
        parent: file.parent,
        isOpen: preserveOpenState ? (preserveOpenState.get(file.path) || false) : false,
        children: file.type === 'folder' ? [] : undefined,
        content: file.content
      };
      fileMap.set(file.path, node);
    });

    // Second pass: build tree structure
    files.forEach((file) => {
      const node = fileMap.get(file.path);
      if (!node) return;

      if (!file.parent) {
        roots.push(node);
      } else {
        const parent = fileMap.get(file.parent);
        if (parent && parent.children) {
          parent.children.push(node);
        }
      }
    });

    return roots;
  };

  export  const getOpenState = (nodes: FileNode[]): Map<string, boolean> => {
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
  
// Export the function for external use
export { getFileTypeInfo, type FileTypeInfo, type FileType,type FileNode };
