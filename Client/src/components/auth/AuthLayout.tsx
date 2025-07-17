import React from 'react';
import { useTheme } from '../../context/ThemeContext';

const AuthLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { theme } = useTheme();
  return (
    <div className={`min-h-screen w-full flex flex-col md:flex-row transition-all duration-300 ${
      theme === 'dark'
        ? 'bg-gradient-to-br from-gray-950 via-blue-900 to-primary-950'
        : 'bg-gradient-to-br from-blue-50 via-blue-100 to-primary-50'
    }`}>
      {/* Left: Illustration/Branding */}
      <div className={`hidden md:flex flex-col justify-center items-center md:w-1/2 p-12 rounded-br-3xl shadow-inner animate-fade-in ${
        theme === 'dark'
          ? 'bg-gradient-to-br from-primary-900/80 to-blue-800/80'
          : 'bg-gradient-to-br from-primary-100/80 to-blue-200/80'
      }`}>
        <div className="flex flex-col items-center gap-6">
          <div className="w-[340px] mb-10 flex items-center justify-center shadow-lg" style={{ marginBottom: '3.5rem', marginTop: '-2rem' }}>
            {/* Logo with tagline for login/signup */}
            <img src="/Logo_tagline.png" alt="ORJIN Logo with tagline" className="w-full h-auto object-contain" />
          </div>
          <h2 className={`text-3xl font-bold drop-shadow-lg ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Welcome Back!</h2>
          <p className={`text-lg text-center max-w-lg font-medium ${theme === 'dark' ? 'text-blue-100' : 'text-blue-900'}`}>"Collaboration is the key to innovation. Create, code, and draw together in real time."</p>
          <p className={`text-base text-center max-w-lg italic mt-4 ${theme === 'dark' ? 'text-blue-200' : 'text-blue-800'}`}>Empowering teams to build, brainstorm, and launch ideas — together.</p>
        </div>
      </div>
      {/* Right: Login Form and children */}
      <div className={`flex-1 flex flex-col items-center justify-center p-6 md:p-12 animate-fade-in ${
        theme === 'dark' ? 'bg-gray-950/80' : 'bg-white/80'
      }`}>
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;