import { useState } from 'react';
import AuthLayout from '../../components/auth/AuthLayout';
import AuthForm from '../../components/auth/AuthForm';
import AuthHeader from '../../components/auth/AuthHeader';
import ErrorAlert from '../../components/auth/ErrorAlert';
import ThemeToggle from '../../components/auth/ThemeToggle';
import FooterLinks from '../../components/auth/FooterLinks';
import { Link } from 'react-router-dom';

const Login = () => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  return (
    <AuthLayout>
      <div className="flex flex-col h-full w-full items-center justify-center animate-fade-in">
        <AuthHeader />
        <div className="w-full max-w-md mt-6">
          {error && <ErrorAlert message={error} />}
          <AuthForm setError={setError} setLoading={setLoading} loading={loading} />
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