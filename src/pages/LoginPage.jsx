import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Loader2 } from 'lucide-react';
import { auth, signInWithEmailAndPassword } from '../firebase';

export default function LoginPage() {
  const [email, setEmail] = useState('admin@bookkaboo.com');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/');
    } catch (error) {
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%', background: '#fff' }}>
      <div style={{ flex: 1, background: 'linear-gradient(135deg, #0b132a 0%, #192342 100%)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '3rem', color: '#fff', textAlign: 'center' }}>
        <div style={{ width: '90px', height: '90px', borderRadius: '22px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', boxShadow: '0 12px 30px rgba(255,94,21,0.4)' }}>
          <BookOpen size={52} color="#fff" />
        </div>
        <h1 style={{ fontSize: '2.8rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>Bookkaboo</h1>
        <p style={{ color: '#94a3b8', fontSize: '1.15rem', maxWidth: '420px', lineHeight: 1.5 }}>Books for a Brighter You. Knowledge Anytime Anywhere.</p>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '3rem' }}>
        <div style={{ width: '100%', maxWidth: '380px' }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '0.4rem' }}>Welcome Back!</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Login to your admin panel</p>
          </div>
          {authError && <div style={{ color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '1.25rem', textAlign: 'center' }}>{authError}</div>}
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input className="form-control" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-control" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.85rem', fontSize: '1rem', marginTop: '0.5rem' }} disabled={loading}>
              {loading ? <Loader2 size={20} className="spin" /> : 'Login'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
