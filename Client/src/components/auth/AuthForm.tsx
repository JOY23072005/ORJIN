import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import { useTheme } from '../../context/ThemeContext';

interface AuthFormProps {
  setError: (msg: string) => void;
  setLoading: (loading: boolean) => void;
  loading: boolean;
}

const AuthForm: React.FC<AuthFormProps> = ({ setError, setLoading, loading }) => {
  const { login } = useUser();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // Check credentials in localStorage
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const user = users.find((u: any) => u.email === email && u.password === password);
      if (user) {
        const success = await login(email, password);
        if (success) {
          navigate('/');
        } else {
          setError('Invalid email or password');
        }
      } else {
        setError('Invalid email or password');
      }
    } catch (err) {
      setError('An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-6 animate-fade-in" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-4">
        <div>
          <label htmlFor="email" className={`block text-sm font-medium ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
          }`}>Email</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className={`mt-1 block w-full rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all ${
              theme === 'dark'
                ? 'bg-gray-900 border border-gray-700 text-gray-100'
                : 'bg-white border border-gray-300 text-gray-900'
            }`}
            placeholder="you@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="password" className={`block text-sm font-medium ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
          }`}>Password</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className={`mt-1 block w-full rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all ${
              theme === 'dark'
                ? 'bg-gray-900 border border-gray-700 text-gray-100'
                : 'bg-white border border-gray-300 text-gray-900'
            }`}
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <label className={`flex items-center gap-2 text-sm ${
          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
        }`}>
          <input
            type="checkbox"
            checked={remember}
            onChange={e => setRemember(e.target.checked)}
            className={`rounded focus:ring-primary-500 ${
              theme === 'dark'
                ? 'border-gray-600 bg-gray-800 text-primary-600'
                : 'border-gray-300 bg-white text-primary-600'
            }`}
          />
          Remember me
        </label>
        <a href="#" className="text-sm text-primary-500 hover:underline">Forgot password?</a>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full flex justify-center items-center py-2 px-4 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-semibold shadow transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <span className="loader border-2 border-t-2 border-t-white border-primary-400 rounded-full w-5 h-5 animate-spin"></span>
            Signing in...
          </span>
        ) : (
          'Sign In'
        )}
      </button>
    </form>
  );
};

export default AuthForm; 