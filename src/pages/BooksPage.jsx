import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { BookPlus, Edit2, Trash2, Eye, FileText, Filter, Smartphone, Star, Search, X } from 'lucide-react';
import MobileReaderSimulatorModal from '../components/MobileReaderSimulatorModal';

export default function BooksPage({ books = [], categories = [], reviews = [], selectedCategoryFilter, setSelectedCategoryFilter, onEditBook, onDeleteBook }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlSearch = searchParams.get('search') || '';
  const [searchTerm, setSearchTerm] = useState(urlSearch);
  const [viewingBook, setViewingBook] = useState(null);
  const [simulatingBook, setSimulatingBook] = useState(null);

  useEffect(() => {
    if (urlSearch !== searchTerm) {
      setSearchTerm(urlSearch);
    }
  }, [urlSearch]);

  // Deduplicate categories by name
  const uniqueCategories = Array.from(new Set(categories.map(c => c.name))).map(name => {
    return categories.find(c => c.name === name);
  });

  const getCategoryBookCount = (catName) => {
    return books.filter(b => b.category === catName).length;
  };

  const filteredBooks = books.filter(b => {
    const matchesCategory = selectedCategoryFilter === 'All' || b.category === selectedCategoryFilter;
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch = !term || 
      (b.title || '').toLowerCase().includes(term) || 
      (b.author || '').toLowerCase().includes(term) ||
      (b.category || '').toLowerCase().includes(term);
    return matchesCategory && matchesSearch;
  });

  return (
    <div>
      <div className="card">
        <div className="card-header" style={{ flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <h2 className="card-title" style={{ fontSize: '1.35rem', fontWeight: 800 }}>Books Management</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Manage, filter, upload PDF, & preview mobile reader</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {/* Live Search */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f8fafc', padding: '0.35rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', minWidth: '200px' }}>
              <Search size={15} color="var(--text-muted)" />
              <input
                type="text"
                placeholder="Search books, authors..."
                value={searchTerm}
                onChange={e => {
                  setSearchTerm(e.target.value);
                  if (e.target.value.trim()) {
                    setSearchParams({ search: e.target.value.trim() });
                  } else {
                    setSearchParams({});
                  }
                }}
                style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '0.85rem' }}
              />
              {searchTerm && (
                <button
                  onClick={() => { setSearchTerm(''); setSearchParams({}); }}
                  style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Category Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f8fafc', padding: '0.35rem 0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <Filter size={16} color="var(--primary)" />
              <span style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-dark)' }}>Category:</span>
              <select
                className="form-control"
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                style={{ width: 'auto', border: 'none', background: 'transparent', padding: '0.2rem 0.5rem', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}
              >
                <option value="All">All Categories ({books.length})</option>
                {uniqueCategories.map(cat => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name} ({getCategoryBookCount(cat.name)})
                  </option>
                ))}
              </select>
            </div>

            <button className="btn btn-primary" onClick={() => { onEditBook(null); navigate('/books/add'); }}>
              <BookPlus size={16} /> + Add Book
            </button>
          </div>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Cover</th>
                <th>Title</th>
                <th>Author</th>
                <th>Category</th>
                <th>Price</th>
                <th>Rating & Reviews</th>
                <th>Reader Format</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBooks.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                    No books found under category "<b>{selectedCategoryFilter}</b>".
                  </td>
                </tr>
              ) : (
                filteredBooks.map((b) => {
                  const bookReviews = reviews.filter(r => r.bookId === b.id || (r.bookTitle && r.bookTitle.toLowerCase() === (b.title || '').toLowerCase()));
                  const avgRating = bookReviews.length > 0 ? (bookReviews.reduce((sum, r) => sum + (Number(r.rating) || 0), 0) / bookReviews.length).toFixed(1) : null;

                  return (
                    <tr key={b.id}>
                      <td><img src={b.cover} alt={b.title} style={{ width: '36px', height: '48px', objectFit: 'cover', borderRadius: '4px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} /></td>
                      <td style={{ fontWeight: 700, fontSize: '0.9rem' }}>{b.title}</td>
                      <td>{b.author}</td>
                      <td><span className="badge badge-info">{b.category}</span></td>
                      <td style={{ fontWeight: 700, color: 'var(--primary)' }}>₹{b.price}</td>
                      <td>
                        {avgRating ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <Star size={13} fill="#f59e0b" color="#f59e0b" />
                            <span style={{ fontWeight: 800, fontSize: '0.85rem', color: '#f59e0b' }}>{avgRating}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({bookReviews.length})</span>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontStyle: 'italic' }}>No reviews</span>
                        )}
                      </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                        {b.chapters && b.chapters.length > 0 ? (
                          <button
                            onClick={() => setSimulatingBook(b)}
                            style={{ border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: '#8b5cf6', fontWeight: 700, fontSize: '0.775rem', background: '#f3e8ff', padding: '0.25rem 0.6rem', borderRadius: '20px' }}
                            title="Preview App Mobile Reader"
                          >
                            <Smartphone size={13} /> Mobile Reader ({b.chapters.length} Chs)
                          </button>
                        ) : null}
                        {b.pdfUrl ? (
                          <button
                            onClick={() => {
                              if (b.pdfUrl.startsWith('data:application/pdf')) {
                                const base64Data = b.pdfUrl.split(',')[1];
                                const binaryStr = window.atob(base64Data);
                                const len = binaryStr.length;
                                const bytes = new Uint8Array(len);
                                for (let i = 0; i < len; i++) {
                                  bytes[i] = binaryStr.charCodeAt(i);
                                }
                                const blob = new Blob([bytes], { type: 'application/pdf' });
                                const blobUrl = URL.createObjectURL(blob);
                                window.open(blobUrl, '_blank');
                              } else {
                                window.open(b.pdfUrl, '_blank');
                              }
                            }}
                            style={{ border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: '#10b981', fontWeight: 700, fontSize: '0.775rem', background: '#ecfdf5', padding: '0.25rem 0.6rem', borderRadius: '20px' }}
                          >
                            <FileText size={13} /> PDF File
                          </button>
                        ) : null}
                      </div>
                    </td>
                    <td><span className="badge badge-success">● {b.status || 'Active'}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button className="btn-icon" title="Mobile App Preview" style={{ color: '#8b5cf6' }} onClick={() => setSimulatingBook(b)}><Smartphone size={14} /></button>
                        <button className="btn-icon" title="View Details" onClick={() => setViewingBook(b)}><Eye size={14} /></button>
                        <button className="btn-icon" title="Edit Book" onClick={() => { onEditBook(b); navigate('/books/add'); }}><Edit2 size={14} /></button>
                        <button className="btn-icon" title="Delete Book" style={{ color: 'var(--danger)' }} onClick={() => onDeleteBook(b.id)}><Trash2 size={14} /></button>
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

      {/* View Book Details Modal */}
      {viewingBook && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '520px', margin: 0, boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div className="card-header" style={{ marginBottom: '1rem', paddingBottom: '0.75rem' }}>
              <h3 className="card-title">Book Details</h3>
              <button className="btn-icon" onClick={() => setViewingBook(null)}>✕</button>
            </div>

            <div style={{ display: 'flex', gap: '1.25rem', marginBottom: '1.25rem' }}>
              <img src={viewingBook.cover} alt={viewingBook.title} style={{ width: '90px', height: '120px', objectFit: 'cover', borderRadius: '6px', boxShadow: '0 4px 10px rgba(0,0,0,0.15)' }} />
              <div>
                <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-dark)' }}>{viewingBook.title}</h4>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Author: <b>{viewingBook.author}</b></div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Category: <b>{viewingBook.category}</b></div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)', marginTop: '0.5rem' }}>Price: ₹{viewingBook.price}</div>
              </div>
            </div>

            <div style={{ fontSize: '0.875rem', color: 'var(--text-dark)', marginBottom: '1.25rem', background: '#f8fafc', padding: '1rem', borderRadius: '8px', lineHeight: 1.5 }}>
              {viewingBook.description || 'No description available.'}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <button
                className="btn btn-outline"
                style={{ padding: '0.75rem', fontSize: '0.85rem', color: '#8b5cf6', borderColor: '#c084fc', background: '#f3e8ff' }}
                onClick={() => setSimulatingBook(viewingBook)}
              >
                <Smartphone size={18} /> Mobile App Preview
              </button>

              {viewingBook.pdfUrl ? (
                <button
                  className="btn btn-primary"
                  style={{ padding: '0.75rem', fontSize: '0.85rem' }}
                  onClick={() => {
                    if (viewingBook.pdfUrl.startsWith('data:application/pdf')) {
                      const base64Data = viewingBook.pdfUrl.split(',')[1];
                      const binaryStr = window.atob(base64Data);
                      const len = binaryStr.length;
                      const bytes = new Uint8Array(len);
                      for (let i = 0; i < len; i++) {
                        bytes[i] = binaryStr.charCodeAt(i);
                      }
                      const blob = new Blob([bytes], { type: 'application/pdf' });
                      const blobUrl = URL.createObjectURL(blob);
                      window.open(blobUrl, '_blank');
                    } else {
                      window.open(viewingBook.pdfUrl, '_blank');
                    }
                  }}
                >
                  <FileText size={18} /> Open PDF File
                </button>
              ) : null}
            </div>

            <div style={{ marginTop: '1.25rem', textAlign: 'right' }}>
              <button className="btn btn-outline" onClick={() => setViewingBook(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile App Reader Simulator Frame */}
      {simulatingBook && (
        <MobileReaderSimulatorModal
          book={simulatingBook}
          onClose={() => setSimulatingBook(null)}
        />
      )}
    </div>
  );
}

