import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { PrimaryButton } from '../components/Button';
import pacificLogo from '../assets/pacific-logo.png';

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, login } = useAuth();
  const { showToast } = useToast();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login({ username, password });
      navigate('/');
    } catch (error) {
      showToast({
        message: 'Login failed. Please check your credentials.',
        type: 'error',
        duration: 3000
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10">
      <main className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <img
            src={pacificLogo}
            alt="pacific logo"
            className="h-12 w-12 object-contain"
          />
          <p className="mt-4 text-xl font-semibold tracking-normal text-slate-100">pacific</p>
          <p className="mt-1 text-sm text-slate-500">Smart API Gateway Management</p>
        </div>

        <section className="rounded-2xl bg-slate-900/70 p-6 shadow-xl shadow-black/20">
          <h1 className="text-xl font-semibold tracking-normal text-slate-100">Sign in</h1>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="username" className="mb-2 block text-sm text-slate-400">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-lg bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none ring-1 ring-slate-800/60 transition placeholder:text-slate-700 focus:ring-slate-600"
                placeholder="Enter username"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm text-slate-400">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none ring-1 ring-slate-800/60 transition placeholder:text-slate-700 focus:ring-slate-600"
                placeholder="Enter password"
                required
              />
            </div>

            <PrimaryButton
              type="submit"
              disabled={isLoading}
              className="w-full py-3"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </PrimaryButton>
          </form>
        </section>
      </main>
    </div>
  );
};
