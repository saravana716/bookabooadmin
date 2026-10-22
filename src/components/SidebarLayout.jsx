import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  Layers,
  Users,
  UserCheck,
  CreditCard,
  Download,
  BarChart3,
  Heart,
  Bell,
  Image as ImageIcon,
  FileText,
  Settings,
  User,
  LogOut,
  Menu,
  Search,
  BookMarked,
  BookPlus,
  DollarSign,
  ShieldCheck,
  Gamepad2,
  Star,
  MessageSquareCheck,
  MessagesSquare,
  CheckCheck
} from 'lucide-react';
import { auth, signOut } from '../firebase';

export default function SidebarLayout({ children, reviews = [], communityGroups = [] }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [role, setRole] = useState('admin');
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const pendingReviewsCount = reviews.filter(r => (r.status || 'pending') === 'pending').length;
  const pendingGroupsCount = communityGroups.filter(g => (g.status || 'PENDING').toUpperCase() === 'PENDING').length;

  const handleLogout = async () => {
    try { await signOut(auth); } catch (e) {}
    navigate('/login');
  };

  return (
    <div className="app-container">
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <BookOpen size={26} color="var(--primary)" />
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#fff' }}>Bookkaboo</div>
            <div style={{ fontSize: '0.6rem', color: '#94a3b8' }}>Books for a Brighter You</div>
          </div>
        </div>

        {/* Role Toggle Switcher */}
        <div style={{ padding: '0.65rem 0.85rem', background: '#131d38', borderBottom: '1px solid #192342', display: 'flex', gap: '0.4rem' }}>
          <button
            style={{
              flex: 1,
              padding: '0.35rem',
              borderRadius: '6px',
              border: 'none',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
              background: role === 'admin' ? 'var(--primary)' : 'transparent',
              color: role === 'admin' ? '#fff' : '#94a3b8'
            }}
            onClick={() => { setRole('admin'); navigate('/'); setSidebarOpen(false); }}
          >
            Admin Panel
          </button>
          <button
            style={{
              flex: 1,
              padding: '0.35rem',
              borderRadius: '6px',
              border: 'none',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
              background: role === 'author' ? 'var(--primary)' : 'transparent',
              color: role === 'author' ? '#fff' : '#94a3b8'
            }}
            onClick={() => { setRole('author'); navigate('/author/my-books'); setSidebarOpen(false); }}
          >
            Author Flow
          </button>
        </div>

        <div className="sidebar-menu">
          {role === 'admin' ? (
            <>
              <NavLink to="/" end className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`} onClick={() => setSidebarOpen(false)}>
                <LayoutDashboard size={18} /> Dashboard
              </NavLink>
              <NavLink to="/books" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`} onClick={() => setSidebarOpen(false)}>
                <BookOpen size={18} /> Books
              </NavLink>
              <NavLink to="/categories" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`} onClick={() => setSidebarOpen(false)}>
                <Layers size={18} /> Categories
              </NavLink>
              <NavLink to="/authors" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`} onClick={() => setSidebarOpen(false)}>
                <UserCheck size={18} /> Authors
              </NavLink>
              <NavLink to="/users" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`} onClick={() => setSidebarOpen(false)}>
                <Users size={18} /> Users
              </NavLink>
              <NavLink to="/reviews" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`} onClick={() => setSidebarOpen(false)}>
                <Star size={18} /> Book Reviews
              </NavLink>
              <NavLink to="/review-approvals" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`} onClick={() => setSidebarOpen(false)}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <MessageSquareCheck size={18} /> Review Approvals
                  </div>
                  {pendingReviewsCount > 0 && (
                    <span style={{ background: '#f59e0b', color: '#fff', fontSize: '0.65rem', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: '10px' }}>
                      {pendingReviewsCount}
                    </span>
                  )}
                </div>
              </NavLink>
              <NavLink to="/community-groups" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`} onClick={() => setSidebarOpen(false)}>
                <MessagesSquare size={18} /> Community Groups
              </NavLink>
              <NavLink to="/group-approvals" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`} onClick={() => setSidebarOpen(false)}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <CheckCheck size={18} /> Group Approvals
                  </div>
                  {pendingGroupsCount > 0 && (
                    <span style={{ background: '#f59e0b', color: '#fff', fontSize: '0.65rem', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: '10px' }}>
                      {pendingGroupsCount}
                    </span>
                  )}
                </div>
              </NavLink>
              <NavLink to="/payments" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`} onClick={() => setSidebarOpen(false)}>
                <CreditCard size={18} /> Purchases & Payments
              </NavLink>
              <NavLink to="/downloads" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`} onClick={() => setSidebarOpen(false)}>
                <Download size={18} /> Downloads
              </NavLink>
              <NavLink to="/analytics" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`} onClick={() => setSidebarOpen(false)}>
                <BarChart3 size={18} /> Reading Analytics
              </NavLink>
              <NavLink to="/wishlist" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`} onClick={() => setSidebarOpen(false)}>
                <Heart size={18} /> Wishlist
              </NavLink>
              <NavLink to="/notifications" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`} onClick={() => setSidebarOpen(false)}>
                <Bell size={18} /> Push Notifications
              </NavLink>
              <NavLink to="/banners" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`} onClick={() => setSidebarOpen(false)}>
                <ImageIcon size={18} /> Banners & Offers
              </NavLink>
              <NavLink to="/games" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`} onClick={() => setSidebarOpen(false)}>
                <Gamepad2 size={18} /> Interactive Games
              </NavLink>
              <NavLink to="/reports" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`} onClick={() => setSidebarOpen(false)}>
                <FileText size={18} /> Reports
              </NavLink>
              <NavLink to="/settings" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`} onClick={() => setSidebarOpen(false)}>
                <Settings size={18} /> Settings
              </NavLink>
            </>
          ) : (
            <>
              <NavLink to="/author/my-books" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`} onClick={() => setSidebarOpen(false)}>
                <BookMarked size={18} /> My Books
              </NavLink>
              <NavLink to="/author/add-book" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`} onClick={() => setSidebarOpen(false)}>
                <BookPlus size={18} /> Add New Book
              </NavLink>
              <NavLink to="/author/sales" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`} onClick={() => setSidebarOpen(false)}>
                <BarChart3 size={18} /> Book Analytics
              </NavLink>
              <NavLink to="/author/payouts" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`} onClick={() => setSidebarOpen(false)}>
                <DollarSign size={18} /> Earnings & Payouts
              </NavLink>
              <NavLink to="/author/kyc" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`} onClick={() => setSidebarOpen(false)}>
                <ShieldCheck size={18} /> KYC Verification
              </NavLink>
            </>
          )}

          <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #192342' }}>
            <div className="sidebar-item" onClick={handleLogout} style={{ color: '#ef4444' }}>
              <LogOut size={18} /> Logout
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="main-content">
        <header className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button className="btn-icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <Menu size={20} />
            </button>
            <div className="search-box">
              <Search size={18} />
              <input 
                className="form-control" 
                placeholder="Search books by title, author..." 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
                onKeyDown={e => {
                  if (e.key === 'Enter' && searchTerm.trim()) {
                    navigate(`/books?search=${encodeURIComponent(searchTerm.trim())}`);
                  }
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button className="btn-icon" style={{ position: 'relative' }}>
              <Bell size={18} />
              <span style={{ position: 'absolute', top: '4px', right: '4px', width: '7px', height: '7px', background: 'var(--primary)', borderRadius: '50%' }}></span>
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer' }} onClick={() => navigate('/profile')}>
              <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), #ff8a4c)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem' }}>
                {(auth.currentUser?.displayName || auth.currentUser?.email || 'Admin').slice(0, 2).toUpperCase()}
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{auth.currentUser?.displayName || auth.currentUser?.email?.split('@')[0] || 'Sunil Kumar'}</div>
            </div>
          </div>
        </header>

        <main className="page-body">
          {children}
        </main>
      </div>
    </div>
  );
}
