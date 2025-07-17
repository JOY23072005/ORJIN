import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';
import ThemeToggle from '../components/auth/ThemeToggle';
import { useEffect, useState } from 'react';
import ErrorAlert from "../components/auth/ErrorAlert";

const MainLayout = () => {
  const { logout, user } = useUser();
  const { theme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const [backendOnline,setBackendOnline]= useState(false);
  
  useEffect(() => {
    const checkBackend = () => {
      fetch(`${import.meta.env.VITE_SERVER_URL}/ping`)
        .then(() => setBackendOnline(true))
        .catch(() => setBackendOnline(false));
    };

    // Check immediately on mount
    checkBackend();

    // Then keep checking every 5 seconds
    const interval = setInterval(checkBackend, 5000);

    return () => clearInterval(interval); // cleanup on unmount
  }, []);


  return (
    <div className={`min-h-screen flex flex-col transition-all duration-300 ${
      theme === 'dark' ? 'bg-gray-950 text-gray-100' : 'bg-gray-50 text-gray-900'
    }`}>
      {/* Header */}
      <header className={`shadow-lg rounded-b-2xl w-full transition-all duration-300 ${
        theme === 'dark' ? 'bg-gray-900' : 'bg-white'
      }`}>
        <div className="px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex justify-between h-16 items-center">
            <div className="flex-shrink-0 w-2/6 flex items-center md:gap-3">
              <img src="/Logo.png" alt="ORJIN Logo" className="w-1/6 h-12 rounded-full" />
              <span className={`text-2xl font-bold ${
                theme === 'dark' ? 'text-primary-400' : 'text-primary-600'
              }`}>ORJIN</span>
            </div>
            <nav className="flex items-center md:space-x-8">
              <Link to="/" className={`hover:text-primary-400 px-3 py-2 rounded-md text-sm font-medium transition ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Dashboard
              </Link>
              {/* Previous Room coming soon */}
              {/* <Link to="/room/2" className={`hover:text-primary-400 px-3 py-2 rounded-md text-sm font-medium transition ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Room
              </Link> */}
              <ThemeToggle />
              <button 
                onClick={handleLogout}
                className={`hover:text-primary-400 px-3 py-2 rounded-md text-sm font-medium cursor-pointer transition ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}
              >
                Logout
              </button>
            </nav>
          </div>
        </div>
      </header>

      {!backendOnline && <ErrorAlert message={`Waiting for backend ${import.meta.env.VITE_SERVER_URL} to Connect`}/>}

      {/* Main content */}
      <main className="flex-grow w-full">
        <div className="px-4 sm:px-6 lg:px-10 py-4 w-full">
          {user && (
            <div className={`mb-4 text-sm ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Logged in as: {user.email}
            </div>
          )}
          <Outlet />
        </div>
      </main>

      {/* Footer */}
      <footer className={`rounded-t-2xl shadow-lg w-full transition-all duration-300 ${
        theme === 'dark' ? 'bg-gray-900' : 'bg-white'
      }`}>
        <div className="px-4 py-6 sm:px-6 lg:px-10 w-full">
          <p className={`text-center text-sm ${
            theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
          }`}>
            &copy; {new Date().getFullYear()} ORJ. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;