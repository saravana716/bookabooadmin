import React from 'react';
import { FileText, Download, CheckCircle2, Award, Users, BookOpen, HardDrive, Star, MessageSquare, Library } from 'lucide-react';

export default function ReportsPage({ books = [], usersList = [], downloads = [], reviews = [], communityGroups = [], libraryProgress = [] }) {
  // Helper to trigger CSV file download in browser
  const downloadCSV = (filename, headers, rows) => {
    const escapeCell = (cell) => {
      if (cell === null || cell === undefined) return '""';
      const str = String(cell).replace(/"/g, '""');
      return `"${str}"`;
    };

    const csvContent = [
      headers.map(escapeCell).join(','),
      ...rows.map(row => row.map(escapeCell).join(','))
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const formatDate = (val) => {
    if (!val) return '—';
    try {
      if (val.toDate && typeof val.toDate === 'function') {
        return val.toDate().toISOString().replace('T', ' ').slice(0, 19);
      }
      if (val.seconds) {
        return new Date(val.seconds * 1000).toISOString().replace('T', ' ').slice(0, 19);
      }
      const d = new Date(val);
      if (!isNaN(d.getTime())) {
        return d.toISOString().replace('T', ' ').slice(0, 19);
      }
    } catch (e) {}
    return String(val);
  };

  // Export 1: Users Engagement Report
  const handleExportUsers = () => {
    const headers = [
      'User ID',
      'Display Name',
      'Email',
      'Role',
      'Reward Points',
      'Current Book Reading',
      'Reading Progress %',
      'Quiz Level',
      'WordSearch Level',
      'Memory Level',
      'Puzzle Level',
      'Saved Bookmarks Count',
      'Onboarding Completed',
      'Registered Date'
    ];

    const rows = usersList.map(u => [
      u.id || u.uid || '',
      u.displayName || u.name || '',
      u.email || '',
      u.role || 'user',
      u.points || 0,
      u.lastActiveReading?.title || 'None',
      u.lastActiveReading?.progressPercent || 0,
      u.gameLevels?.quiz || 0,
      u.gameLevels?.wordsearch || 0,
      u.gameLevels?.memory || 0,
      u.gameLevels?.puzzle || 0,
      Array.isArray(u.bookmarks) ? u.bookmarks.length : 0,
      u.onboardingCompleted ? 'Yes' : 'No',
      formatDate(u.createdAt)
    ]);

    downloadCSV('users_engagement_report', headers, rows);
  };

  // Export 2: Books Catalog Report
  const handleExportBooks = () => {
    const headers = [
      'Book ID',
      'Title',
      'Author',
      'Category',
      'Price (INR)',
      'Reads Count',
      'Total Chapters',
      'Created Date'
    ];

    const rows = books.map(b => [
      b.id,
      b.title || '',
      b.author || '',
      b.category || '',
      b.price || 0,
      b.reads || 0,
      Array.isArray(b.chapters) ? b.chapters.length : 0,
      formatDate(b.createdAt)
    ]);

    downloadCSV('books_catalog_report', headers, rows);
  };

  // Export 3: Downloads & Offline Report
  const handleExportDownloads = () => {
    const headers = [
      'Download ID',
      'User ID',
      'Book Title',
      'Author',
      'Category',
      'File Size (MB)',
      'Status',
      'Downloaded Date'
    ];

    const rows = downloads.map(d => [
      d.id,
      d.userId || d.uid || '',
      d.title || '',
      d.author || '',
      d.category || '',
      d.sizeMB || 24,
      d.status || 'completed',
      formatDate(d.downloadedAt)
    ]);

    downloadCSV('downloads_report', headers, rows);
  };

  // Export 4: Gamification & Rewards Report
  const handleExportGamification = () => {
    const headers = [
      'User ID',
      'User Name',
      'Email',
      'Total Reward Points',
      'Quiz Points',
      'WordSearch Points',
      'Memory Points',
      'Puzzle Points',
      'Last Quiz Played',
      'Last Word Played',
      'Last Memory Played',
      'Last Puzzle Played'
    ];

    const rows = usersList.map(u => [
      u.id || u.uid || '',
      u.displayName || u.name || '',
      u.email || '',
      u.points || 0,
      u.gameProgress?.quiz?.pointsEarned || 0,
      u.gameProgress?.wordsearch?.pointsEarned || 0,
      u.gameProgress?.memory?.pointsEarned || 0,
      u.gameProgress?.puzzle?.pointsEarned || 0,
      formatDate(u.gameProgress?.quiz?.lastPlayedAt),
      formatDate(u.gameProgress?.wordsearch?.lastPlayedAt),
      formatDate(u.gameProgress?.memory?.lastPlayedAt),
      formatDate(u.gameProgress?.puzzle?.lastPlayedAt)
    ]);

    downloadCSV('gamification_report', headers, rows);
  };

  // Export 5: Book Reviews & Ratings Report
  const handleExportReviews = () => {
    const headers = [
      'Review ID',
      'Book Title',
      'Book Author',
      'Reviewer Name',
      'Reviewer Email',
      'Rating (Stars)',
      'Review Comments',
      'Moderation Status',
      'Likes',
      'Submitted Date'
    ];

    const rows = reviews.map(r => [
      r.id,
      r.bookTitle || '',
      r.bookAuthor || '',
      r.userName || '',
      r.userEmail || '',
      r.rating || 5,
      r.reviewContent || '',
      r.status || 'pending',
      r.likes || 0,
      formatDate(r.createdAt)
    ]);

    downloadCSV('book_reviews_ratings_report', headers, rows);
  };

  // Export 6: Community Groups & Clubs Report
  const handleExportCommunityGroups = () => {
    const headers = [
      'Group ID',
      'Group Name',
      'Category / Topic',
      'Creator ID',
      'Creator Name',
      'Status',
      'Members Count',
      'Created Date'
    ];

    const rows = communityGroups.map(g => [
      g.id,
      g.name || '',
      g.category || g.bookTitle || '',
      g.creatorId || g.createdBy || '',
      g.creatorName || '',
      g.status || 'APPROVED',
      g.membersCount || (Array.isArray(g.members) ? g.members.length : 1),
      formatDate(g.createdAt)
    ]);

    downloadCSV('community_groups_report', headers, rows);
  };

  // Export 7: User Library & Reading Shelf Report
  const handleExportLibraryProgress = () => {
    const headers = [
      'Shelf Record ID',
      'User ID',
      'User Name',
      'Book ID',
      'Book Title',
      'Author',
      'Category',
      'Progress %',
      'Current Chapter',
      'Started Date',
      'Last Read Date'
    ];

    const rows = libraryProgress.map(lp => {
      const u = usersList.find(x => x.id === lp.userId || x.uid === lp.userId);
      return [
        lp.id,
        lp.userId || '',
        u?.displayName || u?.name || 'Reader',
        lp.bookId || '',
        lp.bookTitle || lp.title || '',
        lp.author || '',
        lp.category || '',
        lp.progress || 0,
        lp.currentChapter || lp.chapter || 1,
        formatDate(lp.startedAt || lp.addedAt),
        formatDate(lp.lastReadAt || lp.updatedAt)
      ];
    });

    downloadCSV('user_library_reading_progress_report', headers, rows);
  };

  const reports = [
    {
      title: 'User Engagement Report',
      description: 'Comprehensive report with user profiles, reading progress, active books, and gamification points.',
      count: `${usersList.length} user records`,
      icon: <Users size={32} color="#2563eb" />,
      color: '#eff6ff',
      action: handleExportUsers
    },
    {
      title: 'Books Catalog Report',
      description: 'Complete book inventory with authors, categories, chapter count, and total cumulative reads.',
      count: `${books.length} book records`,
      icon: <BookOpen size={32} color="var(--primary)" />,
      color: 'var(--primary-light)',
      action: handleExportBooks
    },
    {
      title: 'Community Groups & Clubs Report',
      description: 'Directory of reader clubs, discussion categories, creator profiles, and moderation statuses.',
      count: `${communityGroups.length} community groups`,
      icon: <MessageSquare size={32} color="#0284c7" />,
      color: '#e0f2fe',
      action: handleExportCommunityGroups
    },
    {
      title: 'User Reading Shelves & Progress Report',
      description: 'Live audit of users current reading shelves, progress percentage, chapter bookmarks, and dates.',
      count: `${libraryProgress.length} reading shelf records`,
      icon: <Library size={32} color="#059669" />,
      color: '#ecfdf5',
      action: handleExportLibraryProgress
    },
    {
      title: 'Downloads & Offline Report',
      description: 'Audit log of all offline book packages downloaded across users with sizes and dates.',
      count: `${downloads.length} download records`,
      icon: <Download size={32} color="#10b981" />,
      color: '#f0fdf4',
      action: handleExportDownloads
    },
    {
      title: 'Gamification & Rewards Report',
      description: 'Breakdown of user scores and levels across Book Quiz, Word Search, Memory, and Puzzle games.',
      count: `${usersList.filter(u => u.points > 0).length} active gamers`,
      icon: <Award size={32} color="#8b5cf6" />,
      color: '#faf5ff',
      action: handleExportGamification
    },
    {
      title: 'Book Reviews & Ratings Report',
      description: 'Detailed log of reader reviews, 5-star ratings, moderation status, and feedback comments.',
      count: `${reviews.length} user reviews submitted`,
      icon: <Star size={32} color="#f59e0b" />,
      color: '#fffbeb',
      action: handleExportReviews
    }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-dark)' }}>Data Reports & CSV Exports</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Export live Firestore data to CSV spreadsheets for analytics, compliance, and offline auditing
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
        {reports.map((r, i) => (
          <div key={i} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ width: 56, height: 56, borderRadius: '14px', background: r.color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                {r.icon}
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '0.4rem' }}>
                {r.title}
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '1rem' }}>
                {r.description}
              </p>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dark)', background: '#f8fafc', padding: '0.4rem 0.65rem', borderRadius: '6px', marginBottom: '1rem', border: '1px solid #e2e8f0' }}>
                📊 {r.count}
              </div>
              <button
                className="btn btn-primary"
                style={{ width: '100%', gap: '0.5rem', padding: '0.75rem' }}
                onClick={r.action}
              >
                <Download size={16} /> Export CSV
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
