import React, { useState, useMemo } from 'react';
import { CreditCard, Plus, Search, CheckCircle2, DollarSign, ArrowUpRight, TrendingUp, Sparkles, Award } from 'lucide-react';
import { db, collection, addDoc, serverTimestamp } from '../firebase';

export default function PaymentsPage({ payments = [], usersList = [] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('cash'); // 'cash' | 'points'
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({
    user: '',
    book: '',
    amount: 20,
    method: 'UPI',
    status: 'Paid'
  });
  const [saving, setSaving] = useState(false);

  // Aggregate points store book redemptions across all users
  const pointsRedemptions = useMemo(() => {
    const list = [];
    usersList.forEach(u => {
      if (u.unlockedBooks && typeof u.unlockedBooks === 'object') {
        Object.entries(u.unlockedBooks).forEach(([bId, val]) => {
          list.push({
            id: `${u.id}_${bId}`,
            userId: u.id || u.uid,
            userName: u.displayName || u.name || (u.email ? u.email.split('@')[0] : 'User'),
            userEmail: u.email,
            bookId: bId,
            bookTitle: val.bookTitle || 'Book',
            pointsSpent: Number(val.pointsSpent) || 0,
            unlockedAt: val.unlockedAt
          });
        });
      }
    });
    list.sort((a, b) => new Date(b.unlockedAt || 0) - new Date(a.unlockedAt || 0));
    return list;
  }, [usersList]);

  // Financial statistics
  const stats = useMemo(() => {
    const totalTransactions = payments.length;
    const totalRevenue = payments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
    const paidCount = payments.filter(p => p.status === 'Paid').length;
    const avgValue = totalTransactions > 0 ? Math.round(totalRevenue / totalTransactions) : 0;
    const totalPointsRedeemed = pointsRedemptions.reduce((acc, r) => acc + (Number(r.pointsSpent) || 0), 0);

    return { totalTransactions, totalRevenue, paidCount, avgValue, totalPointsRedeemed };
  }, [payments, pointsRedemptions]);

  // Filtered payments
  const filteredPayments = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return payments;
    return payments.filter(p => {
      const user = (p.user || p.userName || p.userEmail || '').toLowerCase();
      const book = (p.book || p.bookTitle || '').toLowerCase();
      const method = (p.method || '').toLowerCase();
      return user.includes(term) || book.includes(term) || method.includes(term);
    });
  }, [payments, searchTerm]);

  // Filtered points redemptions
  const filteredRedemptions = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return pointsRedemptions;
    return pointsRedemptions.filter(r => {
      const user = (r.userName || '').toLowerCase();
      const email = (r.userEmail || '').toLowerCase();
      const book = (r.bookTitle || '').toLowerCase();
      return user.includes(term) || email.includes(term) || book.includes(term);
    });
  }, [pointsRedemptions, searchTerm]);

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!form.user.trim() || !form.book.trim()) return;

    setSaving(true);
    try {
      await addDoc(collection(db, 'payments'), {
        user: form.user.trim(),
        book: form.book.trim(),
        amount: Number(form.amount) || 20,
        method: form.method,
        status: form.status,
        createdAt: serverTimestamp(),
        date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
      });
      setShowAddModal(false);
      setForm({ user: '', book: '', amount: 20, method: 'UPI', status: 'Paid' });
    } catch (err) {
      alert('Error recording payment: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

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
    return String(val);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-dark)' }}>Purchases & Payments</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Real-time tracking of book sales, purchases, and payment transactions
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowAddModal(true)}
          style={{ gap: '0.5rem' }}
        >
          <Plus size={16} /> Record Transaction
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1.25rem', marginBottom: '1.75rem' }}>
        <div className="card" style={{ padding: '1.25rem', marginBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>TOTAL REVENUE</span>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
              <TrendingUp size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)' }}>₹{stats.totalRevenue.toLocaleString()}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>From completed sales</div>
        </div>

        <div className="card" style={{ padding: '1.25rem', marginBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>TOTAL TRANSACTIONS</span>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
              <CreditCard size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#2563eb' }}>{stats.totalTransactions}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{stats.paidCount} paid successfully</div>
        </div>

        <div className="card" style={{ padding: '1.25rem', marginBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>AVG TRANSACTION</span>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
              <DollarSign size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10b981' }}>₹{stats.avgValue}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Average order amount</div>
        </div>

        <div className="card" style={{ padding: '1.25rem', marginBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>POINTS REDEEMED</span>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b45309' }}>
              <Sparkles size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#b45309' }}>{stats.totalPointsRedeemed.toLocaleString()}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{pointsRedemptions.length} books unlocked via pts</div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          {/* Tab Switcher */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setActiveTab('cash')}
              style={{
                padding: '0.45rem 0.9rem',
                borderRadius: '8px',
                border: 'none',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                background: activeTab === 'cash' ? 'var(--primary)' : '#f8fafc',
                color: activeTab === 'cash' ? '#fff' : 'var(--text-muted)'
              }}
            >
              Cash & UPI Orders ({filteredPayments.length})
            </button>
            <button
              onClick={() => setActiveTab('points')}
              style={{
                padding: '0.45rem 0.9rem',
                borderRadius: '8px',
                border: 'none',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                background: activeTab === 'points' ? '#b45309' : '#f8fafc',
                color: activeTab === 'points' ? '#fff' : 'var(--text-muted)'
              }}
            >
              Points Store Redemptions ({filteredRedemptions.length})
            </button>
          </div>

          <div style={{ position: 'relative', width: '280px' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              className="form-control"
              placeholder="Search user, book..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '2.4rem', height: '36px', fontSize: '0.85rem', borderRadius: '18px' }}
            />
          </div>
        </div>

        {activeTab === 'cash' ? (
          <div className="table-responsive">
            <table className="custom-table" style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th>Customer / User</th>
                  <th>Book Purchased</th>
                  <th>Amount</th>
                  <th>Payment Method</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                      <CreditCard size={36} color="var(--text-light)" style={{ margin: '0 auto 0.75rem', display: 'block' }} />
                      <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>No cash payment records found</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginTop: '0.2rem' }}>
                        Transactions recorded will appear here in real time.
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((p) => (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 700, color: 'var(--text-dark)' }}>{p.user || p.userName || 'Customer'}</td>
                      <td>{p.book || p.bookTitle || 'Book'}</td>
                      <td style={{ fontWeight: 800, color: 'var(--primary)' }}>₹{p.amount || 20}</td>
                      <td>
                        <span className="badge" style={{ background: '#f1f5f9', color: 'var(--text-dark)' }}>
                          {p.method || 'UPI'}
                        </span>
                      </td>
                      <td>
                        <span className={p.status === 'Paid' ? 'badge badge-success' : 'badge badge-warning'}>
                          ● {p.status || 'Paid'}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {formatDate(p.createdAt || p.date)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="custom-table" style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th>Customer / User</th>
                  <th>Book Unlocked</th>
                  <th>Points Spent</th>
                  <th>Unlock Type</th>
                  <th>Status</th>
                  <th>Redemption Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredRedemptions.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                      <Sparkles size={36} color="var(--text-light)" style={{ margin: '0 auto 0.75rem', display: 'block' }} />
                      <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>No points redemptions found</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginTop: '0.2rem' }}>
                        When users redeem reward points to unlock books, records will appear here.
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredRedemptions.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--text-dark)' }}>{r.userName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{r.userEmail || `User: ${r.userId.slice(0, 8)}...`}</div>
                      </td>
                      <td style={{ fontWeight: 600 }}>{r.bookTitle}</td>
                      <td style={{ fontWeight: 800, color: '#b45309' }}>
                        <span style={{ background: '#fef3c7', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                          -{r.pointsSpent.toLocaleString()} pts
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-warning">Reward Store</span>
                      </td>
                      <td>
                        <span className="badge badge-success">● Unlocked</span>
                      </td>
                      <td>{formatDate(r.unlockedAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '440px', margin: 0, padding: '1.75rem' }}>
            <h3 className="card-title" style={{ marginBottom: '1.25rem' }}>Record Transaction</h3>
            <form onSubmit={handleRecordPayment}>
              <div className="form-group">
                <label className="form-label">User / Customer Name or Email</label>
                <input
                  className="form-control"
                  placeholder="e.g. Saravanapriyan v"
                  value={form.user}
                  onChange={e => setForm({ ...form, user: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Book Title</label>
                <input
                  className="form-control"
                  placeholder="e.g. Atomic Habits"
                  value={form.book}
                  onChange={e => setForm({ ...form, book: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Amount (₹)</label>
                <input
                  className="form-control"
                  type="number"
                  value={form.amount}
                  onChange={e => setForm({ ...form, amount: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Payment Method</label>
                <select
                  className="form-control"
                  value={form.method}
                  onChange={e => setForm({ ...form, method: e.target.value })}
                >
                  <option value="UPI">UPI</option>
                  <option value="Card">Credit/Debit Card</option>
                  <option value="Net Banking">Net Banking</option>
                  <option value="Wallet">Wallet</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ flex: 1 }}
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
