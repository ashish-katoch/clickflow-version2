import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Hexagon } from 'lucide-react';

export default function LoginPage() {
  const { login, register } = useAuth();
  const { theme } = useTheme();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError('');
    setLoading(true);
    try {
      const result = isRegister ? await register(email, password, name) : await login(email, password);
      if (!result.success) {
        setError(result.error);
        setLoading(false);
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center t-bg" data-testid="login-page">
      <div className="w-full max-w-sm mx-auto">
        <div className="flex items-center gap-2.5 justify-center mb-8">
          <Hexagon size={28} className="text-indigo-500" />
          <span className="text-xl font-bold tracking-tight t-text" style={{ fontFamily: 'Manrope' }}>ClickFlow</span>
        </div>
        <div className="border t-border rounded-lg t-surface p-6">
          <h2 className="text-lg font-semibold tracking-tight t-text mb-1" style={{ fontFamily: 'Manrope' }}>
            {isRegister ? 'Create your account' : 'Sign in'}
          </h2>
          <p className="text-sm t-text-secondary mb-5">
            {isRegister ? 'Register to join your workspace' : 'Welcome back to your workspace'}
          </p>
          {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-3 py-2 rounded-md mb-4" data-testid="auth-error">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-3">
            {isRegister && (
              <input data-testid="register-name-input" value={name} onChange={e => setName(e.target.value)} placeholder="Full name" required
                className="flex h-9 w-full rounded-md t-input px-3 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400" />
            )}
            <input data-testid="login-email-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address" required
              className="flex h-9 w-full rounded-md t-input px-3 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400" />
            <input data-testid="login-password-input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" required
              className="flex h-9 w-full rounded-md t-input px-3 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400" />
            <button type="submit" disabled={loading} data-testid="login-submit-btn"
              className="h-9 w-full rounded-md t-btn-primary text-sm font-medium transition-colors disabled:opacity-50">
              {loading ? 'Please wait...' : isRegister ? 'Create Account' : 'Sign In'}
            </button>
          </form>
          <div className="mt-5 text-center">
            <button onClick={() => { setIsRegister(!isRegister); setError(''); setLoading(false); }} data-testid="toggle-auth-mode"
              className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors font-medium">
              {isRegister ? 'Already have an account? Sign in' : "Need an account? Register here"}
            </button>
          </div>
        </div>
        {!isRegister && (
          <p className="text-xs t-text-muted text-center mt-4">
            Demo: admin@clickflow.com / admin123
          </p>
        )}
      </div>
    </div>
  );
}
