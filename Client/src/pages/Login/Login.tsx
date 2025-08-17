import { useState } from 'react';
import AuthLayout from '../../components/auth/AuthLayout';
import AuthForm from '../../components/auth/AuthForm';
import AuthHeader from '../../components/auth/AuthHeader';
import ThemeToggle from '../../components/auth/ThemeToggle';
import FooterLinks from '../../components/auth/FooterLinks';
import { Link } from 'react-router-dom';
import { ToastContainer,Bounce } from 'react-toastify';
import { useTheme } from '@context/ThemeContext';

const Login = () => {
  const [loading, setLoading] = useState(false);
  const { theme } = useTheme();
  return (
    <AuthLayout>
      <div className="flex flex-col h-full w-full items-center justify-center animate-fade-in">
        <AuthHeader />
        <div className="w-full max-w-md mt-6">
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
          <AuthForm setLoading={setLoading} loading={loading} />
          <div className="my-6 flex items-center justify-center">
            <span className="text-gray-400 text-xs">OR</span>
          </div>
          <div className="flex justify-center">
            <Link to="/signup" className="text-primary-500 hover:underline font-semibold transition-all">Create an account</Link>
          </div>
        </div>
        <FooterLinks className="mt-8" />
      </div>
      <ThemeToggle className="absolute top-4 right-4" />
    </AuthLayout>
  );
};

export default Login;