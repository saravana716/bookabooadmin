import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search, 
  Filter, 
  Users, 
  Calendar, 
  Mail, 
  User, 
  Check, 
  X, 
  AlertCircle, 
  Trash2,
  Tag,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { db, doc, updateDoc, deleteDoc, serverTimestamp } from '../firebase';

export default function GroupApprovalsPage({ communityGroups = [], usersList = [] }) {
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'approved' | 'rejected' | 'all'
  const [searchTerm, setSearchTerm] = useState('');
  const [actionInProgressId, setActionInProgressId] = useState(null);

  // Statistics
  const stats = useMemo(() => {
    const pending = communityGroups.filter(g => (g.status || 'PENDING').toUpperCase() === 'PENDING');
    const approved = communityGroups.filter(g => (g.status || '').toUpperCase() === 'APPROVED');
    const rejected = communityGroups.filter(g => (g.status || '').toUpperCase() === 'REJECTED');
    const total = communityGroups.length;
    const approvalRate = total > 0 ? Math.round((approved.length / total) * 100) : 100;

    return {
      pendingCount: pending.length,
      approvedCount: approved.length,
      rejectedCount: rejected.length,
      totalCount: total,
      approvalRate
    };
  }, [communityGroups]);

  // Filtered list
  const filteredGroups = useMemo(() => {
    return communityGroups.filter(g => {
      const status = (g.status || 'PENDING').toUpperCase();
      const term = searchTerm.toLowerCase().trim();

      const matchesTab = 
        activeTab === 'all' ? true :
        activeTab === 'pending' ? status === 'PENDING' :
        activeTab === 'approved' ? status === 'APPROVED' :
        activeTab === 'rejected' ? status === 'REJECTED' : true;

      const name = (g.name || '').toLowerCase();
      const creator = (g.creatorName || '').toLowerCase();
      const email = (g.creatorEmail || '').toLowerCase();
      const desc = (g.description || '').toLowerCase();
      const cat = (g.category || '').toLowerCase();

      const matchesSearch = !term || 
        name.includes(term) || 
        creator.includes(term) || 
        email.includes(term) || 
        desc.includes(term) || 
        cat.includes(term);

      return matchesTab && matchesSearch;
    });
  }, [communityGroups, activeTab, searchTerm]);

  // Approve action
  const handleApprove = async (id) => {
    setActionInProgressId(id);
    try {
      await updateDoc(doc(db, 'community_groups', id), {
        status: 'APPROVED',
        approvedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      alert('Error approving group: ' + err.message);
    } finally {
      setActionInProgressId(null);
    }
  };

  // Reject action
  const handleReject = async (id) => {
    setActionInProgressId(id);
    try {
      await updateDoc(doc(db, 'community_groups', id), {
        status: 'REJECTED',
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      alert('Error rejecting group: ' + err.message);
    } finally {
      setActionInProgressId(null);
    }
  };

  // Delete submission
  const handleDelete = async (id) => {
    if (!confirm('Permanently delete this group submission?')) return;
    try {
      await deleteDoc(doc(db, 'community_groups', id));
    } catch (err) {
      alert('Error deleting: ' + err.message);
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

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-dark)', margin: 0 }}>Community Group Moderation & Approvals</h2>
            {stats.pendingCount > 0 && (
              <span className="badge badge-warning" style={{ fontSize: '0.75rem', fontWeight: 800 }}>
                {stats.pendingCount} Pending Action
              </span>
            )}
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Review, verify, approve, or reject user-created community reading clubs and group submissions
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1.25rem', marginBottom: '1.75rem' }}>
        <div className="card" style={{ padding: '1.25rem', marginBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>PENDING MODERATION</span>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
              <Clock size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: stats.pendingCount > 0 ? '#f59e0b' : 'var(--text-dark)' }}>
            {stats.pendingCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            {stats.pendingCount > 0 ? 'Requires administrative review' : 'No pending groups'}
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem', marginBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>APPROVED GROUPS</span>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#10b981' }}>{stats.approvedCount}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Published & open to readers</div>
        </div>

        <div className="card" style={{ padding: '1.25rem', marginBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>REJECTED / DECLINED</span>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
              <XCircle size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ef4444' }}>{stats.rejectedCount}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Hidden from community</div>
        </div>

        <div className="card" style={{ padding: '1.25rem', marginBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>APPROVAL RATE</span>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a' }}>
              <ShieldCheck size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-dark)' }}>{stats.approvalRate}%</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Total submissions processed</div>
        </div>
      </div>

      {/* Main Approvals Card */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {[
              { id: 'pending', label: `Pending Review (${stats.pendingCount})`, highlight: stats.pendingCount > 0 },
              { id: 'approved', label: `Approved History (${stats.approvedCount})` },
              { id: 'rejected', label: `Rejected (${stats.rejectedCount})` },
              { id: 'all', label: `All Submissions (${stats.totalCount})` }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '0.45rem 0.9rem',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  background: activeTab === tab.id ? 'var(--primary)' : '#f8fafc',
                  color: activeTab === tab.id ? '#fff' : 'var(--text-muted)',
                  boxShadow: tab.highlight && activeTab !== tab.id ? '0 0 0 2px #f59e0b' : 'none'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f8fafc', padding: '0.4rem 0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', minWidth: '240px' }}>
            <Search size={15} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search group name, creator..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '0.85rem' }}
            />
          </div>
        </div>

        {/* List of Submissions */}
        {filteredGroups.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-muted)' }}>
            <ShieldCheck size={40} color="var(--text-light)" style={{ margin: '0 auto 0.75rem', display: 'block' }} />
            <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-dark)' }}>
              {activeTab === 'pending' ? 'All caught up! No pending group approvals.' : 'No group submissions found.'}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              {activeTab === 'pending' ? 'When users create new community clubs in the app, they will appear here.' : 'Try changing your tab filter.'}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {filteredGroups.map(group => {
              const status = (group.status || 'PENDING').toUpperCase();
              const isPending = status === 'PENDING';
              const isApproved = status === 'APPROVED';
              const isRejected = status === 'REJECTED';

              const banner = (group.bannerImage && !group.bannerImage.startsWith('file://'))
                ? group.bannerImage
                : 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=800';

              return (
                <div
                  key={group.id}
                  style={{
                    padding: '1.25rem',
                    background: '#f8fafc',
                    borderRadius: '12px',
                    border: isPending ? '2px solid #f59e0b' : '1px solid #e2e8f0',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                    {/* Left: Group Info & Banner */}
                    <div style={{ display: 'flex', gap: '1rem', flex: 1, minWidth: '280px' }}>
                      <img
                        src={banner}
                        alt={group.name}
                        style={{ width: '90px', height: '90px', objectFit: 'cover', borderRadius: '10px', boxShadow: '0 2px 6px rgba(0,0,0,0.1)', flexShrink: 0 }}
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=800';
                        }}
                      />

                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-dark)', margin: 0 }}>
                            {group.name}
                          </h3>
                          <span
                            className={isApproved ? 'badge badge-success' : isPending ? 'badge badge-warning' : 'badge badge-danger'}
                            style={{ fontSize: '0.7rem', fontWeight: 800 }}
                          >
                            ● {status}
                          </span>
                          <span style={{ fontSize: '0.75rem', background: '#e2e8f0', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 600 }}>
                            {group.category || 'General'}
                          </span>
                        </div>

                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.45, margin: '0 0 0.5rem 0' }}>
                          {group.description || 'No description provided.'}
                        </p>

                        {Array.isArray(group.tags) && group.tags.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                            {group.tags.map((t, idx) => (
                              <span key={idx} style={{ fontSize: '0.7rem', color: '#64748b', background: '#fff', border: '1px solid #e2e8f0', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Creator Info Card */}
                    <div style={{ background: '#ffffff', padding: '0.85rem', borderRadius: '8px', border: '1px solid #e2e8f0', minWidth: '220px' }}>
                      <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                        SUBMITTED BY CREATOR
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                        {group.creatorAvatar ? (
                          <img src={group.creatorAvatar} alt={group.creatorName} style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.75rem' }}>
                            {(group.creatorName || 'U').slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-dark)' }}>
                          {group.creatorName || 'Unknown User'}
                        </div>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {group.creatorEmail || 'No email'}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-light)', marginTop: '0.35rem' }}>
                        Submitted: {formatDate(group.createdAt)}
                      </div>
                    </div>
                  </div>

                  {/* Bottom: Moderation Action Buttons */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid #e2e8f0', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
                      Document ID: <code>{group.id}</code>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      {status !== 'APPROVED' && (
                        <button
                          className="btn btn-success"
                          style={{ padding: '0.45rem 1rem', fontSize: '0.85rem', gap: '0.4rem', background: '#10b981', color: '#fff', border: 'none', fontWeight: 700 }}
                          onClick={() => handleApprove(group.id)}
                          disabled={actionInProgressId === group.id}
                        >
                          <Check size={16} /> Approve Group
                        </button>
                      )}

                      {status !== 'REJECTED' && (
                        <button
                          className="btn"
                          style={{ padding: '0.45rem 1rem', fontSize: '0.85rem', gap: '0.4rem', background: '#fee2e2', color: '#ef4444', border: 'none', fontWeight: 700 }}
                          onClick={() => handleReject(group.id)}
                          disabled={actionInProgressId === group.id}
                        >
                          <X size={16} /> Reject Group
                        </button>
                      )}

                      <button
                        className="btn-icon"
                        style={{ color: 'var(--danger)', marginLeft: '0.5rem' }}
                        onClick={() => handleDelete(group.id)}
                        title="Delete record"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
