import React from 'react';

export const NotFoundPage: React.FC = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="text-center">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
      <p className="text-gray-600 mb-8">Page not found</p>
      <a href="/" className="text-blue-600 hover:underline">
        Go back to dashboard
      </a>
    </div>
  </div>
);

