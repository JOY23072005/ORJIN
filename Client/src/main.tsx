import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ThemeProvider } from '@context/ThemeContext.tsx'
import { RoomProvider } from '@context/RoomContext.tsx'
import { UserProvider } from '@context/UserContext.tsx'
import { FileTreeProvider } from '@context/FileTreeContext.tsx'
import { SocketProvider } from '@context/SocketProvider.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
    <RoomProvider>
    <UserProvider>
    <FileTreeProvider>
    <SocketProvider>
      <App />
    </SocketProvider>
    </FileTreeProvider>
    </UserProvider>
    </RoomProvider>
    </ThemeProvider>
   </StrictMode>,
)
