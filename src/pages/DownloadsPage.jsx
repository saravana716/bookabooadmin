import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Search, BookOpen, HardDrive, User, CheckCircle2, Calendar } from 'lucide-react';

export default function DownloadsPage({ downloads = [], usersList = [], books = [] }) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Map user data by ID for instant lookup
  const userMap = useMemo(() => {
    const map = {};
    usersList.forEach(u => {
      map[u.id] = u;
      if (u.uid) map[u.uid] = u;
    });
    return map;
  }, [usersList]);

  // Unique categories
  const categories = useMemo(() => {
    const set = new Set();
    downloads.forEach(d => { if (d.category) set.add(d.category); });
    return ['All', ...Array.from(set)];
  }, [downloads]);

  // Statistics
  const stats = useMemo(() => {
    const totalDownloads = downloads.length;
    const totalSizeMB = downloads.reduce((acc, d) => acc + (Number(d.sizeMB) || 0), 0);
    const uniqueUsers = new Set(downloads.map(d => d.userId || d.uid).filter(Boolean)).size;

    // Most downloaded book
    const counts = {};
    downloads.forEach(d => {
      const t = d.title || 'Unknown';
      counts[t] = (counts[t] || 0) + 1;
    });
    let topBook = '—';
    let max = 0;
    Object.entries(counts).forEach(([title, cnt]) => {
      if (cnt > max) { max = cnt; topBook = title; }
    });

    return { totalDownloads, totalSizeMB, uniqueUsers, topBook };
  }, [downloads]);

  // Filtered downloads
  const filteredDownloads = useMemo(() => {
    return downloads.filter(d => {
      const term = searchTerm.toLowerCase().trim();
      const user = userMap[d.userId || d.uid];
      const userEmail = (user?.email || '').toLowerCase();
      const userName = (user?.displayName || user?.name || '').toLowerCase();
      const title = (d.title || '').toLowerCase();
      const author = (d.author || '').toLowerCase();

      const matchesSearch = !term || title.includes(term) || author.includes(term) || userEmail.includes(term) || userName.includes(term);
      const matchesCategory = selectedCategory === 'All' || d.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [downloads, searchTerm, selectedCategory, userMap]);

  const formatDate = (val) => {
    if (!val) return '—';
    try {
      if (val.toDate && typeof val.toDate === 'function') {
        return val.toDate().toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      }
      if (val.seconds) {
        return new Date(val.seconds * 1000).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      }
      const d = new Date(val);
      if (!isNaN(d.getTime())) {
        return d.toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      }
    } catch (e) {}
    return '—';
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-dark)' }}>Downloads Management</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Real-time tracking of offline reading downloads from Firestore users collection
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1.25rem', marginBottom: '1.75rem' }}>
        <div className="card" style={{ padding: '1.25rem', marginBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>TOTAL DOWNLOADS</span>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
              <Download size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)' }}>{stats.totalDownloads}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Offline book packages</div>
        </div>

        <div className="card" style={{ padding: '1.25rem', marginBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>STORAGE DELIVERED</span>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
              <HardDrive size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#2563eb' }}>{stats.totalSizeMB} MB</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Bandwidth delivered to users</div>
        </div>

        <div className="card" style={{ padding: '1.25rem', marginBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>UNIQUE DOWNLOADERS</span>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
              <User size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#10b981' }}>{stats.uniqueUsers}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Users who downloaded books</div>
        </div>

        <div className="card" style={{ padding: '1.25rem', marginBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>TOP DOWNLOADED BOOK</span>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: '#faf5ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b5cf6' }}>
              <BookOpen size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-dark)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {stats.topBook}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Most saved title</div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {/* Toolbar */}
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '0.4rem 0.85rem',
                  borderRadius: '20px',
                  border: selectedCategory === cat ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                  background: selectedCategory === cat ? 'var(--primary-light)' : '#fff',
                  color: selectedCategory === cat ? 'var(--primary)' : 'var(--text-muted)',
                  fontWeight: selectedCategory === cat ? 700 : 500,
                  fontSize: '0.8rem',
                  cursor: 'pointer'
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          <div style={{ position: 'relative', width: '280px' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              className="form-control"
              placeholder="Search downloads..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '2.4rem', height: '36px', fontSize: '0.85rem', borderRadius: '18px' }}
            />
          </div>
        </div>

        {/* Table */}
        <div className="table-responsive">
          <table className="custom-table" style={{ margin: 0 }}>
            <thead>
              <tr>
                <th>User</th>
                <th>Book Title</th>
                <th>Category & Author</th>
                <th>File Size</th>
                <th>Status</th>
                <th>Downloaded On</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredDownloads.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                    <Download size={36} color="var(--text-light)" style={{ margin: '0 auto 0.75rem', display: 'block' }} />
                    <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>No downloads recorded</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>
                      Downloads will appear here in real time as users save books for offline reading.
                    </div>
                  </td>
                </tr>
              ) : (
                filteredDownloads.map((d) => {
                  const user = userMap[d.userId || d.uid];
                  const userDisplayName = user?.displayName || user?.name || (user?.email ? user.email.split('@')[0] : 'User');

                  return (
                    <tr key={d.id}>
                      {/* User */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.75rem', flexShrink: 0 }}>
                            {userDisplayName.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-dark)' }}>
                              {userDisplayName}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {user?.email || d.userId || 'Unknown User'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Book */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          {d.cover ? (
                            <img src={d.cover} alt={d.title} style={{ width: '32px', height: '42px', objectFit: 'cover', borderRadius: '4px', flexShrink: 0 }} />
                          ) : (
                            <div style={{ width: '32px', height: '42px', borderRadius: '4px', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <BookOpen size={14} color="var(--primary)" />
                            </div>
                          )}
                          <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-dark)' }}>
                            {d.title || 'Untitled Book'}
                          </div>
                        </div>
                      </td>

                      {/* Category & Author */}
                      <td>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-dark)' }}>
                          {d.author || 'Author'}
                        </div>
                        <span className="badge badge-warning" style={{ fontSize: '0.65rem', marginTop: '0.2rem' }}>
                          {d.category || 'General'}
                        </span>
                      </td>

                      {/* File Size */}
                      <td>
                        <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-dark)' }}>
                          {d.sizeMB ? `${d.sizeMB} MB` : 'Complete'}
                        </span>
                      </td>

                      {/* Status */}
                      <td>
                        <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>
                          <CheckCircle2 size={12} /> {d.status || 'Completed'}
                        </span>
                      </td>

                      {/* Downloaded Date */}
                      <td>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-dark)', fontWeight: 600 }}>
                          {formatDate(d.downloadedAt)}
                        </div>
                      </td>

                      {/* Action */}
                      <td style={{ textAlign: 'right' }}>
                        {d.userId && (
                          <button
                            className="btn btn-outline"
                            style={{ padding: '0.35rem 0.7rem', fontSize: '0.75rem', borderRadius: '6px' }}
                            onClick={() => navigate(`/users/${d.userId}`)}
                          >
                            View User
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
