import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  BookOpen, 
  Gamepad2, 
  Download, 
  Bookmark, 
  Award, 
  Calendar, 
  Mail, 
  User, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  ExternalLink, 
  Layers, 
  HelpCircle, 
  Type, 
  Puzzle, 
  Sparkles,
  Smartphone,
  Check,
  Star,
  MessageSquare
} from 'lucide-react';
import { sanitizeImageUrl } from '../utils/imageHelper';
import { db, doc, onSnapshot, collection } from '../firebase';

export default function UserDetailsPage({ selectedUser, usersList = [], books = [], reviews = [] }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [userData, setUserData] = useState(selectedUser || null);
  const [userDownloads, setUserDownloads] = useState([]);
  const [userLibrary, setUserLibrary] = useState([]);
  const [loading, setLoading] = useState(!selectedUser);

  // Sync user document from Firestore
  useEffect(() => {
    const targetId = id || selectedUser?.id;
    if (!targetId) return;

    // Check if passed in usersList first
    const foundInList = usersList.find(u => u.id === targetId || u.uid === targetId);
    if (foundInList) {
      setUserData(foundInList);
      setLoading(false);
    }

    // Real-time listener for user document
    const unsubUser = onSnapshot(doc(db, 'users', targetId), (snap) => {
      if (snap.exists()) {
        setUserData({ id: snap.id, ...snap.data() });
      }
      setLoading(false);
    }, (err) => {
      console.warn('Error fetching user document:', err);
      setLoading(false);
    });

    // Real-time listener for user's downloads subcollection
    const unsubDownloads = onSnapshot(collection(db, 'users', targetId, 'downloads'), (snap) => {
      const dls = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setUserDownloads(dls);
    }, (err) => {
      console.warn('Error fetching user downloads:', err);
    });

    // Real-time listener for user's library subcollection
    const unsubLibrary = onSnapshot(collection(db, 'users', targetId, 'library'), (snap) => {
      const libs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setUserLibrary(libs);
    }, (err) => {
      console.warn('Error fetching user library:', err);
    });

    return () => {
      unsubUser();
      unsubDownloads();
      unsubLibrary();
    };
  }, [id, selectedUser, usersList]);

  const user = userData || selectedUser || {};

  // Formatter for timestamps & dates
  const formatDateTime = (val) => {
    if (!val) return '—';
    try {
      if (val.toDate && typeof val.toDate === 'function') {
        return val.toDate().toLocaleString('en-IN', { 
          day: 'numeric', 
          month: 'short', 
          year: 'numeric', 
          hour: '2-digit', 
          minute: '2-digit' 
        });
      }
      if (val.seconds) {
        return new Date(val.seconds * 1000).toLocaleString('en-IN', { 
          day: 'numeric', 
          month: 'short', 
          year: 'numeric', 
          hour: '2-digit', 
          minute: '2-digit' 
        });
      }
      const d = new Date(val);
      if (!isNaN(d.getTime())) {
        return d.toLocaleString('en-IN', { 
          day: 'numeric', 
          month: 'short', 
          year: 'numeric', 
          hour: '2-digit', 
          minute: '2-digit' 
        });
      }
    } catch (e) {}
    return '—';
  };

  const getInitials = (u) => {
    const name = u.displayName || u.name || u.email || 'U';
    return name.slice(0, 2).toUpperCase();
  };

  const getAvatarColor = (userId = '') => {
    const colors = [
      'linear-gradient(135deg, #6366f1, #8b5cf6)',
      'linear-gradient(135deg, #ec4899, #f43f5e)',
      'linear-gradient(135deg, #f59e0b, #d97706)',
      'linear-gradient(135deg, #10b981, #059669)',
      'linear-gradient(135deg, #3b82f6, #2563eb)',
      'linear-gradient(135deg, #ff5e15, #ea4e05)'
    ];
    let hash = 0;
    for (let i = 0; i < userId.length; i++) hash += userId.charCodeAt(i);
    return colors[Math.abs(hash) % colors.length];
  };

  const displayName = user.displayName || user.name || (user.email ? user.email.split('@')[0] : 'User');
  const avatarSrc = sanitizeImageUrl(user.photoURL || user.avatarUrl);
  const reading = user.lastActiveReading;
  const gameLevels = user.gameLevels || {};
  const gameProgress = user.gameProgress || {};
  const bookmarks = Array.isArray(user.bookmarks) ? user.bookmarks : [];
  const favoriteCategories = Array.isArray(user.favoriteCategories) ? user.favoriteCategories : [];

  // Extract unlocked books via reward points
  const unlockedBooksList = useMemo(() => {
    if (!user.unlockedBooks || typeof user.unlockedBooks !== 'object') return [];
    return Object.entries(user.unlockedBooks).map(([key, val]) => ({
      bookId: key,
      ...val
    }));
  }, [user.unlockedBooks]);

  // Match reading book with books collection
  const matchedBook = books.find(b => b.id === reading?.bookId);

  // Reviews written by this user
  const userReviews = reviews.filter(r => r.userId === (id || user.id || user.uid) || (r.userEmail && r.userEmail === user.email));

  // Calculate total game points
  const totalGamePoints = Object.values(gameProgress).reduce((acc, curr) => acc + (Number(curr?.pointsEarned) || 0), 0);

  // Generate dynamic chronological activity stream
  const activityItems = [];

  // Library reading events
  userLibrary.forEach(lib => {
    activityItems.push({
      type: 'library',
      title: `${lib.status === 'completed' ? 'Completed Reading' : 'Reading'} "${lib.title || 'Book'}"`,
      description: lib.currentChapterTitle ? `Section: ${lib.currentChapterTitle}` : `${lib.progressPercent || 0}% progress tracked in library`,
      time: lib.lastReadAt || lib.updatedAt || lib.startedAt,
      icon: <BookOpen size={16} color="#2563eb" />,
      badge: `${lib.progressPercent || 0}% Progress`
    });
  });

  // Unlocked books via points
  unlockedBooksList.forEach(ub => {
    activityItems.push({
      type: 'unlocked',
      title: `Unlocked "${ub.bookTitle || 'Book'}" with Points`,
      description: `Spent ${Number(ub.pointsSpent || 0).toLocaleString()} reward points to unlock book in store`,
      time: ub.unlockedAt,
      icon: <Award size={16} color="var(--primary)" />,
      badge: `-${Number(ub.pointsSpent || 0).toLocaleString()} pts`
    });
  });

  if (reading && reading.lastReadAt) {
    activityItems.push({
      type: 'reading',
      title: `Reading "${reading.title || 'Book'}"`,
      description: reading.currentChapterTitle ? `At section: ${reading.currentChapterTitle}` : `${reading.progressPercent || 0}% completed`,
      time: reading.lastReadAt,
      icon: <BookOpen size={16} color="var(--primary)" />,
      badge: `${reading.progressPercent || 0}% Progress`
    });
  }

  if (gameProgress.quiz?.lastPlayedAt) {
    activityItems.push({
      type: 'quiz',
      title: 'Played Book Quiz',
      description: `Scored ${gameProgress.quiz.pointsEarned || 0} pts (Level ${gameLevels.quiz || 1})`,
      time: gameProgress.quiz.lastPlayedAt,
      icon: <HelpCircle size={16} color="#d97706" />,
      badge: `+${gameProgress.quiz.pointsEarned || 0} pts`
    });
  }

  if (gameProgress.wordsearch?.lastPlayedAt) {
    activityItems.push({
      type: 'wordsearch',
      title: 'Played Word Search Game',
      description: `Scored ${gameProgress.wordsearch.pointsEarned || 0} pts (Level ${gameLevels.wordsearch || 1})`,
      time: gameProgress.wordsearch.lastPlayedAt,
      icon: <Type size={16} color="#6366f1" />,
      badge: `+${gameProgress.wordsearch.pointsEarned || 0} pts`
    });
  }

  if (gameProgress.memory?.lastPlayedAt) {
    activityItems.push({
      type: 'memory',
      title: 'Played Memory Game',
      description: `Scored ${gameProgress.memory.pointsEarned || 0} pts (Difficulty: ${gameProgress.memory.lastLevel || 'Normal'})`,
      time: gameProgress.memory.lastPlayedAt,
      icon: <Sparkles size={16} color="#10b981" />,
      badge: `+${gameProgress.memory.pointsEarned || 0} pts`
    });
  }

  if (gameProgress.puzzle?.lastPlayedAt) {
    activityItems.push({
      type: 'puzzle',
      title: 'Played Puzzle Game',
      description: `Scored ${gameProgress.puzzle.pointsEarned || 0} pts (Level ${gameLevels.puzzle || 1})`,
      time: gameProgress.puzzle.lastPlayedAt,
      icon: <Puzzle size={16} color="#ec4899" />,
      badge: `+${gameProgress.puzzle.pointsEarned || 0} pts`
    });
  }

  userReviews.forEach(rev => {
    activityItems.push({
      type: 'review',
      title: `Reviewed "${rev.bookTitle || 'Book'}"`,
      description: `Rated ${rev.rating || 5}★: "${rev.reviewContent || ''}"`,
      time: rev.createdAt,
      icon: <Star size={16} color="#f59e0b" fill="#f59e0b" />,
      badge: `${rev.rating || 5}★ Review (${rev.status || 'approved'})`
    });
  });

  bookmarks.forEach(bm => {
    activityItems.push({
      type: 'bookmark',
      title: 'Bookmarked Chapter Snippet',
      description: bm.preview ? `"${bm.preview}"` : `Page ${bm.page || 1}`,
      time: bm.createdAt,
      icon: <Bookmark size={16} color="#f59e0b" />,
      badge: `Page ${bm.page || 1}`
    });
  });

  userDownloads.forEach(dl => {
    activityItems.push({
      type: 'download',
      title: `Downloaded "${dl.title || 'Book'}"`,
      description: `${dl.author || 'Author'} • ${dl.sizeMB ? `${dl.sizeMB} MB` : 'Complete'}`,
      time: dl.downloadedAt,
      icon: <Download size={16} color="var(--primary)" />,
      badge: 'Download Completed'
    });
  });

  if (user.createdAt) {
    activityItems.push({
      type: 'account',
      title: 'Account Registered',
      description: `Registered with ${user.email || 'Email'}`,
      time: user.createdAt,
      icon: <User size={16} color="#64748b" />,
      badge: 'Welcome'
    });
  }

  // Sort activities newest first
  activityItems.sort((a, b) => {
    const getTime = (t) => {
      if (!t) return 0;
      if (t.seconds) return t.seconds * 1000;
      if (t.toDate && typeof t.toDate === 'function') return t.toDate().getTime();
      const d = new Date(t);
      return isNaN(d.getTime()) ? 0 : d.getTime();
    };
    return getTime(b.time) - getTime(a.time);
  });

  return (
    <div>
      {/* Back button & top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <button
          className="btn btn-outline"
          onClick={() => navigate('/users')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}
        >
          <ArrowLeft size={16} /> Back to Users List
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>User ID:</span>
          <code style={{ background: '#f1f5f9', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', color: 'var(--text-dark)' }}>
            {id || user.id}
          </code>
        </div>
      </div>

      {/* Main Grid: User Profile Hero & KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '1.75rem' }}>
        {/* User Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.25rem', marginBottom: '1.25rem' }}>
              {avatarSrc ? (
                <img
                  src={avatarSrc}
                  alt={displayName}
                  style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              ) : (
                <div
                  style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    background: getAvatarColor(user.id || id),
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '1.8rem',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                  }}
                >
                  {getInitials(user)}
                </div>
              )}

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                  <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-dark)', margin: 0 }}>{displayName}</h2>
                  <span
                    className={user.role === 'admin' ? 'badge badge-info' : 'badge badge-success'}
                    style={{ fontSize: '0.7rem', textTransform: 'capitalize' }}
                  >
                    {user.role === 'admin' ? <ShieldCheck size={12} /> : null}
                    {user.role || 'Active User'}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                  <Mail size={14} />
                  <span>{user.email || 'No email registered'}</span>
                </div>
                {user.onboardingCompleted !== undefined && (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: user.onboardingCompleted ? '#059669' : '#d97706', background: user.onboardingCompleted ? '#ecfdf5' : '#fffbeb', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 600 }}>
                    {user.onboardingCompleted ? <Check size={12} /> : null}
                    {user.onboardingCompleted ? 'Onboarding Completed' : 'Onboarding Pending'}
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Device & Auth Diagnostics */}
            <div style={{ marginTop: '0.85rem', paddingTop: '0.85rem', borderTop: '1px solid #f1f5f9', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.5rem', fontSize: '0.75rem' }}>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem', fontWeight: 700 }}>DEVICE ID</span>
                <code style={{ fontSize: '0.7rem', background: '#f8fafc', padding: '0.1rem 0.35rem', borderRadius: '4px', border: '1px solid #e2e8f0', display: 'inline-block', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.currentDeviceId || 'Not registered'}
                </code>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem', fontWeight: 700 }}>PUSH NOTIFICATIONS</span>
                <span style={{ fontWeight: 700, color: user.pushToken ? '#059669' : '#94a3b8' }}>
                  {user.pushToken ? '● FCM Active' : '○ Disabled'}
                </span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem', fontWeight: 700 }}>AUTH PROVIDER</span>
                <span style={{ fontWeight: 700, color: 'var(--text-dark)', textTransform: 'capitalize' }}>
                  {Array.isArray(user.providerIds) && user.providerIds.length > 0 ? user.providerIds.join(', ') : 'Password / Direct'}
                </span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem', fontWeight: 700 }}>LAST LOGIN</span>
                <span style={{ fontWeight: 600, color: 'var(--text-dark)' }}>
                  {formatDateTime(user.lastLoginAt) || '—'}
                </span>
              </div>
            </div>

            {/* Favorite categories */}
            {favoriteCategories.length > 0 && (
              <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                  FAVORITE GENRES
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {favoriteCategories.map((cat, i) => (
                    <span key={i} style={{ background: '#f1f5f9', color: 'var(--text-dark)', padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600 }}>
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <div>Joined: {formatDateTime(user.createdAt)}</div>
            <div>Updated: {formatDateTime(user.updatedAt)}</div>
          </div>
        </div>

        {/* Dynamic Metric Counter Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.85rem' }}>
          <div className="card" style={{ padding: '1.15rem', margin: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>POINTS</span>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                <Award size={16} />
              </div>
            </div>
            <div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary)' }}>
                {(Number(user.points) || 0).toLocaleString()}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                {totalGamePoints > 0 ? `${totalGamePoints.toLocaleString()} from games` : 'Earned pts'}
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: '1.15rem', margin: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>LIBRARY</span>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4338ca' }}>
                <BookOpen size={16} />
              </div>
            </div>
            <div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#4338ca' }}>
                {userLibrary.length}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Active reading shelf</div>
            </div>
          </div>

          <div className="card" style={{ padding: '1.15rem', margin: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>UNLOCKED</span>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b45309' }}>
                <Sparkles size={16} />
              </div>
            </div>
            <div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#b45309' }}>
                {unlockedBooksList.length}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Unlocked via pts</div>
            </div>
          </div>

          <div className="card" style={{ padding: '1.15rem', margin: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>DOWNLOADS</span>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
                <Download size={16} />
              </div>
            </div>
            <div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#2563eb' }}>
                {userDownloads.length}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Offline books</div>
            </div>
          </div>

          <div className="card" style={{ padding: '1.15rem', margin: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>BOOKMARKS</span>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
                <Bookmark size={16} />
              </div>
            </div>
            <div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f59e0b' }}>
                {bookmarks.length}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Saved snippets</div>
            </div>
          </div>

          <div className="card" style={{ padding: '1.15rem', margin: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>GAMES</span>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: '#faf5ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b5cf6' }}>
                <Gamepad2 size={16} />
              </div>
            </div>
            <div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#8b5cf6' }}>
                {Object.keys(gameProgress).length || Object.keys(gameLevels).length || 0}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Modes played</div>
            </div>
          </div>

          <div className="card" style={{ padding: '1.15rem', margin: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>REVIEWS</span>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                <MessageSquare size={16} />
              </div>
            </div>
            <div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#10b981' }}>
                {userReviews.length}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Ratings submitted</div>
            </div>
          </div>
        </div>
      </div>

      {/* Book Read Status Card (Dynamic Highlight) */}
      <div className="card" style={{ marginBottom: '1.75rem', background: 'linear-gradient(to right, #ffffff, #fafaf9)' }}>
        <div className="card-header" style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: '8px', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
              <BookOpen size={20} />
            </div>
            <div>
              <h3 className="card-title" style={{ margin: 0 }}>Active Book Reading Status</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>Current reading session and progress tracked from mobile app</p>
            </div>
          </div>
          {reading?.status && (
            <span className="badge badge-success" style={{ textTransform: 'uppercase', fontSize: '0.75rem' }}>
              ● {reading.status}
            </span>
          )}
        </div>

        {reading && reading.bookId ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem', alignItems: 'center' }}>
            {/* Book Details */}
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              {matchedBook?.cover ? (
                <img
                  src={matchedBook.cover}
                  alt={reading.title}
                  style={{ width: '70px', height: '95px', objectFit: 'cover', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}
                />
              ) : (
                <div style={{ width: '70px', height: '95px', borderRadius: '8px', background: 'linear-gradient(135deg, #1e293b, #0f172a)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <BookOpen size={28} color="var(--primary)" />
                </div>
              )}

              <div>
                <span className="badge badge-warning" style={{ fontSize: '0.7rem', marginBottom: '0.35rem' }}>
                  {matchedBook?.category || 'Book in Progress'}
                </span>
                <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '0.2rem' }}>
                  {reading.title || matchedBook?.title || 'Atomic Habits'}
                </h4>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Author: {matchedBook?.author || 'James Clear'}
                </div>
                {reading.currentChapterTitle && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-dark)', fontWeight: 600, background: '#f8fafc', padding: '0.3rem 0.6rem', borderRadius: '4px', border: '1px solid #e2e8f0', maxWidth: '350px' }}>
                    Section: {reading.currentChapterTitle}
                  </div>
                )}
              </div>
            </div>

            {/* Reading Progress Visual */}
            <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-dark)' }}>Reading Completion</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>
                  {reading.progressPercent || 0}%
                </span>
              </div>

              {/* Progress Bar */}
              <div style={{ width: '100%', height: '10px', background: '#e2e8f0', borderRadius: '5px', overflow: 'hidden', marginBottom: '0.85rem' }}>
                <div
                  style={{
                    width: `${Math.min(100, Math.max(3, reading.progressPercent || 0))}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, var(--primary), #ff8a4c)',
                    borderRadius: '5px',
                    transition: 'width 0.5s ease'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <span>Item ID: {reading.lastReadItemId || 'header-page_1'}</span>
                <span>Last Read: {formatDateTime(reading.lastReadAt)}</span>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
            <BookOpen size={36} color="var(--text-light)" style={{ margin: '0 auto 0.75rem', display: 'block' }} />
            <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>No Active Book in Reading Progress</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>User has not opened or started reading any book yet.</div>
          </div>
        )}
      </div>

      {/* User Reading Library (Live Subcollection: users/{id}/library) */}
      <div className="card" style={{ marginBottom: '1.75rem' }}>
        <div className="card-header" style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: '8px', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4338ca' }}>
              <BookOpen size={20} />
            </div>
            <div>
              <h3 className="card-title" style={{ margin: 0 }}>Reading Library & Book Progress Shelf</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                Books in user's library with chapter completion progress synced from Firestore subcollection
              </p>
            </div>
          </div>
          <span className="badge badge-info" style={{ fontSize: '0.75rem' }}>
            {userLibrary.length} Library Books
          </span>
        </div>

        {userLibrary.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
            <BookOpen size={32} color="var(--text-light)" style={{ margin: '0 auto 0.5rem', display: 'block' }} />
            <div style={{ fontWeight: 600 }}>No books added to library yet</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>Books opened or added by this reader will appear here.</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {userLibrary.map(lib => (
              <div
                key={lib.id || lib.bookId}
                style={{
                  padding: '1rem',
                  background: '#f8fafc',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    {lib.cover ? (
                      <img src={lib.cover} alt={lib.title} style={{ width: '48px', height: '68px', objectFit: 'cover', borderRadius: '6px', flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: '48px', height: '68px', borderRadius: '6px', background: '#4338ca', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <BookOpen size={20} />
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-dark)', margin: '0 0 0.2rem 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {lib.title || 'Untitled Book'}
                        </h4>
                        <span className={lib.status === 'completed' ? 'badge badge-success' : 'badge badge-info'} style={{ fontSize: '0.65rem', textTransform: 'capitalize' }}>
                          ● {lib.status || 'reading'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {lib.author || 'Author'} {lib.category ? `• ${lib.category}` : ''}
                      </div>
                      {lib.currentChapterTitle && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dark)', background: '#fff', padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid #f1f5f9', marginTop: '0.4rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          Chapter: {lib.currentChapterTitle}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div style={{ marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Progress:</span>
                      <span style={{ fontWeight: 800, color: '#4338ca' }}>{lib.progressPercent || 0}%</span>
                    </div>
                    <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${Math.min(100, Math.max(3, lib.progressPercent || 0))}%`, height: '100%', background: '#4338ca', borderRadius: '3px' }} />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-light)', borderTop: '1px solid #e2e8f0', paddingTop: '0.5rem' }}>
                  <span>Ch. {lib.currentChapterIndex || 1} / {lib.totalChapters || '—'}</span>
                  <span>Last read: {formatDateTime(lib.lastReadAt || lib.updatedAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Unlocked Books via Reward Points Card */}
      {unlockedBooksList.length > 0 && (
        <div className="card" style={{ marginBottom: '1.75rem' }}>
          <div className="card-header" style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div style={{ width: 36, height: 36, borderRadius: '8px', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b45309' }}>
                <Sparkles size={20} />
              </div>
              <div>
                <h3 className="card-title" style={{ margin: 0 }}>Unlocked Books via Reward Points</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                  Books redeemed and unlocked using gamified app points ({unlockedBooksList.length} unlocked)
                </p>
              </div>
            </div>
            <span className="badge badge-warning" style={{ fontSize: '0.75rem' }}>
              Points Store Redemptions
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
            {unlockedBooksList.map(ub => (
              <div
                key={ub.bookId}
                style={{
                  padding: '1rem',
                  background: '#f8fafc',
                  borderRadius: '10px',
                  border: '1px solid #fef3c7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: 36, height: 48, borderRadius: '6px', background: '#fef3c7', color: '#b45309', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <BookOpen size={18} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-dark)' }}>
                      {ub.bookTitle || 'Book'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      ID: {ub.bookId}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#b45309', background: '#fef3c7', padding: '0.2rem 0.5rem', borderRadius: '4px', display: 'inline-block', marginBottom: '0.2rem' }}>
                    -{Number(ub.pointsSpent || 0).toLocaleString()} pts
                  </span>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-light)' }}>
                    {formatDate(ub.unlockedAt)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Interactive Games Played History & Levels */}
      <div className="card" style={{ marginBottom: '1.75rem' }}>
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: '8px', background: '#faf5ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b5cf6' }}>
              <Gamepad2 size={20} />
            </div>
            <div>
              <h3 className="card-title" style={{ margin: 0 }}>Games Played History & Levels</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>Interactive game progress, levels unlocked, and reward points</p>
            </div>
          </div>
          <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--primary)', background: 'var(--primary-light)', padding: '0.35rem 0.75rem', borderRadius: '20px' }}>
            Total Game Points: {totalGamePoints.toLocaleString()} pts
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
          {/* Game 1: Book Quiz */}
          <div style={{ background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.25rem', position: 'relative', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: 32, height: 32, borderRadius: '8px', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b45309' }}>
                  <HelpCircle size={18} />
                </div>
                <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>Book Quiz</div>
              </div>
              <span style={{ background: '#fef3c7', color: '#92400e', fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 800 }}>
                Level {gameLevels.quiz || 1}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Points Earned:</span>
              <span style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--primary)' }}>
                {(gameProgress.quiz?.pointsEarned || 0).toLocaleString()} pts
              </span>
            </div>

            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px solid #e2e8f0', paddingTop: '0.65rem', marginTop: '0.65rem' }}>
              Last Played: {formatDateTime(gameProgress.quiz?.lastPlayedAt)}
            </div>
          </div>

          {/* Game 2: Word Search */}
          <div style={{ background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.25rem', position: 'relative', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: 32, height: 32, borderRadius: '8px', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4338ca' }}>
                  <Type size={18} />
                </div>
                <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>Word Search</div>
              </div>
              <span style={{ background: '#e0e7ff', color: '#3730a3', fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 800 }}>
                Level {gameLevels.wordsearch || 1}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Points Earned:</span>
              <span style={{ fontSize: '1.3rem', fontWeight: 800, color: '#4338ca' }}>
                {(gameProgress.wordsearch?.pointsEarned || 0).toLocaleString()} pts
              </span>
            </div>

            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px solid #e2e8f0', paddingTop: '0.65rem', marginTop: '0.65rem' }}>
              Last Played: {formatDateTime(gameProgress.wordsearch?.lastPlayedAt)}
            </div>
          </div>

          {/* Game 3: Memory Match */}
          <div style={{ background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.25rem', position: 'relative', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: 32, height: 32, borderRadius: '8px', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#15803d' }}>
                  <Sparkles size={18} />
                </div>
                <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>Memory Game</div>
              </div>
              <span style={{ background: '#dcfce7', color: '#166534', fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 800 }}>
                Level {gameLevels.memory || 1} ({gameProgress.memory?.lastLevel || 'Normal'})
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Points Earned:</span>
              <span style={{ fontSize: '1.3rem', fontWeight: 800, color: '#15803d' }}>
                {(gameProgress.memory?.pointsEarned || 0).toLocaleString()} pts
              </span>
            </div>

            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px solid #e2e8f0', paddingTop: '0.65rem', marginTop: '0.65rem' }}>
              Last Played: {formatDateTime(gameProgress.memory?.lastPlayedAt)}
            </div>
          </div>

          {/* Game 4: Puzzle Game */}
          <div style={{ background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.25rem', position: 'relative', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: 32, height: 32, borderRadius: '8px', background: '#fce7f3', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#be185d' }}>
                  <Puzzle size={18} />
                </div>
                <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>Puzzle Game</div>
              </div>
              <span style={{ background: '#fce7f3', color: '#9d174d', fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 800 }}>
                Level {gameLevels.puzzle || 1}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Points Earned:</span>
              <span style={{ fontSize: '1.3rem', fontWeight: 800, color: '#be185d' }}>
                {(gameProgress.puzzle?.pointsEarned || 0).toLocaleString()} pts
              </span>
            </div>

            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px solid #e2e8f0', paddingTop: '0.65rem', marginTop: '0.65rem' }}>
              Last Played: {formatDateTime(gameProgress.puzzle?.lastPlayedAt)}
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Grid: Bookmarks & Downloads */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem', marginBottom: '1.75rem' }}>
        {/* Bookmarks Section */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Bookmark size={18} color="#f59e0b" />
              <h3 className="card-title" style={{ margin: 0, fontSize: '1.1rem' }}>Saved Bookmarks</h3>
            </div>
            <span className="badge badge-warning" style={{ fontSize: '0.75rem' }}>
              {bookmarks.length} Bookmarks
            </span>
          </div>

          {bookmarks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
              <Bookmark size={28} color="var(--text-light)" style={{ margin: '0 auto 0.5rem', display: 'block' }} />
              <div style={{ fontSize: '0.85rem' }}>No bookmarks saved yet</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {bookmarks.map((bm, i) => (
                <div key={bm.id || i} style={{ padding: '0.85rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-dark)' }}>
                      Page {bm.page || 1} • {bm.chapterId || 'Chapter'}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {formatDateTime(bm.createdAt)}
                    </span>
                  </div>
                  {bm.preview && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', background: '#fff', padding: '0.5rem', borderRadius: '4px', border: '1px solid #f1f5f9' }}>
                      "{bm.preview}"
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* User Downloads Subcollection */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Download size={18} color="var(--primary)" />
              <h3 className="card-title" style={{ margin: 0, fontSize: '1.1rem' }}>Downloaded Books</h3>
            </div>
            <span className="badge badge-success" style={{ fontSize: '0.75rem' }}>
              {userDownloads.length} Books
            </span>
          </div>

          {userDownloads.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
              <Download size={28} color="var(--text-light)" style={{ margin: '0 auto 0.5rem', display: 'block' }} />
              <div style={{ fontSize: '0.85rem' }}>No downloads recorded for this user</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {userDownloads.map((dl, i) => (
                <div key={dl.id || i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {dl.cover ? (
                      <img src={dl.cover} alt={dl.title} style={{ width: '36px', height: '48px', objectFit: 'cover', borderRadius: '4px' }} />
                    ) : (
                      <div style={{ width: '36px', height: '48px', borderRadius: '4px', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <BookOpen size={16} color="var(--primary)" />
                      </div>
                    )}
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-dark)' }}>{dl.title || 'Untitled'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {dl.author || 'Author'} • {dl.category || 'Category'}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span className="badge badge-success" style={{ fontSize: '0.65rem', marginBottom: '0.2rem' }}>
                      {dl.status || 'Completed'}
                    </span>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {dl.sizeMB ? `${dl.sizeMB} MB • ` : ''}{formatDateTime(dl.downloadedAt)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* User Reviews & Ratings Section */}
      <div className="card" style={{ marginBottom: '1.75rem' }}>
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Star size={18} color="#f59e0b" fill="#f59e0b" />
            <h3 className="card-title" style={{ margin: 0, fontSize: '1.15rem' }}>Reader Reviews & Book Feedback</h3>
          </div>
          <span className="badge badge-warning" style={{ fontSize: '0.75rem' }}>
            {userReviews.length} Reviews Submitted
          </span>
        </div>

        {userReviews.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
            <MessageSquare size={28} color="var(--text-light)" style={{ margin: '0 auto 0.5rem', display: 'block' }} />
            <div style={{ fontSize: '0.85rem' }}>No book reviews submitted by this user yet</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
            {userReviews.map((rev) => (
              <div key={rev.id} style={{ padding: '1rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.65rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      {rev.bookCover ? (
                        <img src={rev.bookCover} alt={rev.bookTitle} style={{ width: '32px', height: '44px', objectFit: 'cover', borderRadius: '4px' }} />
                      ) : (
                        <div style={{ width: '32px', height: '44px', borderRadius: '4px', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <BookOpen size={16} color="var(--primary)" />
                        </div>
                      )}
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-dark)' }}>{rev.bookTitle || 'Book'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{rev.bookAuthor || 'Author'}</div>
                      </div>
                    </div>

                    <span className={rev.status === 'approved' ? 'badge badge-success' : rev.status === 'pending' ? 'badge badge-warning' : 'badge badge-danger'} style={{ fontSize: '0.65rem', textTransform: 'capitalize' }}>
                      ● {rev.status || 'approved'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', gap: '2px' }}>
                      {[1, 2, 3, 4, 5].map(st => (
                        <Star key={st} size={13} fill={st <= (rev.rating || 5) ? '#f59e0b' : 'none'} color={st <= (rev.rating || 5) ? '#f59e0b' : '#cbd5e1'} />
                      ))}
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#f59e0b' }}>{rev.rating || 5}.0</span>
                  </div>

                  <div style={{ fontSize: '0.85rem', color: 'var(--text-dark)', fontStyle: 'italic', background: '#fff', padding: '0.65rem', borderRadius: '6px', border: '1px solid #f1f5f9', lineHeight: 1.4 }}>
                    "{rev.reviewContent || 'No feedback'}"
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid #e2e8f0', fontSize: '0.7rem', color: 'var(--text-light)' }}>
                  <span>{formatDateTime(rev.createdAt)}</span>
                  <span>❤️ {rev.likes || 0} likes</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Unified User Activity Stream */}
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock size={18} color="var(--primary)" />
            <h3 className="card-title" style={{ margin: 0, fontSize: '1.15rem' }}>Complete Activity Stream</h3>
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{activityItems.length} Events recorded</span>
        </div>

        {activityItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
            No recent activity recorded for this user
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {activityItems.map((act, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.85rem 1rem',
                  background: '#f8fafc',
                  borderRadius: '8px',
                  border: '1px solid #f1f5f9'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <div style={{ width: 34, height: 34, borderRadius: '8px', background: '#fff', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {act.icon}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-dark)' }}>
                      {act.title}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {act.description}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--primary)', background: 'var(--primary-light)', padding: '0.2rem 0.5rem', borderRadius: '4px', display: 'inline-block', marginBottom: '0.2rem' }}>
                    {act.badge}
                  </span>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-light)' }}>
                    {formatDateTime(act.time)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
