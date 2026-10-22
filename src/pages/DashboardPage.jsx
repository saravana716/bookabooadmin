import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  Users, 
  Download, 
  Award, 
  Gamepad2, 
  TrendingUp, 
  Clock, 
  Bookmark, 
  ChevronRight,
  Sparkles,
  Star,
  MessageSquare,
  Library
} from 'lucide-react';

export default function DashboardPage({ books = [], usersList = [], downloads = [], reviews = [], communityGroups = [], libraryProgress = [] }) {
  const navigate = useNavigate();

  // Metrics
  const stats = useMemo(() => {
    const totalBooks = books.length;
    const totalUsers = usersList.length;
    const totalDownloads = downloads.length;
    const totalPoints = usersList.reduce((acc, u) => acc + (Number(u.points) || 0), 0);
    const activeReaders = usersList.filter(u => u.lastActiveReading?.bookId).length;
    const gamersCount = usersList.filter(u => u.gameProgress || u.gameLevels).length;
    const totalGroups = communityGroups.length;
    const pendingGroups = communityGroups.filter(g => (g.status || '').toUpperCase() === 'PENDING').length;
    const totalLibraryReads = libraryProgress.length;

    return { totalBooks, totalUsers, totalDownloads, totalPoints, activeReaders, gamersCount, totalGroups, pendingGroups, totalLibraryReads };
  }, [books, usersList, downloads, communityGroups, libraryProgress]);

  // Top books sorted by reads / popularity
  const topBooks = useMemo(() => {
    return [...books]
      .sort((a, b) => (Number(b.reads) || 0) - (Number(a.reads) || 0))
      .slice(0, 5);
  }, [books]);

  // Unified recent live user events
  const liveEvents = useMemo(() => {
    const events = [];

    usersList.forEach(u => {
      const uName = u.displayName || u.name || (u.email ? u.email.split('@')[0] : 'User');

      if (u.lastActiveReading && u.lastActiveReading.bookId) {
        events.push({
          type: 'reading',
          user: uName,
          userId: u.id,
          text: `Reading "${u.lastActiveReading.title || 'Book'}" (${u.lastActiveReading.progressPercent || 0}%)`,
          time: u.lastActiveReading.lastReadAt,
          icon: <BookOpen size={14} color="var(--primary)" />,
          color: 'var(--primary)'
        });
      }

      if (u.gameProgress?.quiz?.lastPlayedAt) {
        events.push({
          type: 'game',
          user: uName,
          userId: u.id,
          text: `Played Book Quiz (+${u.gameProgress.quiz.pointsEarned || 0} pts)`,
          time: u.gameProgress.quiz.lastPlayedAt,
          icon: <Gamepad2 size={14} color="#8b5cf6" />,
          color: '#8b5cf6'
        });
      }

      if (u.gameProgress?.wordsearch?.lastPlayedAt) {
        events.push({
          type: 'game',
          user: uName,
          userId: u.id,
          text: `Completed Word Search (+${u.gameProgress.wordsearch.pointsEarned || 0} pts)`,
          time: u.gameProgress.wordsearch.lastPlayedAt,
          icon: <Sparkles size={14} color="#6366f1" />,
          color: '#6366f1'
        });
      }

      if (Array.isArray(u.bookmarks)) {
        u.bookmarks.forEach(bm => {
          events.push({
            type: 'bookmark',
            user: uName,
            userId: u.id,
            text: `Bookmarked snippet on Page ${bm.page || 1}`,
            time: bm.createdAt,
            icon: <Bookmark size={14} color="#f59e0b" />,
            color: '#f59e0b'
          });
        });
      }
    });

    downloads.forEach(d => {
      const u = usersList.find(x => x.id === d.userId || x.uid === d.userId);
      const uName = u?.displayName || u?.name || 'User';
      events.push({
        type: 'download',
        user: uName,
        userId: d.userId,
        text: `Downloaded "${d.title || 'Book'}" (${d.sizeMB || 24} MB)`,
        time: d.downloadedAt,
        icon: <Download size={14} color="#10b981" />,
        color: '#10b981'
      });
    });

    reviews.forEach(r => {
      events.push({
        type: 'review',
        user: r.userName || 'Reader',
        userId: r.userId,
        text: `Rated "${r.bookTitle || 'Book'}" ${r.rating}★: "${(r.reviewContent || '').slice(0, 40)}..."`,
        time: r.createdAt,
        icon: <Star size={14} color="#f59e0b" />,
        color: '#f59e0b'
      });
    });

    communityGroups.forEach(g => {
      events.push({
        type: 'community',
        user: g.creatorName || 'Club Admin',
        userId: g.creatorId || g.createdBy,
        text: `Created Club "${g.name || 'Group'}" [${(g.status || 'APPROVED').toUpperCase()}]`,
        time: g.createdAt,
        icon: <MessageSquare size={14} color="#0284c7" />,
        color: '#0284c7'
      });
    });

    libraryProgress.forEach(lp => {
      const u = usersList.find(x => x.id === lp.userId || x.uid === lp.userId);
      const uName = u?.displayName || u?.name || 'Reader';
      events.push({
        type: 'library',
        user: uName,
        userId: lp.userId,
        text: `Shelf: "${lp.bookTitle || lp.title || 'Book'}" (${lp.progress || 0}%)`,
        time: lp.lastReadAt || lp.updatedAt || lp.startedAt,
        icon: <Library size={14} color="#059669" />,
        color: '#059669'
      });
    });

    // Sort newest first
    events.sort((a, b) => {
      const getT = (v) => {
        if (!v) return 0;
        if (v.seconds) return v.seconds * 1000;
        const d = new Date(v);
        return isNaN(d.getTime()) ? 0 : d.getTime();
      };
      return getT(b.time) - getT(a.time);
    });

    return events.slice(0, 8);
  }, [usersList, downloads, reviews, communityGroups, libraryProgress]);

  // Last 7 days dynamic reading chart calculation
  const chartData = useMemo(() => {
    const days = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const label = d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' });
      days.push({ label, count: 0, dateStr: d.toDateString() });
    }

    // Distribute event counts into days
    liveEvents.forEach(e => {
      if (!e.time) return;
      let eventDate;
      if (e.time.seconds) eventDate = new Date(e.time.seconds * 1000);
      else eventDate = new Date(e.time);

      if (!isNaN(eventDate.getTime())) {
        const match = days.find(day => day.dateStr === eventDate.toDateString());
        if (match) match.count += 1;
      }
    });

    // Provide baseline heights for beautiful visualization
    const max = Math.max(...days.map(d => d.count), 1);
    return days.map(d => ({
      ...d,
      height: Math.max(30, Math.round((d.count / max) * 160))
    }));
  }, [liveEvents]);

  const formatDate = (val) => {
    if (!val) return 'Just now';
    try {
      if (val.seconds) {
        return new Date(val.seconds * 1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
      }
      const d = new Date(val);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
      }
    } catch (e) {}
    return 'Recently';
  };

  return (
    <div>
      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-dark)' }}>Dashboard Overview</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Real-time analytics across books, user reading status, game progress, and downloads
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1.25rem', marginBottom: '1.75rem' }}>
        {/* Total Books */}
        <div className="card" style={{ padding: '1.25rem', marginBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>TOTAL BOOKS</span>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
              <BookOpen size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-dark)' }}>{stats.totalBooks}</div>
          <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 700 }}>Live Firestore catalog</div>
        </div>

        {/* Total Users */}
        <div className="card" style={{ padding: '1.25rem', marginBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>REGISTERED USERS</span>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
              <Users size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#2563eb' }}>{stats.totalUsers}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{stats.activeReaders} active readers</div>
        </div>

        {/* Total Downloads */}
        <div className="card" style={{ padding: '1.25rem', marginBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>TOTAL DOWNLOADS</span>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
              <Download size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10b981' }}>{stats.totalDownloads}</div>
          <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 700 }}>Saved for offline reading</div>
        </div>

        {/* Reward Points */}
        <div className="card" style={{ padding: '1.25rem', marginBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>USER REWARD POINTS</span>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: '#faf5ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b5cf6' }}>
              <Award size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#8b5cf6' }}>{stats.totalPoints.toLocaleString()}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{stats.gamersCount} gamers active</div>
        </div>

        {/* Community Groups */}
        <div className="card" style={{ padding: '1.25rem', marginBottom: 0, cursor: 'pointer' }} onClick={() => navigate('/community-groups')}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>COMMUNITY CLUBS</span>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7' }}>
              <MessageSquare size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0284c7' }}>{stats.totalGroups}</div>
          <div style={{ fontSize: '0.75rem', color: stats.pendingGroups > 0 ? '#ef4444' : '#10b981', fontWeight: 700 }}>
            {stats.pendingGroups > 0 ? `⚠️ ${stats.pendingGroups} pending approval` : 'All groups approved'}
          </div>
        </div>

        {/* Library Reading Shelves */}
        <div className="card" style={{ padding: '1.25rem', marginBottom: 0, cursor: 'pointer' }} onClick={() => navigate('/analytics')}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>READING SHELVES</span>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
              <Library size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#059669' }}>{stats.totalLibraryReads}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Books tracked on mobile</div>
        </div>
      </div>

      {/* Middle Row: Activity Chart & Top Books */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem', marginBottom: '1.75rem' }}>
        {/* Activity Chart */}
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-header">
            <div>
              <h3 className="card-title">User Activity & Reading Flow</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>Daily reader engagement & game sessions</p>
            </div>
            <span className="badge badge-info" style={{ fontSize: '0.75rem' }}>Past 7 Days</span>
          </div>

          <div style={{ height: '200px', display: 'flex', alignItems: 'flex-end', gap: '14px', padding: '1rem 0' }}>
            {chartData.map((d, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '100%',
                    height: `${d.height}px`,
                    background: 'linear-gradient(to top, var(--primary), #ff9466)',
                    borderRadius: '6px',
                    transition: 'height 0.4s ease'
                  }}
                  title={`${d.label}: ${d.count} actions`}
                />
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                  {d.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Books */}
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-header">
            <h3 className="card-title">Popular Books</h3>
            <button className="btn btn-outline" style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }} onClick={() => navigate('/books')}>
              View All Books
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {topBooks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>No books in database</div>
            ) : (
              topBooks.map((b, i) => (
                <div key={b.id || i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.65rem', borderBottom: i !== topBooks.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontWeight: 800, color: 'var(--text-muted)', width: '18px', fontSize: '0.9rem' }}>{i + 1}</span>
                    {b.cover ? (
                      <img src={b.cover} alt={b.title} style={{ width: '36px', height: '48px', objectFit: 'cover', borderRadius: '4px' }} />
                    ) : (
                      <div style={{ width: '36px', height: '48px', borderRadius: '4px', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <BookOpen size={16} color="var(--primary)" />
                      </div>
                    )}
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-dark)' }}>{b.title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{b.author || 'Author'} • {b.category || 'General'}</div>
                    </div>
                  </div>
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--primary)' }}>
                    {(Number(b.reads) || 0).toLocaleString()} reads
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Live Recent Events Stream */}
      <div className="card" style={{ marginBottom: 0 }}>
        <div className="card-header">
          <div>
            <h3 className="card-title">Live User Engagement Feed</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>Real-time updates from mobile app reading sessions and gameplay</p>
          </div>
          <button className="btn btn-outline" style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }} onClick={() => navigate('/users')}>
            View All Users
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          {liveEvents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', gridColumn: '1 / -1' }}>
              No recent live events recorded
            </div>
          ) : (
            liveEvents.map((evt, i) => (
              <div
                key={i}
                style={{
                  padding: '0.85rem',
                  background: '#f8fafc',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  cursor: 'pointer'
                }}
                onClick={() => evt.userId && navigate(`/users/${evt.userId}`)}
              >
                <div style={{ width: 34, height: 34, borderRadius: 8, background: '#fff', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {evt.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.15rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-dark)' }}>{evt.user}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-light)' }}>{formatDate(evt.time)}</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {evt.text}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
