import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Star, 
  BookOpen, 
  User, 
  Trash2, 
  AlertCircle, 
  CheckCheck,
  Search,
  ChevronRight,
  Filter,
  Sparkles
} from 'lucide-react';
import { db, doc, updateDoc, deleteDoc, serverTimestamp } from '../firebase';

export default function ReviewApprovalsPage({ reviews = [], books = [], usersList = [] }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'approved' | 'rejected' | 'all'
  const [searchTerm, setSearchTerm] = useState('');
  const [actionInProgressId, setActionInProgressId] = useState(null);

  // Statistics
  const stats = useMemo(() => {
    const pending = reviews.filter(r => (r.status || 'pending') === 'pending');
    const approved = reviews.filter(r => r.status === 'approved');
    const rejected = reviews.filter(r => r.status === 'rejected');
    const total = reviews.length;
    const approvalRate = total > 0 ? Math.round((approved.length / total) * 100) : 100;

    return {
      pendingCount: pending.length,
      approvedCount: approved.length,
      rejectedCount: rejected.length,
      totalCount: total,
      approvalRate
    };
  }, [reviews]);

  // Filtered reviews
  const filteredReviews = useMemo(() => {
    return reviews.filter(r => {
      const status = r.status || 'pending';
      const term = searchTerm.toLowerCase().trim();

      const matchesTab = 
        activeTab === 'all' ? true :
        activeTab === 'pending' ? status === 'pending' :
        activeTab === 'approved' ? status === 'approved' :
        activeTab === 'rejected' ? status === 'rejected' : true;

      const user = (r.userName || '').toLowerCase();
      const email = (r.userEmail || '').toLowerCase();
      const book = (r.bookTitle || '').toLowerCase();
      const content = (r.reviewContent || '').toLowerCase();

      const matchesSearch = !term || user.includes(term) || email.includes(term) || book.includes(term) || content.includes(term);

      return matchesTab && matchesSearch;
    });
  }, [reviews, activeTab, searchTerm]);

  // Approve action
  const handleApprove = async (id) => {
    setActionInProgressId(id);
    try {
      await updateDoc(doc(db, 'reviews', id), {
        status: 'approved',
        moderatedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      alert('Error approving review: ' + err.message);
    } finally {
      setActionInProgressId(null);
    }
  };

  // Reject action
  const handleReject = async (id) => {
    setActionInProgressId(id);
    try {
      await updateDoc(doc(db, 'reviews', id), {
        status: 'rejected',
        moderatedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      alert('Error rejecting review: ' + err.message);
    } finally {
      setActionInProgressId(null);
    }
  };

  // Reset to pending
  const handleResetToPending = async (id) => {
    setActionInProgressId(id);
    try {
      await updateDoc(doc(db, 'reviews', id), {
        status: 'pending',
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setActionInProgressId(null);
    }
  };

  // Bulk approve all pending
  const handleApproveAllPending = async () => {
    const pendingList = reviews.filter(r => (r.status || 'pending') === 'pending');
    if (pendingList.length === 0) return;
    if (!confirm(`Approve all ${pendingList.length} pending reviews now?`)) return;

    for (const r of pendingList) {
      try {
        await updateDoc(doc(db, 'reviews', r.id), {
          status: 'approved',
          moderatedAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Permanently delete this review from Firestore?')) return;
    try {
      await deleteDoc(doc(db, 'reviews', id));
    } catch (err) {
      alert(err.message);
    }
  };

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

  const renderStars = (rating = 5) => {
    const num = Math.min(5, Math.max(0, Number(rating) || 0));
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            size={14}
            fill={s <= num ? '#f59e0b' : 'none'}
            color={s <= num ? '#f59e0b' : '#cbd5e1'}
          />
        ))}
      </div>
    );
  };

  return (
    <div>
      {/* Page Title & Bulk Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-dark)' }}>Review Approvals & Moderation</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Approve or reject reader reviews before or after they become visible on the Bookkaboo mobile app
          </p>
        </div>

        {stats.pendingCount > 0 && (
          <button
            className="btn btn-primary"
            style={{ background: '#10b981', borderColor: '#10b981', gap: '0.5rem' }}
            onClick={handleApproveAllPending}
          >
            <CheckCheck size={16} /> Approve All Pending ({stats.pendingCount})
          </button>
        )}
      </div>

      {/* KPI Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1.25rem', marginBottom: '1.75rem' }}>
        <div className="card" style={{ padding: '1.25rem', marginBottom: 0, border: stats.pendingCount > 0 ? '1.5px solid #f59e0b' : '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>PENDING APPROVAL</span>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706' }}>
              <Clock size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: stats.pendingCount > 0 ? '#d97706' : 'var(--text-dark)' }}>
            {stats.pendingCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Awaiting admin decision</div>
        </div>

        <div className="card" style={{ padding: '1.25rem', marginBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>APPROVED REVIEWS</span>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10b981' }}>{stats.approvedCount}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Live in mobile app</div>
        </div>

        <div className="card" style={{ padding: '1.25rem', marginBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>REJECTED REVIEWS</span>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
              <XCircle size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ef4444' }}>{stats.rejectedCount}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Hidden from readers</div>
        </div>

        <div className="card" style={{ padding: '1.25rem', marginBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>APPROVAL RATE</span>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
              <ShieldCheck size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#2563eb' }}>{stats.approvalRate}%</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Of reviewed submissions</div>
        </div>
      </div>

      {/* Toolbar & Filter Tabs */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => setActiveTab('pending')}
              style={{
                padding: '0.45rem 1rem',
                borderRadius: '20px',
                border: activeTab === 'pending' ? '1px solid #d97706' : '1px solid var(--border-color)',
                background: activeTab === 'pending' ? '#fffbeb' : '#fff',
                color: activeTab === 'pending' ? '#d97706' : 'var(--text-muted)',
                fontWeight: activeTab === 'pending' ? 800 : 500,
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <Clock size={14} /> Pending Approval ({stats.pendingCount})
            </button>

            <button
              onClick={() => setActiveTab('approved')}
              style={{
                padding: '0.45rem 1rem',
                borderRadius: '20px',
                border: activeTab === 'approved' ? '1px solid #10b981' : '1px solid var(--border-color)',
                background: activeTab === 'approved' ? '#ecfdf5' : '#fff',
                color: activeTab === 'approved' ? '#059669' : 'var(--text-muted)',
                fontWeight: activeTab === 'approved' ? 800 : 500,
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <CheckCircle2 size={14} /> Approved ({stats.approvedCount})
            </button>

            <button
              onClick={() => setActiveTab('rejected')}
              style={{
                padding: '0.45rem 1rem',
                borderRadius: '20px',
                border: activeTab === 'rejected' ? '1px solid #ef4444' : '1px solid var(--border-color)',
                background: activeTab === 'rejected' ? '#fef2f2' : '#fff',
                color: activeTab === 'rejected' ? '#dc2626' : 'var(--text-muted)',
                fontWeight: activeTab === 'rejected' ? 800 : 500,
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <XCircle size={14} /> Rejected ({stats.rejectedCount})
            </button>

            <button
              onClick={() => setActiveTab('all')}
              style={{
                padding: '0.45rem 1rem',
                borderRadius: '20px',
                border: activeTab === 'all' ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                background: activeTab === 'all' ? 'var(--primary-light)' : '#fff',
                color: activeTab === 'all' ? 'var(--primary)' : 'var(--text-muted)',
                fontWeight: activeTab === 'all' ? 800 : 500,
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              All Submissions ({stats.totalCount})
            </button>
          </div>

          {/* Search Bar */}
          <div style={{ position: 'relative', width: '280px' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              className="form-control"
              placeholder="Filter reviews..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '2.4rem', height: '36px', fontSize: '0.85rem', borderRadius: '18px' }}
            />
          </div>
        </div>

        {/* Reviews List */}
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {filteredReviews.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-muted)' }}>
              {activeTab === 'pending' ? (
                <>
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#ecfdf5', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                    <CheckCircle2 size={32} />
                  </div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '0.3rem' }}>
                    All Caught Up!
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto' }}>
                    There are currently no pending reviews waiting for moderation. New reviews submitted from reader devices will show up here automatically.
                  </p>
                </>
              ) : (
                <>
                  <AlertCircle size={36} color="var(--text-light)" style={{ margin: '0 auto 0.75rem', display: 'block' }} />
                  <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>No reviews found in this view</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginTop: '0.2rem' }}>
                    Try switching tabs or searching for another term
                  </div>
                </>
              )}
            </div>
          ) : (
            filteredReviews.map((r) => {
              const status = r.status || 'pending';
              const isWorking = actionInProgressId === r.id;

              return (
                <div
                  key={r.id}
                  style={{
                    background: '#ffffff',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    padding: '1.25rem 1.5rem',
                    boxShadow: 'var(--shadow-sm)',
                    transition: 'all 0.2s ease',
                    borderLeft: 
                      status === 'approved' ? '4px solid #10b981' :
                      status === 'pending' ? '4px solid #f59e0b' : '4px solid #ef4444'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                    {/* Reviewer & Book Header */}
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      {/* Book Cover */}
                      {r.bookCover ? (
                        <img src={r.bookCover} alt={r.bookTitle} style={{ width: '48px', height: '64px', objectFit: 'cover', borderRadius: '6px', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }} />
                      ) : (
                        <div style={{ width: '48px', height: '64px', borderRadius: '6px', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <BookOpen size={20} color="var(--primary)" />
                        </div>
                      )}

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.2rem' }}>
                          <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-dark)' }}>
                            {r.bookTitle || 'Book Review'}
                          </span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            by {r.bookAuthor || 'Author'}
                          </span>
                        </div>

                        {/* User info */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          <span style={{ fontWeight: 700, color: 'var(--text-dark)' }}>{r.userName || 'Anonymous Reader'}</span>
                          <span>•</span>
                          <span>{r.userEmail || r.userId}</span>
                          <span>•</span>
                          <span>{formatDate(r.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Status badge & Rating */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.35rem' }}>
                      <span
                        className={
                          status === 'approved' ? 'badge badge-success' : 
                          status === 'pending' ? 'badge badge-warning' : 
                          'badge badge-danger'
                        }
                        style={{ textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 800 }}
                      >
                        ● {status}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        {renderStars(r.rating)}
                        <span style={{ fontWeight: 800, fontSize: '0.85rem', color: '#f59e0b' }}>
                          {r.rating || 5}.0 / 5
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Review Content Quote Box */}
                  <div style={{ background: '#f8fafc', padding: '0.9rem 1.15rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1.25rem', fontSize: '0.9rem', color: 'var(--text-dark)', lineHeight: 1.5 }}>
                    "{r.reviewContent || 'No written feedback provided'}"
                  </div>

                  {/* Moderation Action Buttons Bar */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.85rem' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontFamily: 'monospace' }}>
                      Review ID: {r.id}
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      {status !== 'approved' && (
                        <button
                          className="btn"
                          style={{ background: '#10b981', color: '#fff', fontSize: '0.8rem', padding: '0.45rem 0.9rem', gap: '0.4rem', borderRadius: '6px' }}
                          onClick={() => handleApprove(r.id)}
                          disabled={isWorking}
                        >
                          <CheckCircle2 size={15} /> Approve & Publish
                        </button>
                      )}

                      {status !== 'rejected' && (
                        <button
                          className="btn"
                          style={{ background: '#ef4444', color: '#fff', fontSize: '0.8rem', padding: '0.45rem 0.9rem', gap: '0.4rem', borderRadius: '6px' }}
                          onClick={() => handleReject(r.id)}
                          disabled={isWorking}
                        >
                          <XCircle size={15} /> Reject
                        </button>
                      )}

                      {status !== 'pending' && (
                        <button
                          className="btn btn-outline"
                          style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem', gap: '0.4rem', borderRadius: '6px' }}
                          onClick={() => handleResetToPending(r.id)}
                          disabled={isWorking}
                        >
                          <Clock size={14} /> Move to Pending
                        </button>
                      )}

                      <button
                        className="btn-icon"
                        style={{ color: 'var(--danger)', marginLeft: '0.25rem' }}
                        title="Delete review permanently"
                        onClick={() => handleDelete(r.id)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
