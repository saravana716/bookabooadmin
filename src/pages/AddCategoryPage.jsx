import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, ArrowLeft, Loader2, UploadCloud, Image as ImageIcon, Trash2, Link as LinkIcon, Check } from 'lucide-react';
import { storage, ref, uploadBytes, getDownloadURL } from '../firebase';

export default function AddCategoryPage({ editingCategory, onSaveCategory }) {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [name, setName] = useState(editingCategory?.name || '');
  const [status, setStatus] = useState(editingCategory?.status || 'Active');
  const [imageUrl, setImageUrl] = useState(editingCategory?.image || editingCategory?.imageUrl || '');
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(editingCategory?.image || editingCategory?.imageUrl || '');
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [useUrlInput, setUseUrlInput] = useState(false);

  const handleFileSelect = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (PNG, JPG, WEBP, or SVG).');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('⚠️ Image size exceeds 10MB limit.');
      return;
    }

    setImageFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    handleFileSelect(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    handleFileSelect(file);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setPreviewUrl('');
    setImageUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);

    try {
      let finalImageUrl = imageUrl.trim();

      // If user uploaded a new local file, upload to Firebase Storage
      if (imageFile) {
        try {
          const cleanName = imageFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
          const storageRef = ref(storage, `categories/${Date.now()}_${cleanName}`);
          const snapshot = await uploadBytes(storageRef, imageFile);
          finalImageUrl = await getDownloadURL(snapshot.ref);
        } catch (storageErr) {
          console.warn('Firebase Storage direct upload fallback:', storageErr);
          // Fallback to base64 DataURL if storage rules or CORS prevent direct upload
          finalImageUrl = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(imageFile);
          });
        }
      }

      if (editingCategory?.id) {
        await onSaveCategory(editingCategory.id, name.trim(), status, finalImageUrl);
      } else {
        await onSaveCategory(name.trim(), status, finalImageUrl);
      }
      navigate('/categories');
    } catch (err) {
      console.error('Error saving category:', err);
      alert('Failed to save category. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '650px', margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <button className="btn btn-outline" onClick={() => navigate('/categories')} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
          <ArrowLeft size={16} /> Back to Categories
        </button>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Configure category details</span>
      </div>

      <div className="card" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.75rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Layers size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-dark)' }}>
              {editingCategory ? 'Edit Category' : 'Add New Category'}
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Upload category icon and organize your book catalog</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Category Name */}
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label" style={{ fontWeight: 700 }}>Category Name *</label>
            <input
              className="form-control"
              placeholder="e.g. Self Help, Business, Children, Fiction"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>

          {/* Category Image Upload */}
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <label className="form-label" style={{ fontWeight: 700, margin: 0 }}>Category Image / Icon</label>
              <button
                type="button"
                onClick={() => setUseUrlInput(!useUrlInput)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary)',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <LinkIcon size={12} /> {useUrlInput ? 'Switch to File Upload' : 'Or paste Image URL'}
              </button>
            </div>

            {/* Direct Image URL mode */}
            {useUrlInput ? (
              <div>
                <input
                  type="url"
                  className="form-control"
                  placeholder="https://example.com/category-icon.png"
                  value={imageUrl}
                  onChange={(e) => {
                    setImageUrl(e.target.value);
                    setPreviewUrl(e.target.value);
                    setImageFile(null);
                  }}
                />
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                  Paste a direct CDN, Unsplash, or web image link
                </p>
              </div>
            ) : (
              /* File Drag & Drop / Upload area */
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  accept="image/*"
                  onChange={handleFileChange}
                />

                {previewUrl ? (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '0.85rem',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    background: '#f8fafc'
                  }}>
                    <img
                      src={previewUrl}
                      alt="Category Preview"
                      style={{
                        width: '70px',
                        height: '70px',
                        objectFit: 'cover',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        background: '#fff'
                      }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-dark)', marginBottom: '0.2rem' }}>
                        {imageFile ? imageFile.name : 'Category Image'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {imageFile ? `${(imageFile.size / 1024).toFixed(1)} KB` : 'Attached to category'}
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem' }}>
                        <button
                          type="button"
                          className="btn btn-outline"
                          style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                          onClick={() => fileInputRef.current?.click()}
                        >
                          Change Image
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline"
                          style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem', color: 'var(--danger)', borderColor: '#fca5a5' }}
                          onClick={handleRemoveImage}
                        >
                          <Trash2 size={12} /> Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      border: `2px dashed ${dragOver ? 'var(--primary)' : '#cbd5e1'}`,
                      background: dragOver ? 'var(--primary-light)' : '#f8fafc',
                      borderRadius: '12px',
                      padding: '1.75rem 1rem',
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#fff', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem', color: 'var(--primary)' }}>
                      <UploadCloud size={22} />
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-dark)', marginBottom: '0.2rem' }}>
                      Click to upload or drag and drop
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      PNG, JPG, WEBP, or SVG (Max 10MB)
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Status */}
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label" style={{ fontWeight: 700 }}>Status</label>
            <select className="form-control" value={status} onChange={e => setStatus(e.target.value)}>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          {/* Submit Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
            <button type="button" className="btn btn-outline" onClick={() => navigate('/categories')} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ padding: '0.7rem 1.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 size={16} className="spin" /> Saving Category...
                </>
              ) : editingCategory ? (
                'Save Changes'
              ) : (
                'Create Category'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
