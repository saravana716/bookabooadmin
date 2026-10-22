import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, Search, Layers, Image as ImageIcon } from 'lucide-react';

export default function CategoriesPage({ categories = [], books = [], onEditCategory, onDeleteCategory, setSelectedCategoryFilter }) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const getCategoryBookCount = (catName) => {
    return books.filter(b => b.category === catName).length;
  };

  const filteredCategories = useMemo(() => {
    if (!searchTerm.trim()) return categories;
    const term = searchTerm.toLowerCase();
    return categories.filter(c => (c.name || '').toLowerCase().includes(term));
  }, [categories, searchTerm]);

  return (
    <div className="card">
      <div className="card-header" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 className="card-title">Categories</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Manage book categories with custom icons and dynamic book counts</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', width: '220px' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search category..."
              className="form-control"
              style={{ paddingLeft: '32px', fontSize: '0.825rem', height: '36px' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" onClick={() => { onEditCategory(null); navigate('/categories/add'); }}>
            <Plus size={16} /> + Add Category
          </button>
        </div>
      </div>

      <div className="table-responsive">
        <table className="custom-table">
          <thead>
            <tr>
              <th style={{ width: '50px' }}>#</th>
              <th>Category</th>
              <th>Books Count</th>
              <th>Status</th>
              <th style={{ width: '100px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCategories.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                  No categories found matching "{searchTerm}"
                </td>
              </tr>
            ) : (
              filteredCategories.map((cat, index) => {
                const img = cat.image || cat.imageUrl;
                return (
                  <tr key={cat.id}>
                    <td>{index + 1}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        {img ? (
                          <img
                            src={img}
                            alt={cat.name}
                            style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '8px',
                              objectFit: 'cover',
                              border: '1px solid #e2e8f0',
                              flexShrink: 0
                            }}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '8px',
                              background: 'var(--primary-light)',
                              color: 'var(--primary)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: '0.95rem',
                              flexShrink: 0
                            }}
                          >
                            {cat.name?.charAt(0)?.toUpperCase() || <Layers size={18} />}
                          </div>
                        )}
                        <div>
                          <span
                            style={{
                              fontWeight: 700,
                              cursor: 'pointer',
                              color: 'var(--text-dark)',
                              fontSize: '0.9rem'
                            }}
                            onClick={() => { setSelectedCategoryFilter(cat.name); navigate('/books'); }}
                            title="Click to view books in this category"
                          >
                            {cat.name}
                          </span>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {img ? 'Custom icon' : 'No icon uploaded'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--primary)' }}>
                      {getCategoryBookCount(cat.name)} books
                    </td>
                    <td>
                      <span className={`badge ${cat.status === 'Inactive' ? 'badge-danger' : 'badge-success'}`}>
                        ● {cat.status || 'Active'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button className="btn-icon" title="Edit Category" onClick={() => { onEditCategory(cat); navigate('/categories/add'); }}>
                          <Edit2 size={14} />
                        </button>
                        <button className="btn-icon" title="Delete Category" style={{ color: 'var(--danger)' }} onClick={() => onDeleteCategory(cat.id)}>
                          <Trash2 size={14} />
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
  );
}
