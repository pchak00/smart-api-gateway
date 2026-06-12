import React from 'react';
import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import pacificLogo from '../assets/pacific-logo.png';

export const NotFoundPage: React.FC = () => (
  <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
    <div className="w-full max-w-md rounded-2xl bg-slate-900/60 p-8 text-center shadow-xl shadow-black/20">
      <img
        src={pacificLogo}
        alt="pacific logo"
        className="mx-auto h-11 w-11 object-contain"
      />
      <div className="mx-auto mt-6 flex h-12 w-12 items-center justify-center rounded-lg bg-slate-950/60 text-slate-600">
        <Compass size={22} aria-hidden="true" />
      </div>
      <h1 className="mt-6 text-3xl font-semibold text-slate-50">Page not found</h1>
      <p className="mt-3 text-sm leading-6 text-slate-500">
        The requested pacific dashboard route does not exist.
      </p>
      <Link
        to="/"
        className="mt-6 inline-flex items-center justify-center rounded-md bg-slate-200 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-white"
      >
        Back to dashboard
      </Link>
    </div>
  </div>
);
