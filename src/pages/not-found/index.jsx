import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft, Search } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-amber-50 via-white to-emerald-50 px-4">
      <div className="w-full max-w-lg text-center">
        <div className="mb-8">
          <div className="mx-auto mb-6 flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 shadow-lg">
            <span className="text-5xl font-bold text-emerald-600">404</span>
          </div>
          <h1 className="mb-2 text-3xl font-bold text-gray-900">Page Not Found</h1>
          <p className="mx-auto max-w-sm text-gray-500">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            to="/"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-700 sm:w-auto"
          >
            <Home className="h-4 w-4" />
            Go Home
          </Link>
          <button
            onClick={() => window.history.back()}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 sm:w-auto"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
