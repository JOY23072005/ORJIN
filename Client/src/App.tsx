import { BrowserRouter } from 'react-router-dom'
import './index.css' // or your central CSS
import { Suspense, lazy } from 'react'
import { Routes, Route } from 'react-router-dom'
import { useTheme } from './context/ThemeContext'
import MainLayout from './layouts/MainLayout'
import ProtectedRoute from './components/ProtectedRoute'
import './index.css'
import { ToastContainer,Bounce } from 'react-toastify'
import PublicRoute from '@components/PublicRoute.tsx'

// Lazy load pages for better performance
const Login = lazy(() => import('./pages/Login/Login'))
const Dashboard = lazy(() => import('./pages/Dashboard/Dashboard'))
const Signup = lazy(() => import('./pages/Signup/Signup'))
const Room = lazy(() => import('./pages/Room/Room'))
const VerifyEmail = lazy(()=>import('./pages/VerifyEmail/VerifyEmail.tsx'))

function App() {
  const {theme} = useTheme();
  return (

      <BrowserRouter>
      <ToastContainer
            position="top-center"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick={false}
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme={theme}
            transition={Bounce}
          />
      <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
        <Routes>
          {/* Public routes */}
          <Route element={<PublicRoute/>}>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/verify-email" element={<VerifyEmail/>}/>
          </Route>
          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Dashboard />} />  
              <Route path="room/:roomId" element={<Room/>} />
            </Route>
          </Route>
        </Routes>
      </Suspense>
      </BrowserRouter>
  );
}

export default App;
