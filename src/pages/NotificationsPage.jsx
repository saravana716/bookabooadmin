import React, { useState, useEffect } from 'react';
import { Bell, Send, CheckCircle2, Users, Clock, Trash2 } from 'lucide-react';
import { db, collection, addDoc, onSnapshot, deleteDoc, doc, serverTimestamp } from '../firebase';

export default function NotificationsPage({ usersList = [] }) {
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [targetAudience, setTargetAudience] = useState('all'); // 'all' | 'readers' | 'gamers'
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState([]);

  // Real-time synchronization of notifications collection
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'notifications'), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => {
        const getT = (v) => {
          if (!v) return 0;
          if (v.seconds) return v.seconds * 1000;
          const d = new Date(v);
          return isNaN(d.getTime()) ? 0 : d.getTime();
        };
        return getT(b.sentAt || b.createdAt) - getT(a.sentAt || a.createdAt);
      });
      setHistory(list);
    }, (err) => {
      console.warn('Error reading notifications:', err);
    });

    return () => unsub();
  }, []);

  const [filterType, setFilterType] = useState('all'); // 'all' | 'Social' | 'Updates' | 'Broadcast'

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!notifTitle.trim() || !notifMessage.trim()) return;

    setSending(true);
    try {
      const recipientCount = 
        targetAudience === 'readers' 
          ? usersList.filter(u => u.lastActiveReading?.bookId).length 
          : targetAudience === 'gamers'
          ? usersList.filter(u => u.gameProgress || u.gameLevels).length
          : usersList.length;

      await addDoc(collection(db, 'notifications'), {
        title: notifTitle.trim(),
        description: notifMessage.trim(),
        message: notifMessage.trim(),
        targetAudience,
        recipientsCount: recipientCount,
        type: 'Updates',
        icon: 'notifications',
        color: '#ff5e15',
        bgColor: '#fff1eb',
        read: false,
        status: 'Sent',
        sentAt: serverTimestamp(),
        createdAt: serverTimestamp()
      });

      alert('✅ Push Notification successfully broadcasted!');
      setNotifTitle('');
      setNotifMessage('');
    } catch (err) {
      console.error('Error broadcasting notification:', err);
      alert('Failed to send notification: ' + err.message);
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this notification log?')) return;
    try {
      await deleteDoc(doc(db, 'notifications', id));
    } catch (e) {
      console.error(e);
    }
  };

  const formatDate = (val) => {
    if (!val) return '—';
    try {
      if (val.toDate && typeof val.toDate === 'function') {
        return val.toDate().toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
      }
      if (val.seconds) {
        return new Date(val.seconds * 1000).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
      }
      const d = new Date(val);
      if (!isNaN(d.getTime())) {
        return d.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
      }
    } catch (e) {}
    return String(val);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-dark)' }}>Push Notifications Broadcast</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Send real-time mobile push notifications to all users, active readers, or gamers
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        {/* Send Notification Card */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Compose Notification</h3>
            <Bell size={20} color="var(--primary)" />
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Target Audience</label>
              <select 
                className="form-control" 
                value={targetAudience} 
                onChange={e => setTargetAudience(e.target.value)}
              >
                <option value="all">All Users ({usersList.length} accounts)</option>
                <option value="readers">Active Readers ({usersList.filter(u => u.lastActiveReading?.bookId).length} users)</option>
                <option value="gamers">Active Gamers ({usersList.filter(u => u.gameProgress || u.gameLevels).length} users)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Notification Title</label>
              <input
                className="form-control"
                placeholder="e.g. New Chapter Available! 📖"
                value={notifTitle}
                onChange={e => setNotifTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Message Content</label>
              <textarea
                className="form-control"
                rows="4"
                placeholder="Write your push notification message here..."
                value={notifMessage}
                onChange={e => setNotifMessage(e.target.value)}
                required
              ></textarea>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.8rem', gap: '0.5rem' }}
              disabled={sending}
            >
              <Send size={16} /> {sending ? 'Broadcasting...' : 'Broadcast Push Notification'}
            </button>
          </form>
        </div>

        {/* History Log Card */}
        <div className="card">
          <div className="card-header" style={{ flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.85rem' }}>
            <div>
              <h3 className="card-title">Notification Logs & History</h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{history.length} Live Notifications</span>
            </div>

            {/* Filter Tabs */}
            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
              {[
                { id: 'all', label: `All (${history.length})` },
                { id: 'Social', label: `Social (${history.filter(h => h.type === 'Social').length})` },
                { id: 'Updates', label: `Updates (${history.filter(h => h.type === 'Updates').length})` },
                { id: 'Broadcast', label: `Broadcasts (${history.filter(h => !h.type || h.targetAudience).length})` }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setFilterType(f.id)}
                  style={{
                    padding: '0.25rem 0.65rem',
                    borderRadius: '6px',
                    border: 'none',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: filterType === f.id ? 'var(--primary)' : '#f1f5f9',
                    color: filterType === f.id ? '#fff' : 'var(--text-muted)'
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              <Bell size={36} color="var(--text-light)" style={{ margin: '0 auto 0.75rem', display: 'block' }} />
              <div style={{ fontWeight: 600 }}>No notifications found in database</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginTop: '0.2rem' }}>
                Broadcast history is stored directly in Firestore `notifications` collection
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', maxHeight: '460px', overflowY: 'auto', paddingRight: '0.25rem' }}>
              {history
                .filter(item => {
                  if (filterType === 'all') return true;
                  if (filterType === 'Social') return item.type === 'Social';
                  if (filterType === 'Updates') return item.type === 'Updates';
                  if (filterType === 'Broadcast') return !item.type || item.targetAudience;
                  return true;
                })
                .map(item => (
                <div
                  key={item.id}
                  style={{
                    padding: '0.85rem',
                    background: '#f8fafc',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start'
                  }}
                >
                  <div style={{ flex: 1, marginRight: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-dark)' }}>
                        {item.title}
                      </span>
                      {item.type && (
                        <span style={{ fontSize: '0.65rem', background: item.bgColor || '#eff6ff', color: item.color || '#2563eb', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 700 }}>
                          {item.type}
                        </span>
                      )}
                      <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>
                        ● {item.status || (item.read ? 'Read' : 'Delivered')}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '0.45rem', lineHeight: 1.4 }}>
                      {item.description || item.message || '—'}
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.7rem', color: 'var(--text-light)', flexWrap: 'wrap' }}>
                      {item.data?.groupName && (
                        <span>Club: <strong style={{ color: 'var(--text-dark)' }}>{item.data.groupName}</strong></span>
                      )}
                      {item.targetAudience && (
                        <span>Target: <strong>{item.targetAudience}</strong></span>
                      )}
                      {item.recipientsCount !== undefined && (
                        <span>Recipients: <strong>{item.recipientsCount}</strong></span>
                      )}
                      <span>Time: <strong>{formatDate(item.createdAt || item.sentAt)}</strong></span>
                    </div>
                  </div>

                  <button
                    className="btn-icon"
                    style={{ color: 'var(--danger)', flexShrink: 0 }}
                    onClick={() => handleDelete(item.id)}
                    title="Delete log"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
