import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, KeyRound, Mail, Send } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store/store';
import {
  clearError,
  requestPasswordReset,
  resetPassword,
} from '../store/slices/authSlice';

const ForgotPassword: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [step, setStep] = useState<'details' | 'verify'>('details');
  const [message, setMessage] = useState('');
  const [localError, setLocalError] = useState('');
  const [passwordChanged, setPasswordChanged] = useState(false);

  const handleRequestCode = async (event: React.FormEvent) => {
    event.preventDefault();
    dispatch(clearError());
    setMessage('');
    setLocalError('');
    setPasswordChanged(false);

    if (password.length < 6) {
      setLocalError('Your new password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setLocalError('Passwords do not match.');
      return;
    }

    try {
      const result = await dispatch(requestPasswordReset(email)).unwrap();
      setMessage(result.message);
      setStep('verify');
    } catch {
      // The server error is stored in Redux.
    }
  };

  const handleVerifyCode = async (event: React.FormEvent) => {
    event.preventDefault();
    dispatch(clearError());
    setMessage('');
    setLocalError('');
    setPasswordChanged(false);

    if (!/^\d{6}$/.test(verificationCode)) {
      setLocalError('Enter the six-digit verification code sent to your email.');
      return;
    }

    try {
      const result = await dispatch(
        resetPassword({ email, code: verificationCode, password })
      ).unwrap();
      setMessage(result.message);
      setPasswordChanged(true);
      window.setTimeout(() => navigate('/login'), 1600);
    } catch {
      // The server error is stored in Redux.
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-80px)] items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-50 text-blue-700">
            <KeyRound size={30} />
          </div>
          <h1 className="mt-6 text-3xl font-bold text-slate-900">
            {step === 'details' ? 'Choose a new password' : 'Verify your email'}
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            {step === 'details'
              ? 'Enter your account email and new password. We will then send a six-digit verification code.'
              : 'Enter the six-digit code sent to your email to save the new password.'}
          </p>
        </div>

        <form
          className="mt-8 space-y-5"
          onSubmit={step === 'details' ? handleRequestCode : handleVerifyCode}
        >
          {(error || localError) && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {localError || error}
            </div>
          )}
          {message && (
            <div className="flex items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              <CheckCircle2 className="mt-0.5" size={18} />
              <span>{message}</span>
            </div>
          )}

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Email address</span>
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 text-slate-400" size={18} />
              <input
                required
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                readOnly={step === 'verify'}
                className={`w-full rounded-2xl border border-slate-200 py-3 pl-11 pr-4 ${
                  step === 'verify' ? 'bg-slate-50 text-slate-500' : ''
                }`}
                placeholder="you@example.com"
              />
            </div>
          </label>

          {step === 'details' ? (
            <>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">New password</span>
                <input
                  required
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                  placeholder="At least 6 characters"
                />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">Confirm new password</span>
                <input
                  required
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                  placeholder="Repeat your new password"
                />
              </label>
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Send size={17} />
                {isLoading ? 'Sending verification code...' : 'Continue'}
              </button>
            </>
          ) : (
            <>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">Verification code</span>
                <input
                  required
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(event) =>
                    setVerificationCode(event.target.value.replace(/\D/g, '').slice(0, 6))
                  }
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-center text-xl font-semibold tracking-[0.3em]"
                  placeholder="000000"
                />
              </label>
              <button
                type="submit"
                disabled={isLoading || passwordChanged}
                className="w-full rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? 'Verifying code...' : 'Confirm and change password'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep('details');
                  setVerificationCode('');
                  setMessage('');
                  setLocalError('');
                  setPasswordChanged(false);
                  dispatch(clearError());
                }}
                className="w-full text-sm font-semibold text-blue-700 hover:text-blue-800"
              >
                Change email or password
              </button>
            </>
          )}
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          <Link className="font-semibold text-blue-700 hover:text-blue-800" to="/login">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
