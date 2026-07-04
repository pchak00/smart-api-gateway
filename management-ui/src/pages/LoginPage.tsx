import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { PrimaryButton } from '../components/Button';
import { PasswordInput } from '../components/PasswordInput';
import { pacificWaveMark } from '../assets/brand';

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
    <div className="min-h-screen bg-slate-950 px-6 py-8 text-slate-100">
      <main className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center gap-12 lg:grid-cols-[minmax(0,26rem)_1fr]">
        <section className="w-full">
          <p className="text-sm font-medium text-slate-500">pacific</p>
          <h1 className="mt-4 text-3xl font-semibold text-slate-50">Sign in</h1>

          <form onSubmit={handleSubmit} className="mt-8 space-y-7">
            <div>
              <label htmlFor="username" className="block text-sm text-slate-500">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-2 w-full border-b border-slate-800 bg-transparent px-0 py-3 text-sm text-slate-100 outline-none transition-colors placeholder:text-slate-700 hover:border-slate-700 focus:border-slate-500"
                placeholder="username"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm text-slate-500">
                Password
              </label>
              <PasswordInput
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                wrapperClassName="mt-2"
                inputClassName="w-full border-b border-slate-800 bg-transparent px-0 py-3 text-sm text-slate-100 outline-none transition-colors placeholder:text-slate-700 hover:border-slate-700 focus:border-slate-500"
                placeholder="password"
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

        <section className="hidden min-h-[32rem] items-center justify-center lg:flex">
          <div className="flex items-center justify-center gap-5">
            <img
              src={pacificWaveMark}
              alt="pacific logo"
              className="h-24 w-24 object-contain"
            />
            <div className="text-left">
              <p className="text-4xl font-semibold leading-none text-slate-100">pacific</p>
              <p className="mt-3 text-sm text-slate-500">smart api gateway</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};
