import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Hexagon } from 'lucide-react';

export default function LoginPage() {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    const result = isRegister ? await register(email, password, name) : await login(email, password);
    if (!result.success) setError(result.error);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950" data-testid="login-page">
      <div className="w-full max-w-sm mx-auto">
        <div className="flex items-center gap-2.5 justify-center mb-8">
          <Hexagon size={28} className="text-indigo-400" />
          <span className="text-xl font-bold tracking-tight" style={{ fontFamily: 'Manrope, sans-serif' }}>ClickFlow</span>
        </div>
        <div className="border border-zinc-800 rounded-lg bg-zinc-900/50 p-6">
          <h2 className="text-lg font-semibold tracking-tight mb-1" style={{ fontFamily: 'Manrope, sans-serif' }}>
            {isRegister ? 'Create your account' : 'Sign in'}
          </h2>
          <p className="text-sm text-zinc-400 mb-5">{isRegister ? 'Start managing your projects' : 'Welcome back'}</p>
          {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-3 py-2 rounded-md mb-4" data-testid="auth-error">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-3">
            {isRegister && (
              <input data-testid="register-name-input" value={name} onChange={e => setName(e.target.value)} placeholder="Name" required
                className="flex h-9 w-full rounded-md border border-zinc-800 bg-transparent px-3 text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-400" />
            )}
            <input data-testid="login-email-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" required
              className="flex h-9 w-full rounded-md border border-zinc-800 bg-transparent px-3 text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-400" />
            <input data-testid="login-password-input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" required
              className="flex h-9 w-full rounded-md border border-zinc-800 bg-transparent px-3 text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-400" />
            <button type="submit" disabled={loading} data-testid="login-submit-btn"
              className="h-9 w-full rounded-md bg-white text-black text-sm font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50">
              {loading ? 'Please wait...' : isRegister ? 'Create Account' : 'Sign In'}
            </button>
          </form>
          <div className="mt-4 text-center">
            <button onClick={() => { setIsRegister(!isRegister); setError(''); }} data-testid="toggle-auth-mode"
              className="text-sm text-zinc-400 hover:text-zinc-50 transition-colors">
              {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
