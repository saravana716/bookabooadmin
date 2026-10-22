import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Image as ImageIcon, 
  ExternalLink, 
  Sparkles, 
  Tag, 
  Eye, 
  CheckCircle2, 
  XCircle,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';

const PRESET_BANNERS = [
  {
    title: 'Summer Reading Gala: Up to 50% Off',
    subtitle: 'Explore bestselling fiction, memoirs, and thrillers at special prices',
    imageUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=800',
    targetUrl: '/books',
    tag: '50% DISCOUNT'
  },
  {
    title: 'Interactive Literature Quizzes & Word Puzzles',
    subtitle: 'Play daily book challenges, test your knowledge, and earn points',
    imageUrl: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&q=80&w=800',
    targetUrl: '/games',
    tag: 'GAMIFICATION'
  },
  {
    title: 'Self-Improvement & Habit Mastery',
    subtitle: 'Top curated reads from James Clear, Cal Newport, and more',
    imageUrl: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=800',
    targetUrl: '/categories',
    tag: 'FEATURED'
  }
];

export default function BannersPage({ banners = [], onAddBanner, onDeleteBanner, onToggleBannerStatus }) {
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [targetUrl, setTargetUrl] = useState('/books');
  const [tag, setTag] = useState('PROMO');
  const [showAddModal, setShowAddModal] = useState(false);

  const handleApplyPreset = (preset) => {
    setTitle(preset.title);
    setSubtitle(preset.subtitle);
    setImageUrl(preset.imageUrl);
    setTargetUrl(preset.targetUrl);
    setTag(preset.tag);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    const bannerData = {
      title: title.trim(),
      subtitle: subtitle.trim() || 'Books for a brighter you',
      imageUrl: imageUrl.trim() || 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=800',
      targetUrl: targetUrl || '/books',
      tag: tag || 'PROMO',
      status: 'Active'
    };

    onAddBanner(bannerData);
    setTitle('');
    setSubtitle('');
    setImageUrl('');
    setTargetUrl('/books');
    setTag('PROMO');
    setShowAddModal(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ImageIcon size={22} />
            </div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-dark)', margin: 0 }}>
              Banners & Promotional Offers
            </h1>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.35rem', marginBottom: 0 }}>
            Manage promotional carousels, seasonal reading fests, and discount alerts displayed across Bookkaboo
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => setShowAddModal(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
          <Plus size={16} /> + Create New Banner
        </button>
      </div>

      {/* Live Active Banners Carousel Showcase */}
      {banners.length > 0 && (
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={18} color="var(--primary)" />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>Live Reader App Carousel Preview</h3>
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {banners.filter(b => (b.status || 'Active') === 'Active').length} active banners in rotation
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {banners.map((b) => {
              const bgImg = b.imageUrl || 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=800';
              const isActive = (b.status || 'Active') === 'Active';

              return (
                <div
                  key={b.id}
                  style={{
                    position: 'relative',
                    borderRadius: '14px',
                    overflow: 'hidden',
                    height: '190px',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                    opacity: isActive ? 1 : 0.6,
                    border: isActive ? '2px solid transparent' : '2px dashed var(--border-color)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    padding: '1.25rem',
                    color: '#fff'
                  }}
                >
                  <img
                    src={bgImg}
                    alt={b.title}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      zIndex: 1,
                      filter: 'brightness(0.55)'
                    }}
                  />
                  <div style={{ position: 'relative', zIndex: 2 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                      <span style={{ background: 'var(--primary)', color: '#fff', fontSize: '0.65rem', fontWeight: 800, padding: '0.15rem 0.55rem', borderRadius: '4px', textTransform: 'uppercase' }}>
                        {b.tag || 'PROMO'}
                      </span>
                      <span className={`badge ${isActive ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.7rem' }}>
                        ● {isActive ? 'Active' : 'Paused'}
                      </span>
                    </div>
                    <div style={{ fontWeight: 800, fontSize: '1rem', lineHeight: 1.25, color: '#fff', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                      {b.title}
                    </div>
                    {b.subtitle && (
                      <div style={{ fontSize: '0.75rem', opacity: 0.9, marginTop: '0.2rem', color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {b.subtitle}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Banners Management Table */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">All Banners Catalog</h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Total: {banners.length}</span>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Banner Preview</th>
                <th>Title & Subtitle</th>
                <th>Target Destination</th>
                <th>Tag</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {banners.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No banners configured. Click <b>"+ Create New Banner"</b> to add your first promotional offer.
                  </td>
                </tr>
              ) : (
                banners.map((b) => {
                  const isActive = (b.status || 'Active') === 'Active';
                  const bgImg = b.imageUrl || 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=200';

                  return (
                    <tr key={b.id}>
                      <td>
                        <img
                          src={bgImg}
                          alt={b.title}
                          style={{ width: '80px', height: '48px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--border-color)' }}
                        />
                      </td>

                      <td>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-dark)' }}>{b.title}</div>
                        {b.subtitle && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{b.subtitle}</div>}
                      </td>

                      <td>
                        <span style={{ fontSize: '0.8rem', fontFamily: 'monospace', background: 'var(--bg-light)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                          {b.targetUrl || '/books'}
                        </span>
                      </td>

                      <td>
                        <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>
                          {b.tag || 'PROMO'}
                        </span>
                      </td>

                      <td>
                        <button
                          onClick={() => onToggleBannerStatus && onToggleBannerStatus(b.id, b.status || 'Active')}
                          style={{
                            border: 'none',
                            background: 'transparent',
                            cursor: onToggleBannerStatus ? 'pointer' : 'default',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem'
                          }}
                        >
                          <span className={`badge ${isActive ? 'badge-success' : 'badge-danger'}`}>
                            ● {isActive ? 'Active' : 'Paused'}
                          </span>
                        </button>
                      </td>

                      <td>
                        <button
                          className="btn-icon"
                          title="Delete Banner"
                          style={{ color: 'var(--danger)' }}
                          onClick={() => onDeleteBanner(b.id)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Banner Modal */}
      {showAddModal && (
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
          <div className="card" style={{ maxWidth: '600px', width: '100%', padding: '2rem', borderRadius: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Create New Promo Banner</h3>
              <button onClick={() => setShowAddModal(false)} style={{ border: 'none', background: 'transparent', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>

            {/* Quick 1-Click Preset Buttons */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.775rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                Quick Presets:
              </div>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                {PRESET_BANNERS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    style={{
                      padding: '0.35rem 0.65rem',
                      borderRadius: '6px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-light)',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    ⚡ {preset.tag}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Banner Headline *</label>
                <input
                  className="form-control"
                  placeholder="e.g. Festival of Books: 40% Off"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Subtitle / Subheading</label>
                <input
                  className="form-control"
                  placeholder="e.g. Explore hundreds of interactive audio & digital books"
                  value={subtitle}
                  onChange={e => setSubtitle(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Target Route / Link</label>
                  <select className="form-control" value={targetUrl} onChange={e => setTargetUrl(e.target.value)}>
                    <option value="/books">/books (Books Catalog)</option>
                    <option value="/games">/games (Interactive Games)</option>
                    <option value="/categories">/categories (Categories)</option>
                    <option value="/wishlist">/wishlist (Wishlist / Bookmarks)</option>
                  </select>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Banner Tag</label>
                  <input
                    className="form-control"
                    placeholder="e.g. 50% OFF, NEW, HOT"
                    value={tag}
                    onChange={e => setTag(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Image URL</label>
                <input
                  className="form-control"
                  placeholder="https://images.unsplash.com/..."
                  value={imageUrl}
                  onChange={e => setImageUrl(e.target.value)}
                />
              </div>

              {/* Preview */}
              {title && (
                <div style={{ marginTop: '0.5rem', background: '#1e293b', padding: '1rem', borderRadius: '10px', color: '#fff' }}>
                  <div style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 800 }}>Live Preview</div>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem', marginTop: '0.2rem' }}>{title}</div>
                  <div style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>{subtitle || 'Click to explore our catalog'}</div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                  <CheckCircle2 size={16} /> Save & Publish Banner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
