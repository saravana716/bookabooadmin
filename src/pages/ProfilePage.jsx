import React from 'react';
import { ShieldCheck, Mail, Calendar, Key, CheckCircle2, UserCheck, Shield } from 'lucide-react';
import { auth } from '../firebase';

export default function ProfilePage({ usersList = [] }) {
  // Find current admin account or auth user
  const currentAuthUser = auth.currentUser;
  const adminDoc = usersList.find(u => u.role === 'admin' || u.id === 'admin_account') || {};

  const name = currentAuthUser?.displayName || adminDoc.name || 'Sunil Kumar';
  const email = currentAuthUser?.email || adminDoc.email || 'admin@bookkaboo.com';
  const role = adminDoc.role || 'Super Administrator';

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto' }}>
      <div className="card" style={{ textAlign: 'center', padding: '2.5rem 1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ position: 'relative', width: '96px', height: '96px', margin: '0 auto 1.25rem' }}>
          <div
            style={{
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--primary), #ff8a4c)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              fontWeight: 800,
              boxShadow: '0 8px 20px rgba(255, 94, 21, 0.3)'
            }}
          >
            {name.slice(0, 2).toUpperCase()}
          </div>
          <div style={{ position: 'absolute', bottom: 0, right: 0, background: '#10b981', border: '2px solid #fff', width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 size={14} color="#fff" />
          </div>
        </div>

        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '0.25rem' }}>{name}</h2>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
          <Mail size={15} /> {email}
        </div>

        <div>
          <span className="badge badge-info" style={{ fontSize: '0.8rem', padding: '0.4rem 0.9rem' }}>
            <ShieldCheck size={14} /> {role}
          </span>
        </div>
      </div>

      {/* Admin Privileges */}
      <div className="card">
        <h3 className="card-title" style={{ marginBottom: '1rem' }}>System Privileges & Access</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[
            'Full Read & Write Access to Firestore Collections',
            'User Accounts & Reading Status Telemetry Supervision',
            'Interactive Quiz & Word Game Architecture Management',
            'Book Publishing & PDF Chapter Parsing Engine Access',
            'Push Notification Broadcasting & Real-time Dispatch'
          ].map((priv, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.875rem', color: 'var(--text-dark)' }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#ecfdf5', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <CheckCircle2 size={14} />
              </div>
              <span>{priv}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
