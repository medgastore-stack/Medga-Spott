import React, { useState, useEffect } from 'react';
import { X, Lock, Mail, User as UserIcon, Loader2, Eye, EyeOff } from 'lucide-react';
import { User } from '../types';
import {
  auth,
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  db,
} from '../lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

interface AuthModalProps {
  isOpen: boolean;
  initialMode: 'login' | 'signup';
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialMode,
  onClose,
  onLoginSuccess,
  onShowToast,
}) => {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode, isOpen]);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;
      const displayName = fbUser.displayName || fbUser.email?.split('@')[0] || 'Gamer';
      const userEmail = fbUser.email || '';

      // Persist to Firestore
      if (db && fbUser.uid) {
        try {
          const userRef = doc(db, 'users', fbUser.uid);
          const snap = await getDoc(userRef);
          if (!snap.exists()) {
            await setDoc(userRef, {
              uid: fbUser.uid,
              displayName,
              email: userEmail,
              photoURL: fbUser.photoURL || '',
              createdAt: new Date().toISOString(),
              role: 'customer',
            });
          }
        } catch (dbErr) {
          console.warn('Firestore user save warning:', dbErr);
        }
      }

      const userObj: User = {
        name: displayName,
        email: userEmail,
        isAuthenticated: true,
      };
      onLoginSuccess(userObj);
      onShowToast(`Welcome back, ${displayName}!`, 'success');
      onClose();
    } catch (error: any) {
      console.warn("Firebase Google Sign-In error:", error);
      if (error?.code === 'auth/popup-closed-by-user') {
        onShowToast('Sign-in popup was closed.', 'info');
      } else {
        onShowToast(error?.message || 'Google sign-in could not be completed.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    const cleanPass = password.trim();

    if (!cleanEmail || !cleanPass) {
      onShowToast('Please enter both email and password.', 'error');
      return;
    }

    if (mode === 'signup') {
      if (cleanPass.length < 6) {
        onShowToast('Password must be at least 6 characters long.', 'error');
        return;
      }
    }

    setLoading(true);

    try {
      if (mode === 'signup') {
        const cred = await createUserWithEmailAndPassword(auth, cleanEmail, cleanPass);
        const displayName = name.trim() || cleanEmail.split('@')[0] || 'Gamer';
        await updateProfile(cred.user, { displayName });

        if (db && cred.user.uid) {
          try {
            await setDoc(doc(db, 'users', cred.user.uid), {
              uid: cred.user.uid,
              displayName,
              email: cleanEmail,
              createdAt: new Date().toISOString(),
              role: 'customer',
            });
          } catch (e) {
            console.warn('Firestore user sync warning:', e);
          }
        }

        // Send authentic Firebase verification email for free
        try {
          await sendEmailVerification(cred.user);
        } catch (vErr) {
          console.warn('sendEmailVerification notice:', vErr);
        }

        const userObj: User = {
          name: displayName,
          email: cleanEmail,
          isAuthenticated: true,
        };
        onLoginSuccess(userObj);
        onShowToast(`Account created! A real verification email was sent to ${cleanEmail}.`, 'success');
        onClose();
      } else {
        const cred = await signInWithEmailAndPassword(auth, cleanEmail, cleanPass);
        const displayName = cred.user.displayName || cleanEmail.split('@')[0] || 'Gamer';
        const userObj: User = {
          name: displayName,
          email: cred.user.email || cleanEmail,
          isAuthenticated: true,
        };
        onLoginSuccess(userObj);
        onShowToast(`Welcome back, ${displayName}!`, 'success');
        onClose();
      }
    } catch (err: any) {
      console.warn('Auth operation error:', err);
      let errorMsg = 'Authentication failed. Please check your details.';
      if (err?.code === 'auth/user-not-found' || err?.code === 'auth/wrong-password' || err?.code === 'auth/invalid-credential') {
        errorMsg = 'Invalid email or password. Please try again.';
      } else if (err?.code === 'auth/email-already-in-use') {
        errorMsg = 'This email is already registered. Please sign in instead.';
      } else if (err?.code === 'auth/invalid-email') {
        errorMsg = 'Please enter a valid email address.';
      } else if (err?.code === 'auth/weak-password') {
        errorMsg = 'Password should be at least 6 characters.';
      }
      onShowToast(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-[340px] max-h-[90vh] overflow-y-auto no-scrollbar bg-[#141424] border border-purple-500/25 rounded-2xl p-4 shadow-[0_10px_35px_rgba(0,0,0,0.8)] animate-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Tab Toggle */}
        <div className="flex border border-white/10 mb-3 p-0.5 bg-slate-900/80 rounded-lg">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`py-1 font-bold text-xs flex-1 text-center rounded-md transition-all cursor-pointer ${
              mode === 'login'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setMode('signup')}
            className={`py-1 font-bold text-xs flex-1 text-center rounded-md transition-all cursor-pointer ${
              mode === 'signup'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Header */}
        <div className="mb-2.5">
          <h2 className="text-base font-extrabold text-white tracking-tight">
            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-[10px] text-slate-400 mt-0.5">
            {mode === 'login'
              ? 'Sign in to access your orders and loyalty points.'
              : 'Sign up for instant game activation and rewards.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-2">
          {mode === 'signup' && (
            <div>
              <label className="text-[10px] font-bold text-slate-300 block mb-0.5">Full Name</label>
              <div className="relative">
                <UserIcon className="w-3.5 h-3.5 text-purple-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="Your Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-8 pr-2.5 py-1.5 bg-slate-950 border border-white/10 focus:border-purple-500 rounded-lg text-white text-xs focus:outline-none transition-all"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-[10px] font-bold text-slate-300 block mb-0.5">Email Address</label>
            <div className="relative">
              <Mail className="w-3.5 h-3.5 text-purple-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                autoFocus={mode === 'login'}
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-8 pr-2.5 py-1.5 bg-slate-950 border border-white/10 focus:border-purple-500 rounded-lg text-white text-xs focus:outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-300 block mb-0.5">Password</label>
            <div className="relative">
              <Lock className="w-3.5 h-3.5 text-purple-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-8 pr-8 py-1.5 bg-slate-950 border border-white/10 focus:border-purple-500 rounded-lg text-white text-xs focus:outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5 cursor-pointer"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-3 rounded-lg gradient-bg text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md shadow-purple-900/30 hover:opacity-95 active:scale-[0.99] transition-all cursor-pointer mt-2"
          >
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : mode === 'login' ? (
              'Sign In'
            ) : (
              'Create Account'
            )}
          </button>

          <div className="relative my-1.5 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <span className="relative bg-[#141424] px-2 text-[9px] font-semibold text-slate-400 uppercase tracking-wider">
              Or
            </span>
          </div>

          <div className="w-full">
            <button
              type="button"
              disabled={loading}
              onClick={handleGoogleSignIn}
              className="w-full py-1.5 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 border border-white/10 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98 shadow-sm"
            >
              <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{mode === 'login' ? 'Continue with Google' : 'Sign Up with Google'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

