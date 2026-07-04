import React from 'react';
import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { pacificWaveMark } from '../assets/brand';

export const NotFoundPage: React.FC = () => (
  <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
    <div className="w-full max-w-md text-center">
      <img
        src={pacificWaveMark}
        alt="pacific logo"
        className="mx-auto h-12 w-12 object-contain"
      />
      <Compass className="mx-auto mt-8 text-slate-700" size={24} aria-hidden="true" />
      <h1 className="mt-6 text-3xl font-semibold text-slate-50">Page not found</h1>
      <p className="mt-3 text-sm leading-6 text-slate-500">
        The requested pacific dashboard route does not exist.
      </p>
      <Link
        to="/"
        className="mt-6 inline-flex items-center justify-center rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-slate-100 transition-colors hover:bg-slate-700"
      >
        Back to dashboard
      </Link>
    </div>
  </div>
);
