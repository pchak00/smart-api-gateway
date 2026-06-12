import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { LockKeyhole, ShieldCheck } from 'lucide-react';
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
      <div className="grid w-full max-w-5xl overflow-hidden rounded-lg border border-slate-800 bg-slate-900 shadow-2xl shadow-black/40 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="border-b border-slate-800 bg-slate-950 p-8 lg:border-b-0 lg:border-r">
          <div className="flex items-center gap-3">
            <img
              src={pacificLogo}
              alt="Pacific logo"
              className="h-10 w-10 object-contain"
            />
            <div>
              <p className="text-lg font-semibold text-white">Pacific</p>
              <p className="text-xs text-slate-500">Smart API Gateway Management</p>
            </div>
          </div>

          <div className="mt-16 max-w-md">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-200">
              <ShieldCheck size={14} aria-hidden="true" />
              Gateway operations console
            </div>
            <h1 className="text-3xl font-semibold leading-tight tracking-normal text-slate-50">
              Developer-first API management and gateway operations.
            </h1>
            <p className="mt-4 text-sm leading-6 text-slate-400">
              Monitor clients, plans, rate limits, usage signals, and abuse alerts from a focused admin workspace.
            </p>
          </div>
        </section>

        <section className="p-8">
          <div className="mb-8">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg border border-slate-800 bg-slate-950 text-blue-200">
              <LockKeyhole size={20} aria-hidden="true" />
            </div>
            <h2 className="text-2xl font-semibold tracking-normal text-slate-50">Sign in</h2>
            <p className="mt-2 text-sm text-slate-400">Access the Pacific management dashboard.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="username" className="mb-2 block text-sm font-medium text-slate-300">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
                placeholder="Enter username"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-300">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
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

          <div className="mt-8 rounded-lg border border-slate-800 bg-slate-950 px-4 py-3">
            <p className="text-xs leading-5 text-slate-500">
              Authentication uses the gateway admin JWT flow. Credentials are managed by the backend seed data and admin APIs.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};
