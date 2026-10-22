import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark, Heart, Search, BookOpen, User, Calendar, ExternalLink } from 'lucide-react';

export default function WishlistPage({ usersList = [], books = [] }) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  // Map books by ID for fast lookup
  const bookMap = useMemo(() => {
    const map = {};
    books.forEach(b => { map[b.id] = b; });
    return map;
  }, [books]);

  // Flatten all real bookmarks across all users
  const allBookmarks = useMemo(() => {
    const list = [];
    usersList.forEach(u => {
      if (Array.isArray(u.bookmarks)) {
        u.bookmarks.forEach(bm => {
          const matchedBook = bookMap[bm.bookId];
          list.push({
            id: bm.id || `${u.id}_${bm.bookId}_${bm.page}`,
            userId: u.id || u.uid,
            userName: u.displayName || u.name || (u.email ? u.email.split('@')[0] : 'User'),
            userEmail: u.email,
            bookId: bm.bookId,
            bookTitle: matchedBook?.title || bm.preview || 'Book',
            bookCover: matchedBook?.cover,
            bookAuthor: matchedBook?.author,
            chapterId: bm.chapterId,
            page: bm.page,
            preview: bm.preview,
            createdAt: bm.createdAt
          });
        });
      }
    });

    // Sort newest first
    list.sort((a, b) => {
      const getT = (v) => {
        if (!v) return 0;
        const d = new Date(v);
        return isNaN(d.getTime()) ? 0 : d.getTime();
      };
      return getT(b.createdAt) - getT(a.createdAt);
    });

    return list;
  }, [usersList, bookMap]);

  // Filtered
  const filteredList = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return allBookmarks;
    return allBookmarks.filter(item => {
      return (
        item.userName.toLowerCase().includes(term) ||
        (item.userEmail || '').toLowerCase().includes(term) ||
        item.bookTitle.toLowerCase().includes(term) ||
        (item.preview || '').toLowerCase().includes(term)
      );
    });
  }, [allBookmarks, searchTerm]);

  const formatDate = (val) => {
    if (!val) return '—';
    try {
      const d = new Date(val);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      }
    } catch (e) {}
    return '—';
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-dark)' }}>Saved Bookmarks & Wishlists</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Real-time aggregation of bookmarks, saved passages, and reading wishlists across all users
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1.25rem', marginBottom: '1.75rem' }}>
        <div className="card" style={{ padding: '1.25rem', marginBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>SAVED BOOKMARKS</span>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
              <Bookmark size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f59e0b' }}>{allBookmarks.length}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Passages and pages saved</div>
        </div>

        <div className="card" style={{ padding: '1.25rem', marginBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>ACTIVE READERS</span>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
              <User size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)' }}>
            {new Set(allBookmarks.map(b => b.userId)).size}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Users with active bookmarks</div>
        </div>

        <div className="card" style={{ padding: '1.25rem', marginBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>BOOKMARKED BOOKS</span>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
              <BookOpen size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#2563eb' }}>
            {new Set(allBookmarks.map(b => b.bookId)).size}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Unique titles saved</div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-dark)' }}>
            All User Bookmarks ({filteredList.length})
          </div>
          <div style={{ position: 'relative', width: '280px' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              className="form-control"
              placeholder="Search user, book, snippet..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '2.4rem', height: '36px', fontSize: '0.85rem', borderRadius: '18px' }}
            />
          </div>
        </div>

        <div className="table-responsive">
          <table className="custom-table" style={{ margin: 0 }}>
            <thead>
              <tr>
                <th>User</th>
                <th>Book</th>
                <th>Saved Location</th>
                <th>Snippet Preview</th>
                <th>Added On</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                    <Bookmark size={36} color="var(--text-light)" style={{ margin: '0 auto 0.75rem', display: 'block' }} />
                    <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>No bookmarks recorded yet</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>
                      When users bookmark passages in the mobile app, they will automatically appear here.
                    </div>
                  </td>
                </tr>
              ) : (
                filteredList.map((item) => (
                  <tr key={item.id}>
                    {/* User */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#fffbeb', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.75rem', flexShrink: 0 }}>
                          {item.userName.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-dark)' }}>
                            {item.userName}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {item.userEmail || item.userId}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Book */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        {item.bookCover ? (
                          <img src={item.bookCover} alt={item.bookTitle} style={{ width: '30px', height: '40px', objectFit: 'cover', borderRadius: '4px', flexShrink: 0 }} />
                        ) : (
                          <div style={{ width: '30px', height: '40px', borderRadius: '4px', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <BookOpen size={14} color="var(--primary)" />
                          </div>
                        )}
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-dark)' }}>
                            {item.bookTitle}
                          </div>
                          {item.bookAuthor && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {item.bookAuthor}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Saved Location */}
                    <td>
                      <span className="badge" style={{ background: '#f1f5f9', color: 'var(--text-dark)', fontSize: '0.75rem', fontWeight: 700 }}>
                        Page {item.page || 1}
                      </span>
                      {item.chapterId && (
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                          {item.chapterId}
                        </div>
                      )}
                    </td>

                    {/* Snippet Preview */}
                    <td style={{ maxWidth: '280px' }}>
                      {item.preview ? (
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', background: '#f8fafc', padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid #f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          "{item.preview}"
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontStyle: 'italic' }}>
                          Page bookmark
                        </span>
                      )}
                    </td>

                    {/* Added On */}
                    <td>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-dark)', fontWeight: 600 }}>
                        {formatDate(item.createdAt)}
                      </div>
                    </td>

                    {/* Action */}
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-outline"
                        style={{ padding: '0.35rem 0.7rem', fontSize: '0.75rem', borderRadius: '6px' }}
                        onClick={() => navigate(`/users/${item.userId}`)}
                      >
                        View User
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
