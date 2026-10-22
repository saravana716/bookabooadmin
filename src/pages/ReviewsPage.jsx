import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Star, 
  MessageSquare, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  BookOpen, 
  User, 
  Trash2, 
  ThumbsUp, 
  ExternalLink,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { db, doc, updateDoc, deleteDoc, serverTimestamp } from '../firebase';

export default function ReviewsPage({ reviews = [], books = [], usersList = [] }) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [ratingFilter, setRatingFilter] = useState('all'); // 'all' | '5' | '4' | '3' | '2' | '1'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'approved' | 'pending' | 'rejected'
  const [selectedBookFilter, setSelectedBookFilter] = useState('all');

  // Book lookup map
  const bookMap = useMemo(() => {
    const map = {};
    books.forEach(b => { map[b.id] = b; });
    return map;
  }, [books]);

  // Overall Review Statistics
  const stats = useMemo(() => {
    const totalReviews = reviews.length;
    const approvedReviews = reviews.filter(r => r.status === 'approved').length;
    const pendingReviews = reviews.filter(r => r.status === 'pending').length;
    const rejectedReviews = reviews.filter(r => r.status === 'rejected').length;

    const totalRatingSum = reviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0);
    const avgRating = totalReviews > 0 ? (totalRatingSum / totalReviews).toFixed(1) : '0.0';

    const fiveStarCount = reviews.filter(r => Number(r.rating) === 5).length;
    const fiveStarPct = totalReviews > 0 ? Math.round((fiveStarCount / totalReviews) * 100) : 0;

    return {
      totalReviews,
      approvedReviews,
      pendingReviews,
      rejectedReviews,
      avgRating,
      fiveStarCount,
      fiveStarPct
    };
  }, [reviews]);

  // Unique books in reviews for filtering
  const bookOptions = useMemo(() => {
    const set = new Set();
    reviews.forEach(r => { if (r.bookTitle) set.add(r.bookTitle); });
    return ['all', ...Array.from(set)];
  }, [reviews]);

  // Filtered reviews list
  const filteredReviews = useMemo(() => {
    return reviews.filter(r => {
      const term = searchTerm.toLowerCase().trim();
      const userName = (r.userName || '').toLowerCase();
      const userEmail = (r.userEmail || '').toLowerCase();
      const bookTitle = (r.bookTitle || '').toLowerCase();
      const content = (r.reviewContent || '').toLowerCase();

      const matchesSearch = !term || userName.includes(term) || userEmail.includes(term) || bookTitle.includes(term) || content.includes(term);

      const matchesRating = ratingFilter === 'all' || String(r.rating) === ratingFilter;
      const matchesStatus = statusFilter === 'all' || (r.status || 'approved') === statusFilter;
      const matchesBook = selectedBookFilter === 'all' || r.bookTitle === selectedBookFilter;

      return matchesSearch && matchesRating && matchesStatus && matchesBook;
    });
  }, [reviews, searchTerm, ratingFilter, statusFilter, selectedBookFilter]);

  // Status updates
  const handleUpdateStatus = async (reviewId, newStatus) => {
    try {
      await updateDoc(doc(db, 'reviews', reviewId), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      alert('Error updating status: ' + err.message);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!confirm('Are you sure you want to permanently delete this review?')) return;
    try {
      await deleteDoc(doc(db, 'reviews', reviewId));
    } catch (err) {
      alert('Error deleting review: ' + err.message);
    }
  };

  const formatDate = (val) => {
    if (!val) return '—';
    try {
      if (val.toDate && typeof val.toDate === 'function') {
        return val.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      }
      if (val.seconds) {
        return new Date(val.seconds * 1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      }
      const d = new Date(val);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      }
    } catch (e) {}
    return '—';
  };

  // Render Star Rating
  const renderStars = (rating = 5) => {
    const num = Math.min(5, Math.max(0, Number(rating) || 0));
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={14}
            fill={star <= num ? '#f59e0b' : 'none'}
            color={star <= num ? '#f59e0b' : '#cbd5e1'}
          />
        ))}
      </div>
    );
  };

  return (
    <div>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-dark)' }}>Book Reviews Directory</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            All book reader ratings, feedback, and user reviews synchronized from Firestore
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => navigate('/review-approvals')}
          style={{ gap: '0.5rem' }}
        >
          <ShieldCheck size={16} /> Open Review Approvals Queue ({stats.pendingReviews})
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1.25rem', marginBottom: '1.75rem' }}>
        <div className="card" style={{ padding: '1.25rem', marginBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>TOTAL REVIEWS</span>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
              <MessageSquare size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-dark)' }}>{stats.totalReviews}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{stats.approvedReviews} published reviews</div>
        </div>

        <div className="card" style={{ padding: '1.25rem', marginBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>AVG RATING</span>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
              <Star size={18} fill="#f59e0b" />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f59e0b' }}>{stats.avgRating}</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>/ 5.0</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Based on {stats.totalReviews} ratings</div>
        </div>

        <div className="card" style={{ padding: '1.25rem', marginBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>5-STAR REVIEWS</span>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
              <ThumbsUp size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10b981' }}>{stats.fiveStarCount}</div>
          <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 700 }}>{stats.fiveStarPct}% of all reviews</div>
        </div>

        <div className="card" style={{ padding: '1.25rem', marginBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>PENDING MODERATION</span>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: stats.pendingReviews > 0 ? '#fef2f2' : 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: stats.pendingReviews > 0 ? '#ef4444' : 'var(--primary)' }}>
              <Clock size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: stats.pendingReviews > 0 ? '#ef4444' : 'var(--primary)' }}>
            {stats.pendingReviews}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {stats.pendingReviews > 0 ? 'Requires admin action' : 'All reviews reviewed'}
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {/* Filters Toolbar */}
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          {/* Status and Rating chips */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Status Tabs */}
            {[
              { id: 'all', label: `All (${reviews.length})` },
              { id: 'approved', label: `Approved (${stats.approvedReviews})` },
              { id: 'pending', label: `Pending (${stats.pendingReviews})` },
              { id: 'rejected', label: `Rejected (${stats.rejectedReviews})` }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                style={{
                  padding: '0.4rem 0.85rem',
                  borderRadius: '20px',
                  border: statusFilter === tab.id ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                  background: statusFilter === tab.id ? 'var(--primary-light)' : '#fff',
                  color: statusFilter === tab.id ? 'var(--primary)' : 'var(--text-muted)',
                  fontWeight: statusFilter === tab.id ? 700 : 500,
                  fontSize: '0.8rem',
                  cursor: 'pointer'
                }}
              >
                {tab.label}
              </button>
            ))}

            <span style={{ color: 'var(--border-color)', margin: '0 0.25rem' }}>|</span>

            {/* Rating Filter Dropdown */}
            <select
              className="form-control"
              value={ratingFilter}
              onChange={e => setRatingFilter(e.target.value)}
              style={{ width: 'auto', padding: '0.35rem 0.75rem', height: '34px', fontSize: '0.8rem' }}
            >
              <option value="all">All Stars ⭐</option>
              <option value="5">5 Stars only</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative', width: '280px' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              className="form-control"
              placeholder="Search reviewer, book, content..."
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
                <th>Reviewer</th>
                <th>Book Details</th>
                <th>Rating</th>
                <th style={{ minWidth: '220px' }}>Review Feedback</th>
                <th>Status</th>
                <th>Submitted On</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReviews.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                    <MessageSquare size={36} color="var(--text-light)" style={{ margin: '0 auto 0.75rem', display: 'block' }} />
                    <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>No reviews found</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginTop: '0.2rem' }}>
                      Reviews submitted from the mobile app will appear here in real time.
                    </div>
                  </td>
                </tr>
              ) : (
                filteredReviews.map((r) => {
                  const status = r.status || 'approved';

                  return (
                    <tr key={r.id}>
                      {/* Reviewer */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          {r.userAvatar ? (
                            <img src={r.userAvatar} alt={r.userName} style={{ width: '34px', height: '34px', borderRadius: '50%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem', flexShrink: 0 }}>
                              {(r.userName || r.userEmail || 'U').slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-dark)' }}>
                              {r.userName || 'Anonymous'}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {r.userEmail || r.userId}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Book Details */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          {r.bookCover ? (
                            <img src={r.bookCover} alt={r.bookTitle} style={{ width: '30px', height: '40px', objectFit: 'cover', borderRadius: '4px', flexShrink: 0 }} />
                          ) : (
                            <div style={{ width: '30px', height: '40px', borderRadius: '4px', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <BookOpen size={14} color="var(--primary)" />
                            </div>
                          )}
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-dark)' }}>
                              {r.bookTitle || 'Book'}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {r.bookAuthor || 'Author'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Rating */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          {renderStars(r.rating)}
                          <span style={{ fontWeight: 800, fontSize: '0.85rem', color: '#f59e0b' }}>
                            {r.rating || 5}.0
                          </span>
                        </div>
                      </td>

                      {/* Review Content */}
                      <td>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-dark)', lineHeight: 1.4, background: '#f8fafc', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #f1f5f9' }}>
                          "{r.reviewContent || 'No feedback text provided'}"
                        </div>
                      </td>

                      {/* Status */}
                      <td>
                        <span
                          className={
                            status === 'approved' ? 'badge badge-success' : 
                            status === 'pending' ? 'badge badge-warning' : 
                            'badge badge-danger'
                          }
                          style={{ textTransform: 'capitalize' }}
                        >
                          ● {status}
                        </span>
                      </td>

                      {/* Date */}
                      <td>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {formatDate(r.createdAt)}
                        </div>
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                          {status !== 'approved' && (
                            <button
                              className="btn-icon"
                              title="Approve Review"
                              style={{ color: '#10b981' }}
                              onClick={() => handleUpdateStatus(r.id, 'approved')}
                            >
                              <CheckCircle2 size={15} />
                            </button>
                          )}
                          {status !== 'rejected' && (
                            <button
                              className="btn-icon"
                              title="Reject Review"
                              style={{ color: '#ef4444' }}
                              onClick={() => handleUpdateStatus(r.id, 'rejected')}
                            >
                              <XCircle size={15} />
                            </button>
                          )}
                          <button
                            className="btn-icon"
                            title="Delete Review"
                            style={{ color: 'var(--text-light)' }}
                            onClick={() => handleDeleteReview(r.id)}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
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
