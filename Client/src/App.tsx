import { BrowserRouter } from 'react-router-dom'
import './index.css' // or your central CSS
import { Suspense, lazy } from 'react'
import { Routes, Route } from 'react-router-dom'
import { UserProvider } from './context/UserContext'
import { ThemeProvider } from './context/ThemeContext'
import MainLayout from './layouts/MainLayout'
import ProtectedRoute from './components/ProtectedRoute'
import './index.css'
import { RoomProvider } from './context/RoomContext'
import { FileTreeProvider } from './context/FileTreeContext.tsx'
import SocketWrapper from '@components/SocketWrapper.tsx'

// Lazy load pages for better performance
const Login = lazy(() => import('./pages/Login/Login'))
const Dashboard = lazy(() => import('./pages/Dashboard/Dashboard'))
const Signup = lazy(() => import('./pages/Signup/Signup'))

function App() {
  return (
    <ThemeProvider>
    <RoomProvider>
    <UserProvider>
    <FileTreeProvider>
      <BrowserRouter>
      <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          
          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Dashboard />} />
              
                <Route path="room/:roomId" element={<SocketWrapper/>} />
            </Route>
          </Route>
        </Routes>
      </Suspense>
      </BrowserRouter>
    </FileTreeProvider>
    </UserProvider>
    </RoomProvider>
    </ThemeProvider>
  );
}

export default App;
