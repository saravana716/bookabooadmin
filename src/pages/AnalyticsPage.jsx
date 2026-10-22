import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart3, 
  BookOpen, 
  Award, 
  Download, 
  Users, 
  Gamepad2, 
  TrendingUp, 
  Sparkles, 
  HelpCircle, 
  Type, 
  Puzzle,
  ChevronRight
} from 'lucide-react';

export default function AnalyticsPage({ books = [], usersList = [], downloads = [] }) {
  const navigate = useNavigate();

  // Metrics computation
  const stats = useMemo(() => {
    const totalReads = books.reduce((acc, b) => acc + (Number(b.reads) || 0), 0);
    const totalDownloads = downloads.length;
    const totalUsers = usersList.length;
    const activeReaders = usersList.filter(u => u.lastActiveReading?.bookId);
    
    // Average reading progress among active readers
    const totalProgress = activeReaders.reduce((acc, u) => acc + (Number(u.lastActiveReading?.progressPercent) || 0), 0);
    const avgProgress = activeReaders.length > 0 ? Math.round(totalProgress / activeReaders.length) : 0;

    // Total reward points
    const totalPoints = usersList.reduce((acc, u) => acc + (Number(u.points) || 0), 0);

    // Gamification breakdown
    let quizPoints = 0;
    let wordPoints = 0;
    let memoryPoints = 0;
    let puzzlePoints = 0;

    usersList.forEach(u => {
      const gp = u.gameProgress || {};
      quizPoints += Number(gp.quiz?.pointsEarned) || 0;
      wordPoints += Number(gp.wordsearch?.pointsEarned) || 0;
      memoryPoints += Number(gp.memory?.pointsEarned) || 0;
      puzzlePoints += Number(gp.puzzle?.pointsEarned) || 0;
    });

    // Category reads breakdown
    const categoryStats = {};
    books.forEach(b => {
      const cat = b.category || 'General';
      categoryStats[cat] = (categoryStats[cat] || 0) + (Number(b.reads) || 0);
    });

    // User Leaderboard
    const leaderboard = [...usersList]
      .sort((a, b) => (Number(b.points) || 0) - (Number(a.points) || 0))
      .slice(0, 5);

    return {
      totalReads,
      totalDownloads,
      totalUsers,
      activeReadersCount: activeReaders.length,
      avgProgress,
      totalPoints,
      quizPoints,
      wordPoints,
      memoryPoints,
      puzzlePoints,
      categoryStats,
      leaderboard
    };
  }, [books, usersList, downloads]);

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-dark)' }}>Platform Analytics & Insights</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Real-time telemetry on book reads, user progression, offline downloads, and gamification
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1.25rem', marginBottom: '1.75rem' }}>
        <div className="card" style={{ padding: '1.25rem', marginBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>TOTAL BOOK READS</span>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
              <BookOpen size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)' }}>{stats.totalReads.toLocaleString()}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Cumulative platform reads</div>
        </div>

        <div className="card" style={{ padding: '1.25rem', marginBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>AVG READER PROGRESS</span>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
              <TrendingUp size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10b981' }}>{stats.avgProgress}%</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Across {stats.activeReadersCount} active readers</div>
        </div>

        <div className="card" style={{ padding: '1.25rem', marginBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>OFFLINE DOWNLOADS</span>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
              <Download size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#2563eb' }}>{stats.totalDownloads}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Books saved to device</div>
        </div>

        <div className="card" style={{ padding: '1.25rem', marginBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>TOTAL REWARD POINTS</span>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: '#faf5ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b5cf6' }}>
              <Award size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#8b5cf6' }}>{stats.totalPoints.toLocaleString()}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Earned by {stats.totalUsers} users</div>
        </div>
      </div>

      {/* Grid: Gamification Breakdown & Leaderboard */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem', marginBottom: '1.75rem' }}>
        {/* Game Points Breakdown */}
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-header">
            <div>
              <h3 className="card-title">Gamification Engagement</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>Points distribution across all 4 interactive game modes</p>
            </div>
            <Gamepad2 size={20} color="#8b5cf6" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
            {/* Quiz */}
            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <HelpCircle size={16} color="#d97706" />
                  <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Book Quiz</span>
                </div>
                <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#d97706' }}>
                  {stats.quizPoints.toLocaleString()} pts
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Multiple choice questions auto-generated from books
              </div>
            </div>

            {/* Word Search */}
            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Type size={16} color="#4338ca" />
                  <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Word Search & Scramble</span>
                </div>
                <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#4338ca' }}>
                  {stats.wordPoints.toLocaleString()} pts
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Vocabulary building and clue puzzles
              </div>
            </div>

            {/* Memory Game */}
            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Sparkles size={16} color="#15803d" />
                  <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Memory Match</span>
                </div>
                <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#15803d' }}>
                  {stats.memoryPoints.toLocaleString()} pts
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Visual matching and cognitive recall
              </div>
            </div>

            {/* Puzzle */}
            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Puzzle size={16} color="#be185d" />
                  <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Book Cover Puzzle</span>
                </div>
                <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#be185d' }}>
                  {stats.puzzlePoints.toLocaleString()} pts
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Jigsaw puzzle mechanics for book artworks
              </div>
            </div>
          </div>
        </div>

        {/* User Leaderboard */}
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-header">
            <div>
              <h3 className="card-title">Top Reader Leaderboard</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>Most active users by points and achievements</p>
            </div>
            <button className="btn btn-outline" style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }} onClick={() => navigate('/users')}>
              View All
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {stats.leaderboard.map((u, i) => {
              const uName = u.displayName || u.name || (u.email ? u.email.split('@')[0] : 'User');
              const reading = u.lastActiveReading;

              return (
                <div
                  key={u.id || i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    background: i === 0 ? 'var(--primary-light)' : '#f8fafc',
                    borderRadius: '8px',
                    border: i === 0 ? '1px solid rgba(255, 94, 21, 0.25)' : '1px solid #f1f5f9',
                    cursor: 'pointer'
                  }}
                  onClick={() => navigate(`/users/${u.id}`)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: i === 0 ? 'var(--primary)' : i === 1 ? '#94a3b8' : i === 2 ? '#b45309' : '#e2e8f0',
                        color: i < 3 ? '#fff' : 'var(--text-dark)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '0.75rem'
                      }}
                    >
                      {i + 1}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-dark)' }}>
                        {uName}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {reading?.title ? `Reading: ${reading.title} (${reading.progressPercent || 0}%)` : u.email}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--primary)' }}>
                      {(Number(u.points) || 0).toLocaleString()} pts
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-light)' }}>
                      Level {u.gameLevels?.quiz || 1}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Category Reads Distribution */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Category Reads Breakdown</h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Distribution by genre</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          {Object.entries(stats.categoryStats).map(([cat, count], i) => (
            <div key={i} style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                {cat}
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-dark)', margin: '0.2rem 0' }}>
                {count.toLocaleString()} reads
              </div>
              <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${Math.min(100, (count / (stats.totalReads || 1)) * 100)}%`,
                    height: '100%',
                    background: 'var(--primary)',
                    borderRadius: '3px'
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
