import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { SquaresFour, Lightning } from '@phosphor-icons/react';

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
    setError('');
    setLoading(true);
    const result = isRegister
      ? await register(email, password, name)
      : await login(email, password);
    if (!result.success) setError(result.error);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex" data-testid="login-page">
      {/* Left side - branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `url(https://images.unsplash.com/photo-1521202850558-0110494d0457?w=1200)`,
          backgroundSize: 'cover', backgroundPosition: 'center'
        }} />
        <div className="relative z-10 px-16 text-white">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-blue-700 rounded-lg flex items-center justify-center">
              <SquaresFour size={28} weight="duotone" className="text-white" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight" style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}>
              ClickFlow
            </h1>
          </div>
          <p className="text-xl text-slate-300 leading-relaxed max-w-md">
            The everything app for work. Manage tasks, track time, hit goals.
          </p>
          <div className="mt-12 space-y-4">
            {['Multiple views: List, Board, Calendar', 'Built-in time tracking', 'Goals & advanced dashboards', 'Team permissions & roles'].map((f, i) => (
              <div key={i} className="flex items-center gap-3 text-slate-400">
                <Lightning size={18} weight="fill" className="text-amber-400" />
                <span className="text-sm">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right side - form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-10 h-10 bg-blue-700 rounded-lg flex items-center justify-center">
              <SquaresFour size={22} weight="duotone" className="text-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}>ClickFlow</span>
          </div>

          <h2 className="text-2xl font-bold tracking-tight mb-1" style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}>
            {isRegister ? 'Create your account' : 'Welcome back'}
          </h2>
          <p className="text-sm text-slate-500 mb-6">
            {isRegister ? 'Start managing your projects today' : 'Sign in to your workspace'}
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-md mb-4" data-testid="auth-error">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <Label htmlFor="name" className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Name</Label>
                <Input id="name" data-testid="register-name-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="mt-1 border-slate-200 focus:ring-2 focus:ring-blue-700" required />
              </div>
            )}
            <div>
              <Label htmlFor="email" className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Email</Label>
              <Input id="email" data-testid="login-email-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="mt-1 border-slate-200 focus:ring-2 focus:ring-blue-700" required />
            </div>
            <div>
              <Label htmlFor="password" className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Password</Label>
              <Input id="password" data-testid="login-password-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 6 characters" className="mt-1 border-slate-200 focus:ring-2 focus:ring-blue-700" required />
            </div>
            <Button type="submit" data-testid="login-submit-btn" disabled={loading} className="w-full bg-blue-700 hover:bg-blue-800 text-white rounded-md h-10 font-medium">
              {loading ? 'Please wait...' : isRegister ? 'Create Account' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              data-testid="toggle-auth-mode"
              onClick={() => { setIsRegister(!isRegister); setError(''); }}
              className="text-sm text-blue-700 hover:text-blue-800 font-medium transition-colors"
            >
              {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
