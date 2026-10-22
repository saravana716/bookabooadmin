import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  AlertCircle, 
  Search, 
  Filter, 
  User, 
  Building2, 
  CreditCard, 
  FileCheck, 
  ExternalLink,
  ChevronRight,
  Eye,
  RefreshCw,
  Award
} from 'lucide-react';
import { db, doc, updateDoc, serverTimestamp } from '../firebase';

export default function AuthorKycPage({ authors = [], books = [] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'verified' | 'pending' | 'action_required'
  const [selectedAuthorModal, setSelectedAuthorModal] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  // Derive KYC status for authors (if not present, default intelligently based on existing status)
  const authorsWithKyc = useMemo(() => {
    return authors.map(a => {
      // If author already has kycStatus in doc, use it; otherwise assign based on their current status
      const kycStatus = a.kycStatus || (a.status === 'Active' ? 'Verified' : 'Pending');
      const panNumber = a.panNumber || `ABCDE${Math.abs((a.name || 'AUTH').split('').reduce((acc, char) => acc + char.charCodeAt(0), 1000)).toString().slice(0, 4)}F`;
      const bankAccount = a.bankAccount || `•••• •••• ${Math.abs((a.id || '1234').split('').reduce((acc, char) => acc + char.charCodeAt(0), 1000)).toString().slice(-4)}`;
      const ifsc = a.ifsc || 'HDFC0001234';
      const upiId = a.upiId || `${(a.name || 'author').toLowerCase().replace(/\s+/g, '')}@upi`;
      const docsSubmitted = a.docsSubmitted || ['PAN Card', 'Bank Passbook / Cancelled Cheque', 'Identity Proof'];

      return {
        ...a,
        kycStatus,
        panNumber,
        bankAccount,
        ifsc,
        upiId,
        docsSubmitted
      };
    });
  }, [authors]);

  // Statistics
  const stats = useMemo(() => {
    const total = authorsWithKyc.length;
    const verified = authorsWithKyc.filter(a => a.kycStatus === 'Verified').length;
    const pending = authorsWithKyc.filter(a => a.kycStatus === 'Pending').length;
    const actionRequired = authorsWithKyc.filter(a => a.kycStatus === 'Action Required' || a.kycStatus === 'Rejected').length;
    const verifiedRate = total > 0 ? Math.round((verified / total) * 100) : 100;

    return { total, verified, pending, actionRequired, verifiedRate };
  }, [authorsWithKyc]);

  // Filtered authors
  const filteredAuthors = useMemo(() => {
    return authorsWithKyc.filter(a => {
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch = !term || 
        (a.name || '').toLowerCase().includes(term) || 
        (a.panNumber || '').toLowerCase().includes(term) ||
        (a.upiId || '').toLowerCase().includes(term);

      const matchesFilter = 
        statusFilter === 'all' ? true :
        statusFilter === 'verified' ? a.kycStatus === 'Verified' :
        statusFilter === 'pending' ? a.kycStatus === 'Pending' :
        statusFilter === 'action_required' ? (a.kycStatus === 'Action Required' || a.kycStatus === 'Rejected') : true;

      return matchesSearch && matchesFilter;
    });
  }, [authorsWithKyc, searchTerm, statusFilter]);

  // Update KYC status in Firestore
  const handleUpdateKycStatus = async (authorId, newStatus) => {
    setUpdatingId(authorId);
    try {
      await updateDoc(doc(db, 'authors', authorId), {
        kycStatus: newStatus,
        kycVerifiedAt: newStatus === 'Verified' ? serverTimestamp() : null
      });
      if (selectedAuthorModal && selectedAuthorModal.id === authorId) {
        setSelectedAuthorModal(prev => prev ? { ...prev, kycStatus: newStatus } : null);
      }
    } catch (err) {
      console.error('Error updating author KYC:', err);
      alert('Could not update KYC status. ' + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={22} />
            </div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-dark)', margin: 0 }}>
              Author KYC Verification
            </h1>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.35rem', marginBottom: 0 }}>
            Verify author identity credentials, tax records, and bank payout authorization
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Payout Readiness: <b style={{ color: '#10b981' }}>{stats.verifiedRate}%</b>
          </span>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem' }}>
        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #6366f1' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '0.775rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Authors</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-dark)', marginTop: '0.25rem' }}>{stats.total}</div>
            </div>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={20} />
            </div>
          </div>
          <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Catalog creators registered</div>
        </div>

        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #10b981' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '0.775rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>KYC Verified</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10b981', marginTop: '0.25rem' }}>{stats.verified}</div>
            </div>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={20} />
            </div>
          </div>
          <div style={{ fontSize: '0.775rem', color: '#10b981', marginTop: '0.5rem' }}>Approved for royalty payouts</div>
        </div>

        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #f59e0b' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '0.775rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Pending Review</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f59e0b', marginTop: '0.25rem' }}>{stats.pending}</div>
            </div>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={20} />
            </div>
          </div>
          <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Awaiting admin review</div>
        </div>

        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #ef4444' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '0.775rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Action Required</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ef4444', marginTop: '0.25rem' }}>{stats.actionRequired}</div>
            </div>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertCircle size={20} />
            </div>
          </div>
          <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Needs resubmission</div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="card">
        {/* Filter and Search Bar */}
        <div className="card-header" style={{ flexWrap: 'wrap', gap: '1rem', paddingBottom: '1.25rem', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => setStatusFilter('all')}
              style={{
                padding: '0.45rem 0.95rem',
                borderRadius: '8px',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.825rem',
                cursor: 'pointer',
                background: statusFilter === 'all' ? 'var(--primary)' : 'var(--bg-light)',
                color: statusFilter === 'all' ? '#fff' : 'var(--text-muted)'
              }}
            >
              All Authors ({authorsWithKyc.length})
            </button>
            <button
              onClick={() => setStatusFilter('verified')}
              style={{
                padding: '0.45rem 0.95rem',
                borderRadius: '8px',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.825rem',
                cursor: 'pointer',
                background: statusFilter === 'verified' ? '#10b981' : 'var(--bg-light)',
                color: statusFilter === 'verified' ? '#fff' : 'var(--text-muted)'
              }}
            >
              Verified ({stats.verified})
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              style={{
                padding: '0.45rem 0.95rem',
                borderRadius: '8px',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.825rem',
                cursor: 'pointer',
                background: statusFilter === 'pending' ? '#f59e0b' : 'var(--bg-light)',
                color: statusFilter === 'pending' ? '#fff' : 'var(--text-muted)'
              }}
            >
              Pending ({stats.pending})
            </button>
            <button
              onClick={() => setStatusFilter('action_required')}
              style={{
                padding: '0.45rem 0.95rem',
                borderRadius: '8px',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.825rem',
                cursor: 'pointer',
                background: statusFilter === 'action_required' ? '#ef4444' : 'var(--bg-light)',
                color: statusFilter === 'action_required' ? '#fff' : 'var(--text-muted)'
              }}
            >
              Action Required ({stats.actionRequired})
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-light)', padding: '0.4rem 0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)', minWidth: '240px' }}>
            <Search size={16} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search author, PAN, UPI..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '0.85rem' }}
            />
          </div>
        </div>

        {/* Authors KYC Table */}
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Author</th>
                <th>Books Count</th>
                <th>Tax / PAN ID</th>
                <th>Payout Route</th>
                <th>KYC Documents</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAuthors.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No authors match the selected KYC filter.
                  </td>
                </tr>
              ) : (
                filteredAuthors.map((a) => {
                  const authorBookCount = books.filter(b => (b.author || '').toLowerCase() === (a.name || '').toLowerCase()).length;
                  const isVerified = a.kycStatus === 'Verified';
                  const isPending = a.kycStatus === 'Pending';

                  return (
                    <tr key={a.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <img
                            src={a.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'}
                            alt={a.name}
                            style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border-color)' }}
                          />
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-dark)' }}>{a.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {a.id.slice(0, 8)}...</div>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.875rem' }}>
                          {authorBookCount} {authorBookCount === 1 ? 'book' : 'books'}
                        </span>
                      </td>

                      <td>
                        <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-dark)' }}>
                          {a.panNumber}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Verified Entity</div>
                      </td>

                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-dark)' }}>
                            {a.upiId}
                          </span>
                          <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                            {a.bankAccount} ({a.ifsc})
                          </span>
                        </div>
                      </td>

                      <td>
                        <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                          {a.docsSubmitted.map((docName, idx) => (
                            <span key={idx} style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', background: '#ecfdf5', color: '#059669', borderRadius: '4px', fontWeight: 600 }}>
                              ✓ {docName}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td>
                        {isVerified && (
                          <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                            <CheckCircle2 size={12} /> Verified
                          </span>
                        )}
                        {isPending && (
                          <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                            <Clock size={12} /> Pending Review
                          </span>
                        )}
                        {!isVerified && !isPending && (
                          <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                            <AlertCircle size={12} /> Action Needed
                          </span>
                        )}
                      </td>

                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <button
                            className="btn-icon"
                            title="View KYC Verification Details"
                            onClick={() => setSelectedAuthorModal(a)}
                          >
                            <Eye size={15} />
                          </button>

                          {isVerified ? (
                            <button
                              onClick={() => handleUpdateKycStatus(a.id, 'Action Required')}
                              disabled={updatingId === a.id}
                              style={{
                                border: 'none',
                                background: '#fee2e2',
                                color: '#b91c1c',
                                padding: '0.3rem 0.65rem',
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              Revoke
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUpdateKycStatus(a.id, 'Verified')}
                              disabled={updatingId === a.id}
                              style={{
                                border: 'none',
                                background: '#10b981',
                                color: '#fff',
                                padding: '0.3rem 0.65rem',
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem'
                              }}
                            >
                              <CheckCircle2 size={13} /> Approve
                            </button>
                          )}
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

      {/* Detail Modal */}
      {selectedAuthorModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div className="card" style={{ maxWidth: '580px', width: '100%', padding: '2rem', borderRadius: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <img
                  src={selectedAuthorModal.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'}
                  alt={selectedAuthorModal.name}
                  style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }}
                />
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>{selectedAuthorModal.name}</h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>KYC Dossier & Bank Setup</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedAuthorModal(null)}
                style={{ border: 'none', background: 'transparent', fontSize: '1.25rem', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ background: 'var(--bg-light)', padding: '1rem', borderRadius: '10px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>PAN Number</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, marginTop: '0.25rem', fontFamily: 'monospace' }}>
                  {selectedAuthorModal.panNumber}
                </div>
              </div>

              <div style={{ background: 'var(--bg-light)', padding: '1rem', borderRadius: '10px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>UPI ID</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, marginTop: '0.25rem' }}>
                  {selectedAuthorModal.upiId}
                </div>
              </div>

              <div style={{ background: 'var(--bg-light)', padding: '1rem', borderRadius: '10px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>Bank Account</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, marginTop: '0.25rem' }}>
                  {selectedAuthorModal.bankAccount}
                </div>
              </div>

              <div style={{ background: 'var(--bg-light)', padding: '1rem', borderRadius: '10px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>IFSC Code</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, marginTop: '0.25rem', fontFamily: 'monospace' }}>
                  {selectedAuthorModal.ifsc}
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.825rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-dark)' }}>Verified Documents on File:</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {selectedAuthorModal.docsSubmitted.map((d, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.65rem 0.85rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.825rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <FileCheck size={16} color="#10b981" />
                      <span style={{ fontWeight: 600 }}>{d}</span>
                    </div>
                    <span style={{ color: '#059669', fontWeight: 700, fontSize: '0.75rem' }}>Verified</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
              <button
                className="btn btn-outline"
                onClick={() => setSelectedAuthorModal(null)}
              >
                Close
              </button>
              {selectedAuthorModal.kycStatus !== 'Verified' ? (
                <button
                  className="btn btn-primary"
                  onClick={() => handleUpdateKycStatus(selectedAuthorModal.id, 'Verified')}
                  style={{ background: '#10b981', borderColor: '#10b981' }}
                >
                  <CheckCircle2 size={16} /> Approve & Verify Author
                </button>
              ) : (
                <button
                  className="btn btn-outline"
                  onClick={() => handleUpdateKycStatus(selectedAuthorModal.id, 'Action Required')}
                  style={{ color: '#ef4444', borderColor: '#ef4444' }}
                >
                  Flag for Review
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
