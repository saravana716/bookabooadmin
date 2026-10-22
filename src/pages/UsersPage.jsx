import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  BookOpen, 
  Gamepad2, 
  Award, 
  Download, 
  Bookmark, 
  Search, 
  Filter, 
  ChevronRight, 
  ExternalLink,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  Clock,
  Star
} from 'lucide-react';
import { sanitizeImageUrl } from '../utils/imageHelper';

export default function UsersPage({ usersList = [], books = [], downloads = [], reviews = [], setSelectedUser }) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'reading' | 'gamers' | 'reviewers' | 'admins'

  // Map download counts per user
  const downloadCountByUser = useMemo(() => {
    const counts = {};
    downloads.forEach(d => {
      const uid = d.userId || d.uid;
      if (uid) counts[uid] = (counts[uid] || 0) + 1;
    });
    return counts;
  }, [downloads]);

  // Map review counts per user
  const reviewCountByUser = useMemo(() => {
    const counts = {};
    reviews.forEach(r => {
      const uid = r.userId || r.uid;
      if (uid) counts[uid] = (counts[uid] || 0) + 1;
    });
    return counts;
  }, [reviews]);

  // Overall Statistics
  const stats = useMemo(() => {
    const totalUsers = usersList.length;
    const activeReaders = usersList.filter(u => u.lastActiveReading && u.lastActiveReading.bookId).length;
    const gamers = usersList.filter(u => u.gameProgress || u.gameLevels).length;
    const reviewersCount = usersList.filter(u => (reviewCountByUser[u.id] || 0) > 0).length;
    const totalPoints = usersList.reduce((acc, u) => acc + (Number(u.points) || 0), 0);
    const unlockedUsersCount = usersList.filter(u => u.unlockedBooks && Object.keys(u.unlockedBooks).length > 0).length;
    const devicesCount = usersList.filter(u => u.currentDeviceId || u.pushToken).length;
    return { totalUsers, activeReaders, gamers, reviewersCount, totalPoints, unlockedUsersCount, devicesCount };
  }, [usersList, reviewCountByUser]);

  // Filtered list
  const filteredUsers = useMemo(() => {
    return usersList.filter(u => {
      const name = (u.displayName || u.name || '').toLowerCase();
      const email = (u.email || '').toLowerCase();
      const uid = (u.id || u.uid || '').toLowerCase();
      const bookTitle = (u.lastActiveReading?.title || '').toLowerCase();
      const term = searchTerm.toLowerCase().trim();

      const matchesSearch = !term || name.includes(term) || email.includes(term) || uid.includes(term) || bookTitle.includes(term);

      if (!matchesSearch) return false;

      if (activeTab === 'reading') {
        return !!(u.lastActiveReading && u.lastActiveReading.bookId);
      }
      if (activeTab === 'gamers') {
        return !!(u.gameProgress || u.gameLevels);
      }
      if (activeTab === 'reviewers') {
        return (reviewCountByUser[u.id] || 0) > 0;
      }
      if (activeTab === 'unlocked') {
        return !!(u.unlockedBooks && Object.keys(u.unlockedBooks).length > 0);
      }
      if (activeTab === 'devices') {
        return !!(u.currentDeviceId || u.pushToken);
      }
      if (activeTab === 'admins') {
        return u.role === 'admin';
      }
      return true;
    });
  }, [usersList, searchTerm, activeTab, reviewCountByUser]);

  const formatDate = (val) => {
    if (!val) return '—';
    try {
      if (val.toDate && typeof val.toDate === 'function') {
        return val.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      }
      if (val.seconds) {
        return new Date(val.seconds * 1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      }
      const d = new Date(val);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      }
    } catch (e) {}
    return '—';
  };

  const getInitials = (user) => {
    const name = user.displayName || user.name || user.email || 'U';
    return name.slice(0, 2).toUpperCase();
  };

  const getAvatarColor = (id = '') => {
    const colors = [
      'linear-gradient(135deg, #6366f1, #8b5cf6)',
      'linear-gradient(135deg, #ec4899, #f43f5e)',
      'linear-gradient(135deg, #f59e0b, #d97706)',
      'linear-gradient(135deg, #10b981, #059669)',
      'linear-gradient(135deg, #3b82f6, #2563eb)',
      'linear-gradient(135deg, #ff5e15, #ea4e05)'
    ];
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash += id.charCodeAt(i);
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-dark)', letterSpacing: '-0.3px' }}>Users Directory</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Real-time synchronization with Firebase: user reading status, games played, bookmarks, and downloads
          </p>
        </div>
      </div>

      {/* Top Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1.25rem', marginBottom: '1.75rem' }}>
        <div className="card" style={{ padding: '1.25rem', marginBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>TOTAL USERS</span>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
              <Users size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-dark)' }}>{stats.totalUsers}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Registered accounts in DB</div>
        </div>

        <div className="card" style={{ padding: '1.25rem', marginBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>ACTIVE READERS</span>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
              <BookOpen size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#10b981' }}>{stats.activeReaders}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Currently reading a book</div>
        </div>

        <div className="card" style={{ padding: '1.25rem', marginBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>ACTIVE GAMERS</span>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: '#faf5ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b5cf6' }}>
              <Gamepad2 size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#8b5cf6' }}>{stats.gamers}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>With game progress & scores</div>
        </div>

        <div className="card" style={{ padding: '1.25rem', marginBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>TOTAL USER POINTS</span>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
              <Award size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)' }}>{stats.totalPoints.toLocaleString()}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Total gamification pts earned</div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {/* Search & Filter Toolbar */}
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          {/* Filter Chips */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: `All Users (${stats.totalUsers})` },
              { id: 'reading', label: `Reading Now (${stats.activeReaders})` },
              { id: 'gamers', label: `Gamers (${stats.gamers})` },
              { id: 'reviewers', label: `Reviewers (${stats.reviewersCount})` },
              { id: 'unlocked', label: `Points Unlocked (${stats.unlockedUsersCount})` },
              { id: 'devices', label: `Mobile Devices (${stats.devicesCount})` },
              { id: 'admins', label: 'Admins' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '0.45rem 0.9rem',
                  borderRadius: '20px',
                  border: activeTab === tab.id ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                  background: activeTab === tab.id ? 'var(--primary-light)' : '#fff',
                  color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-muted)',
                  fontWeight: activeTab === tab.id ? 700 : 500,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative', width: '280px' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              className="form-control"
              placeholder="Search user, email, book..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '2.4rem', height: '36px', fontSize: '0.85rem', borderRadius: '18px' }}
            />
          </div>
        </div>

        {/* Table Content */}
        <div className="table-responsive">
          <table className="custom-table" style={{ margin: 0 }}>
            <thead>
              <tr>
                <th>User Details</th>
                <th>Role & Points</th>
                <th>Book Read Status</th>
                <th>Game Levels & History</th>
                <th>Downloads</th>
                <th>Bookmarks</th>
                <th>Reviews</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                    <Users size={36} color="var(--text-light)" style={{ margin: '0 auto 0.75rem', display: 'block' }} />
                    <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>No users found matching your filters</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>Try adjusting your search query or switching tabs</div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const avatarSrc = sanitizeImageUrl(u.photoURL || u.avatarUrl);
                  const displayName = u.displayName || u.name || (u.email ? u.email.split('@')[0] : 'User');
                  const userDownloads = downloadCountByUser[u.id || u.uid] || 0;
                  const bookmarkCount = Array.isArray(u.bookmarks) ? u.bookmarks.length : 0;
                  const reading = u.lastActiveReading;
                  const gameLevels = u.gameLevels || {};
                  const gameProgress = u.gameProgress || {};
                  const hasGameActivity = Object.keys(gameLevels).length > 0 || Object.keys(gameProgress).length > 0;

                  return (
                    <tr key={u.id} style={{ transition: 'background 0.15s ease' }}>
                      {/* User Column */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                          {avatarSrc ? (
                            <img
                              src={avatarSrc}
                              alt={displayName}
                              style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #e2e8f0', flexShrink: 0 }}
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                          ) : (
                            <div
                              style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                background: getAvatarColor(u.id),
                                color: '#fff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 800,
                                fontSize: '0.85rem',
                                flexShrink: 0,
                                boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                              }}
                            >
                              {getInitials(u)}
                            </div>
                          )}
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-dark)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '160px' }}>
                              {displayName}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '160px' }}>
                              {u.email || 'No email provided'}
                            </div>
                            <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.2rem', alignItems: 'center', flexWrap: 'wrap' }}>
                              <span style={{ fontSize: '0.65rem', color: 'var(--text-light)', fontFamily: 'monospace' }}>
                                {(u.id || '').slice(0, 6)}...
                              </span>
                              {u.unlockedBooks && Object.keys(u.unlockedBooks).length > 0 && (
                                <span style={{ fontSize: '0.65rem', background: '#fef3c7', color: '#b45309', padding: '0.05rem 0.35rem', borderRadius: '4px', fontWeight: 700 }}>
                                  ✨ {Object.keys(u.unlockedBooks).length} Unlocked
                                </span>
                              )}
                              {u.currentDeviceId && (
                                <span title={`Device: ${u.currentDeviceId}`} style={{ fontSize: '0.65rem', background: '#eff6ff', color: '#2563eb', padding: '0.05rem 0.35rem', borderRadius: '4px', fontWeight: 600 }}>
                                  📱 App
                                </span>
                              )}
                              {u.pushToken && (
                                <span title="Push Notifications Active (FCM)" style={{ fontSize: '0.65rem', background: '#ecfdf5', color: '#059669', padding: '0.05rem 0.35rem', borderRadius: '4px', fontWeight: 600 }}>
                                  🔔 Push
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role & Points */}
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', alignItems: 'flex-start' }}>
                          <span
                            className={u.role === 'admin' ? 'badge badge-info' : 'badge'}
                            style={{
                              background: u.role === 'admin' ? '#eff6ff' : '#f1f5f9',
                              color: u.role === 'admin' ? '#2563eb' : '#475569',
                              border: 'none',
                              fontSize: '0.7rem',
                              textTransform: 'uppercase',
                              fontWeight: 700
                            }}
                          >
                            {u.role || 'User'}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', fontWeight: 800, color: 'var(--primary)' }}>
                            <Award size={13} />
                            {(Number(u.points) || 0).toLocaleString()} pts
                          </div>
                        </div>
                      </td>

                      {/* Reading Status */}
                      <td>
                        {reading && reading.bookId ? (
                          <div style={{ minWidth: '150px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.2rem' }}>
                              <BookOpen size={13} color="var(--primary)" />
                              <span style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-dark)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>
                                {reading.title || 'Book in progress'}
                              </span>
                            </div>
                            {reading.currentChapterTitle && (
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '150px', marginBottom: '0.3rem' }}>
                                {reading.currentChapterTitle}
                              </div>
                            )}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <div style={{ flex: 1, height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                                <div
                                  style={{
                                    width: `${Math.min(100, Math.max(2, reading.progressPercent || 0))}%`,
                                    height: '100%',
                                    background: 'var(--primary)',
                                    borderRadius: '3px'
                                  }}
                                />
                              </div>
                              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-dark)' }}>
                                {reading.progressPercent || 0}%
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontStyle: 'italic' }}>
                            No active book
                          </span>
                        )}
                      </td>

                      {/* Game Levels & History */}
                      <td>
                        {hasGameActivity ? (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', maxWidth: '190px' }}>
                            {gameLevels.quiz !== undefined && (
                              <span style={{ background: '#fef3c7', color: '#92400e', fontSize: '0.65rem', padding: '0.15rem 0.4rem', borderRadius: '4px', fontWeight: 700 }}>
                                Quiz L{gameLevels.quiz}
                              </span>
                            )}
                            {gameLevels.wordsearch !== undefined && (
                              <span style={{ background: '#e0e7ff', color: '#3730a3', fontSize: '0.65rem', padding: '0.15rem 0.4rem', borderRadius: '4px', fontWeight: 700 }}>
                                Word L{gameLevels.wordsearch}
                              </span>
                            )}
                            {gameLevels.memory !== undefined && (
                              <span style={{ background: '#dcfce7', color: '#166534', fontSize: '0.65rem', padding: '0.15rem 0.4rem', borderRadius: '4px', fontWeight: 700 }}>
                                Memory L{gameLevels.memory}
                              </span>
                            )}
                            {gameLevels.puzzle !== undefined && (
                              <span style={{ background: '#fce7f3', color: '#9d174d', fontSize: '0.65rem', padding: '0.15rem 0.4rem', borderRadius: '4px', fontWeight: 700 }}>
                                Puzzle L{gameLevels.puzzle}
                              </span>
                            )}
                            {Object.keys(gameLevels).length === 0 && (
                              <span style={{ background: '#f1f5f9', color: '#475569', fontSize: '0.65rem', padding: '0.15rem 0.4rem', borderRadius: '4px', fontWeight: 600 }}>
                                {Object.keys(gameProgress).length} Games Played
                              </span>
                            )}
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontStyle: 'italic' }}>
                            Not played yet
                          </span>
                        )}
                      </td>

                      {/* Downloads */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, fontSize: '0.8rem' }}>
                          <Download size={14} color={userDownloads > 0 ? 'var(--primary)' : 'var(--text-light)'} />
                          <span style={{ color: userDownloads > 0 ? 'var(--text-dark)' : 'var(--text-light)' }}>
                            {userDownloads}
                          </span>
                        </div>
                      </td>

                      {/* Bookmarks */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, fontSize: '0.8rem' }}>
                          <Bookmark size={14} color={bookmarkCount > 0 ? '#f59e0b' : 'var(--text-light)'} />
                          <span style={{ color: bookmarkCount > 0 ? 'var(--text-dark)' : 'var(--text-light)' }}>
                            {bookmarkCount}
                          </span>
                        </div>
                      </td>

                      {/* Reviews */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, fontSize: '0.8rem' }}>
                          <Star size={14} color={(reviewCountByUser[u.id] || 0) > 0 ? '#f59e0b' : 'var(--text-light)'} />
                          <span style={{ color: (reviewCountByUser[u.id] || 0) > 0 ? 'var(--text-dark)' : 'var(--text-light)' }}>
                            {reviewCountByUser[u.id] || 0}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td>
                        {u.role === 'admin' ? (
                          <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>
                            <ShieldCheck size={11} /> Admin
                          </span>
                        ) : (reading || hasGameActivity || userDownloads > 0) ? (
                          <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>
                            ● Active
                          </span>
                        ) : (
                          <span className="badge" style={{ background: '#f1f5f9', color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                            ● Registered
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="btn btn-primary"
                          style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem', borderRadius: '6px' }}
                          onClick={() => {
                            if (setSelectedUser) setSelectedUser(u);
                            navigate(`/users/${u.id}`);
                          }}
                        >
                          View Details
                          <ChevronRight size={13} />
                        </button>
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
