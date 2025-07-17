import { useState } from 'react';
import AuthLayout from '../../components/auth/AuthLayout';
import AuthHeader from '../../components/auth/AuthHeader';
import ErrorAlert from '../../components/auth/ErrorAlert';
import ThemeToggle from '../../components/auth/ThemeToggle';
import FooterLinks from '../../components/auth/FooterLinks';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';

const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { theme } = useTheme();
  const navigate = useNavigate();

  const validateEmail = (email: string) => /\S+@\S+\.\S+/.test(email);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name || !email || !password || !confirmPassword) {
      setError('All fields are required.');
      return;
    }
    if (!validateEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    // Store user in localStorage
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    if (users.find((u: any) => u.email === email)) {
      setError('An account with this email already exists.');
      setLoading(false);
      return;
    }
    users.push({ name, email, password });
    localStorage.setItem('users', JSON.stringify(users));
    setTimeout(() => {
      setLoading(false);
      navigate('/login');
    }, 1000);
  };

  return (
    <AuthLayout>
      <div className="flex flex-col h-full w-full items-center justify-center animate-fade-in">
        <AuthHeader />
        <div className="w-full max-w-md mt-6">
          {error && <ErrorAlert message={error} />}
          <form className="space-y-6 animate-fade-in" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-4">
              <div>
                <label htmlFor="name" className={`block text-sm font-medium ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>Name</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  className={`mt-1 block w-full rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all ${
                    theme === 'dark'
                      ? 'bg-gray-900 border border-gray-700 text-gray-100'
                      : 'bg-white border border-gray-300 text-gray-900'
                  }`}
                  placeholder="Your Name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>
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
                  autoComplete="new-password"
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
              <div>
                <label htmlFor="confirmPassword" className={`block text-sm font-medium ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>Confirm Password</label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  className={`mt-1 block w-full rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all ${
                    theme === 'dark'
                      ? 'bg-gray-900 border border-gray-700 text-gray-100'
                      : 'bg-white border border-gray-300 text-gray-900'
                  }`}
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-2 px-4 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-semibold shadow transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="loader border-2 border-t-2 border-t-white border-primary-400 rounded-full w-5 h-5 animate-spin"></span>
                  Signing up...
                </span>
              ) : (
                'Sign Up'
              )}
            </button>
          </form>
          <div className="flex justify-center mt-6">
            <Link to="/login" className="text-primary-500 hover:underline font-semibold transition-all">Back to login</Link>
          </div>
        </div>
        <FooterLinks className="mt-8" />
      </div>
      <ThemeToggle className="absolute top-4 right-4" />
    </AuthLayout>
  );
};

export default Signup; 