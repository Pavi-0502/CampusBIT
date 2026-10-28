import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, Eye, EyeOff, Gavel, LoaderCircle, Mail, ShieldCheck } from 'lucide-react';

type Mode = 'signin' | 'signup' | 'reset';

export const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    currentUser,
    signInWithCampusEmail,
    signUpWithCampusEmail,
    resetPassword,
    updatePassword,
    campusDomain,
    campusName,
    authStatus,
    passwordRecovery,
  } = useAuth();
  const [mode, setMode] = useState<Mode>(
    new URLSearchParams(location.search).get('mode') === 'reset' ? 'reset' : 'signin'
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [department, setDepartment] = useState('');
  const [academicYear, setAcademicYear] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (currentUser && mode !== 'reset' && !passwordRecovery) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <ShieldCheck className="w-10 h-10 mx-auto text-emerald-600" />
        <h1 className="text-xl font-black text-slate-900">You are already signed in</h1>
        <p className="text-sm text-slate-600">
          {authStatus === 'approved' ? 'Your student account is ready.' : 'Your student access is still being verified.'}
        </p>
        <button onClick={() => navigate('/marketplace')} className="px-5 py-2.5 rounded-xl bg-brand-900 text-white text-sm font-bold">
          Continue to marketplace
        </button>
      </div>
    );
  }

  const switchMode = (nextMode: Mode) => {
    setMode(nextMode);
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const normalizedEmail = email.trim().toLowerCase();
    if (!passwordRecovery && (!normalizedEmail || !normalizedEmail.endsWith(`@${campusDomain}`))) {
      setError(`Use your approved college email ending with @${campusDomain}.`);
      return;
    }
    if ((mode !== 'reset' || passwordRecovery) && password.length < 10) {
      setError('Password must be at least 10 characters long.');
      return;
    }
    if (mode === 'signup') {
      if (!fullName.trim() || !studentId.trim() || !department.trim() || !academicYear) {
        setError('Complete all student registration fields.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === 'signin') {
        const result = await signInWithCampusEmail(normalizedEmail, password);
        if (result.error) setError(result.error);
        else navigate(new URLSearchParams(location.search).get('redirect') || '/marketplace');
      } else if (mode === 'signup') {
        const result = await signUpWithCampusEmail({
          email: normalizedEmail,
          password,
          name: fullName,
          studentId,
          department,
          academicYear,
        });
        if (result.error) setError(result.error);
        else setSuccess('Registration received. Verify your college email, then wait for administrator approval before using student-only features.');
      } else if (passwordRecovery) {
        const result = await updatePassword(password);
        if (result.error) setError(result.error);
        else setSuccess('Your password has been updated. You can now sign in with it.');
      } else {
        const result = await resetPassword(normalizedEmail);
        if (result.error) setError(result.error);
        else setSuccess('If an eligible account exists, password reset instructions have been sent to that email.');
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 sm:py-14">
      <div className="text-center space-y-3 mb-8">
        <div className="w-14 h-14 rounded-2xl bg-brand-900 text-white flex items-center justify-center mx-auto shadow-md">
          <Gavel className="w-7 h-7 text-brand-100" />
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          {mode === 'signin' ? 'Welcome Back, Student!' : mode === 'signup' ? 'Join CampusBIT' : 'Reset your password'}
        </h1>
        <p className="text-sm text-slate-600">
          {mode === 'signin'
            ? 'Sign in with your college account to access CampusBIT.'
            : mode === 'signup'
            ? 'Register with your college account for administrator review.'
            : 'We will send instructions to your approved college email.'}
        </p>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          {campusName} · @{campusDomain}
        </div>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
        {(mode !== 'reset' || passwordRecovery) && (
          <div className="grid grid-cols-2 gap-1 p-1 bg-surface-100 rounded-2xl mb-6">
            <button type="button" onClick={() => switchMode('signin')} className={`py-2.5 text-sm font-bold rounded-xl ${mode === 'signin' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
              Sign in
            </button>
            <button type="button" onClick={() => switchMode('signup')} className={`py-2.5 text-sm font-bold rounded-xl ${mode === 'signup' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
              Register
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Full name" value={fullName} onChange={setFullName} placeholder="Your full name" />
              <Field label="Student ID / roll number" value={studentId} onChange={setStudentId} placeholder="e.g. BIT2026CS01" />
              <Field label="Department" value={department} onChange={setDepartment} placeholder="e.g. Computer Science" />
              <label className="block text-sm font-semibold text-slate-700">
                Current academic year
                <select required value={academicYear} onChange={(event) => setAcademicYear(event.target.value)} className="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-normal">
                  <option value="">Select year</option>
                  {['1st Year', '2nd Year', '3rd Year', '4th Year', 'Postgraduate'].map((year) => <option key={year}>{year}</option>)}
                </select>
              </label>
            </div>
          )}

          <label className="block text-sm font-semibold text-slate-700">
            College email
            <div className="relative mt-1">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder={`you@${campusDomain}`} className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 font-normal" />
            </div>
          </label>

          {mode !== 'reset' && (
            <>
              <label className="block text-sm font-semibold text-slate-700">
                Password
                <div className="relative mt-1">
                  <input type={showPassword ? 'text' : 'password'} required value={password} onChange={(event) => setPassword(event.target.value)} className="w-full pl-3.5 pr-11 py-2.5 rounded-xl border border-slate-200 font-normal" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {mode === 'signup' && <span className="text-xs text-slate-500 font-normal">Use at least 10 characters.</span>}
              </label>
              {mode === 'signup' && (
                <label className="block text-sm font-semibold text-slate-700">
                  Confirm password
                  <input type={showPassword ? 'text' : 'password'} required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-normal" />
                </label>
              )}
              {mode === 'signin' && (
                <div className="flex items-center justify-between text-xs">
                  <label className="flex items-center gap-2 text-slate-600"><input type="checkbox" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} /> Remember me</label>
                  <button type="button" onClick={() => switchMode('reset')} className="font-semibold text-brand-700 hover:underline">Forgot password?</button>
                </div>
              )}
            </>
          )}

          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex gap-2 text-sm text-red-700"><AlertCircle className="w-4 h-4 shrink-0" />{error}</div>}
          {success && <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700">{success}</div>}
          <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-brand-900 hover:bg-brand-950 disabled:opacity-50 text-white font-bold text-sm flex items-center justify-center gap-2">
            {loading && <LoaderCircle className="w-4 h-4 animate-spin" />}
            {mode === 'signin' ? 'Sign in securely' : mode === 'signup' ? 'Submit registration' : passwordRecovery ? 'Update password' : 'Send reset link'}
          </button>
        </form>

        {mode === 'reset' && <button type="button" onClick={() => switchMode('signin')} className="w-full mt-4 text-sm font-semibold text-brand-700">Back to sign in</button>}
      </div>
    </div>
  );
};

const Field: React.FC<{ label: string; value: string; onChange: (value: string) => void; placeholder: string }> = ({ label, value, onChange, placeholder }) => (
  <label className="block text-sm font-semibold text-slate-700">
    {label}
    <input required value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-normal" />
  </label>
);
