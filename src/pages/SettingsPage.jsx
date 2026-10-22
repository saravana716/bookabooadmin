import React, { useState, useEffect } from 'react';
import { Settings, Save, CheckCircle2 } from 'lucide-react';
import { db, doc, onSnapshot, setDoc, serverTimestamp } from '../firebase';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    appName: 'Bookkaboo',
    supportEmail: 'support@bookkaboo.com',
    welcomeBonusPoints: 100,
    readingPointsPerPage: 10,
    dailyQuizReward: 200,
    enableGamification: true
  });
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'app_settings'), (snap) => {
      if (snap.exists()) {
        setSettings(prev => ({ ...prev, ...snap.data() }));
      }
    }, (err) => {
      console.warn('Error reading app settings:', err);
    });

    return () => unsub();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);
    try {
      await setDoc(doc(db, 'settings', 'app_settings'), {
        ...settings,
        updatedAt: serverTimestamp()
      }, { merge: true });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      alert('Error saving settings: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto' }}>
      <div className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">Platform & Gamification Settings</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
              Configured parameters are stored directly in Firestore `settings/app_settings`
            </p>
          </div>
          <Settings size={22} color="var(--primary)" />
        </div>

        {savedSuccess && (
          <div style={{ padding: '0.75rem 1rem', background: '#ecfdf5', color: '#059669', borderRadius: '8px', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>
            <CheckCircle2 size={16} /> Settings saved successfully in Firestore!
          </div>
        )}

        <form onSubmit={handleSave}>
          <div className="form-group">
            <label className="form-label">Platform / App Name</label>
            <input
              className="form-control"
              value={settings.appName}
              onChange={e => setSettings({ ...settings, appName: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Official Support Email</label>
            <input
              className="form-control"
              type="email"
              value={settings.supportEmail}
              onChange={e => setSettings({ ...settings, supportEmail: e.target.value })}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">New User Welcome Bonus (Pts)</label>
              <input
                className="form-control"
                type="number"
                value={settings.welcomeBonusPoints}
                onChange={e => setSettings({ ...settings, welcomeBonusPoints: Number(e.target.value) })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Quiz Game Reward (Pts)</label>
              <input
                className="form-control"
                type="number"
                value={settings.dailyQuizReward}
                onChange={e => setSettings({ ...settings, dailyQuizReward: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '0.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}>
              <input
                type="checkbox"
                checked={settings.enableGamification}
                onChange={e => setSettings({ ...settings, enableGamification: e.target.checked })}
                style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }}
              />
              Enable Interactive Games & Reward Points System
            </label>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.85rem', marginTop: '1rem', gap: '0.5rem' }}
            disabled={saving}
          >
            <Save size={16} /> {saving ? 'Saving...' : 'Save Configuration to Cloud'}
          </button>
        </form>
      </div>
    </div>
  );
}
