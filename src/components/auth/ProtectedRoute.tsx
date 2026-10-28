import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LoaderCircle, ShieldCheck } from 'lucide-react';

export const ProtectedRoute: React.FC<{ children: React.ReactElement; requireApproval?: boolean }> = ({
  children,
  requireApproval = true,
}) => {
  const { currentUser, authLoading, hasStudentAccess, authStatus } = useAuth();
  const location = useLocation();

  if (authLoading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <LoaderCircle className="w-7 h-7 animate-spin text-brand-600" aria-label="Loading session" />
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to={`/auth?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  if (requireApproval && !hasStudentAccess) {
    const message =
      authStatus === 'email_unverified'
        ? 'Check your college email and verify your address before using student-only features.'
        : 'Your registration is awaiting administrator approval. You can browse publicly while it is reviewed.';
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center space-y-4">
        <ShieldCheck className="w-10 h-10 mx-auto text-amber-500" />
        <h1 className="text-xl font-black text-slate-900">Student access pending</h1>
        <p className="text-sm text-slate-600">{message}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="px-4 py-2 rounded-xl bg-brand-900 text-white text-sm font-bold"
        >
          Refresh verification status
        </button>
      </div>
    );
  }

  return children;
};
