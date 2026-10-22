import React, { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Search, 
  User, 
  Mail, 
  BookOpen, 
  UploadCloud, 
  X, 
  Loader2, 
  Link as LinkIcon 
} from 'lucide-react';
import { storage, ref, uploadBytes, getDownloadURL } from '../firebase';

export default function AuthorsPage({ 
  authors = [], 
  books = [], 
  onAddAuthor, 
  onUpdateAuthor, 
  onDeleteAuthor 
}) {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAuthor, setEditingAuthor] = useState(null);
  
  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [status, setStatus] = useState('Active');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [useUrlInput, setUseUrlInput] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [saving, setSaving] = useState(false);

  // Filter authors by search
  const filteredAuthors = useMemo(() => {
    if (!searchTerm.trim()) return authors;
    const term = searchTerm.toLowerCase();
    return authors.filter(a => 
      (a.name || '').toLowerCase().includes(term) ||
      (a.email || '').toLowerCase().includes(term) ||
      (a.bio || '').toLowerCase().includes(term)
    );
  }, [authors, searchTerm]);

  // Open modal for Adding
  const handleOpenAddModal = () => {
    setEditingAuthor(null);
    setName('');
    setEmail('');
    setBio('');
    setStatus('Active');
    setAvatarUrl('');
    setAvatarFile(null);
    setPreviewUrl('');
    setUseUrlInput(false);
    setIsModalOpen(true);
  };

  // Open modal for Editing
  const handleOpenEditModal = (author) => {
    setEditingAuthor(author);
    setName(author.name || '');
    setEmail(author.email || '');
    setBio(author.bio || '');
    setStatus(author.status || 'Active');
    const existingPic = author.avatar || author.image || author.imageUrl || '';
    setAvatarUrl(existingPic);
    setPreviewUrl(existingPic);
    setAvatarFile(null);
    setUseUrlInput(false);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    if (saving) return;
    setIsModalOpen(false);
    setEditingAuthor(null);
    setAvatarFile(null);
    setPreviewUrl('');
  };

  // Handle avatar file selection
  const handleFileSelect = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image (PNG, JPG, WEBP, or SVG).');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('⚠️ Image size exceeds 10MB limit.');
      return;
    }

    setAvatarFile(file);
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

  const handleRemovePhoto = () => {
    setAvatarFile(null);
    setPreviewUrl('');
    setAvatarUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Form submit (Add or Edit)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);

    try {
      let finalAvatarUrl = avatarUrl.trim();

      // If user selected a new local image file, upload to Firebase Storage
      if (avatarFile) {
        try {
          const cleanName = avatarFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
          const storageRef = ref(storage, `authors/${Date.now()}_${cleanName}`);
          const snapshot = await uploadBytes(storageRef, avatarFile);
          finalAvatarUrl = await getDownloadURL(snapshot.ref);
        } catch (storageErr) {
          console.warn('Firebase Storage upload fallback:', storageErr);
          // Fallback to Base64 DataURL if Firebase storage rules prevent direct write
          finalAvatarUrl = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(avatarFile);
          });
        }
      }

      const authorPayload = {
        name: name.trim(),
        email: email.trim(),
        bio: bio.trim(),
        status,
        avatar: finalAvatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
        image: finalAvatarUrl || '',
        imageUrl: finalAvatarUrl || ''
      };

      if (editingAuthor?.id) {
        await onUpdateAuthor(editingAuthor.id, authorPayload);
      } else {
        await onAddAuthor(authorPayload);
      }

      handleCloseModal();
    } catch (err) {
      console.error('Error saving author:', err);
      alert('Failed to save author details. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card">
      {/* Page Header */}
      <div className="card-header" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 className="card-title">Authors</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Manage platform authors, avatars, biographies, and publication metrics
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', width: '230px' }}>
            <Search 
              size={14} 
              style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} 
            />
            <input
              type="text"
              placeholder="Search author by name, email..."
              className="form-control"
              style={{ paddingLeft: '32px', fontSize: '0.825rem', height: '36px' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <button className="btn btn-primary" onClick={handleOpenAddModal} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            <Plus size={16} /> + Add Author
          </button>
        </div>
      </div>

      {/* Authors Table */}
      <div className="table-responsive">
        <table className="custom-table">
          <thead>
            <tr>
              <th style={{ width: '45px' }}>#</th>
              <th>Author Profile</th>
              <th>Email</th>
              <th>Catalog Books</th>
              <th>Status</th>
              <th style={{ width: '100px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAuthors.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                  No authors found {searchTerm ? `matching "${searchTerm}"` : 'in database'}
                </td>
              </tr>
            ) : (
              filteredAuthors.map((a, index) => {
                const booksCount = books.filter(b => (b.author || '').trim().toLowerCase() === (a.name || '').trim().toLowerCase()).length;
                const authorPic = a.avatar || a.image || a.imageUrl;

                return (
                  <tr key={a.id || index}>
                    <td>{index + 1}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                        {authorPic ? (
                          <img
                            src={authorPic}
                            alt={a.name}
                            style={{
                              width: '42px',
                              height: '42px',
                              borderRadius: '50%',
                              objectFit: 'cover',
                              border: '2px solid #e2e8f0',
                              flexShrink: 0
                            }}
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: '42px',
                              height: '42px',
                              borderRadius: '50%',
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
                            {a.name?.charAt(0)?.toUpperCase() || <User size={18} />}
                          </div>
                        )}
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--text-dark)', fontSize: '0.9rem' }}>
                            {a.name}
                          </div>
                          {a.bio ? (
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '280px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {a.bio}
                            </div>
                          ) : (
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-light)' }}>Author</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      {a.email ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.825rem', color: 'var(--text-dark)' }}>
                          <Mail size={13} color="var(--text-muted)" />
                          <span>{a.email}</span>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-light)', fontSize: '0.8rem' }}>—</span>
                      )}
                    </td>
                    <td style={{ fontWeight: 700 }}>
                      <span 
                        style={{ color: 'var(--primary)', cursor: booksCount > 0 ? 'pointer' : 'default' }}
                        onClick={() => {
                          if (booksCount > 0) {
                            navigate('/books');
                          }
                        }}
                      >
                        {booksCount} books
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${a.status === 'Inactive' ? 'badge-danger' : 'badge-success'}`}>
                        ● {a.status || 'Active'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button
                          className="btn-icon"
                          title="Edit Author"
                          onClick={() => handleOpenEditModal(a)}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          className="btn-icon"
                          title="Delete Author"
                          style={{ color: 'var(--danger)' }}
                          onClick={() => onDeleteAuthor(a.id)}
                        >
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

      {/* Proper Author Add/Edit Modal */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '14px',
            width: '100%',
            maxWidth: '560px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '90vh'
          }}>
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid #e2e8f0'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'var(--primary-light)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <User size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text-dark)' }}>
                    {editingAuthor ? 'Edit Author Profile' : 'Add New Author'}
                  </h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                    {editingAuthor ? 'Update biography and avatar photo' : 'Create an author for your publication catalog'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
                
                {/* Author Avatar Upload Section */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <label className="form-label" style={{ fontWeight: 700, margin: 0 }}>Author Profile Photo</label>
                    <button
                      type="button"
                      onClick={() => setUseUrlInput(!useUrlInput)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--primary)',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <LinkIcon size={12} /> {useUrlInput ? 'Upload Image File' : 'Paste Direct Photo URL'}
                    </button>
                  </div>

                  {useUrlInput ? (
                    <div>
                      <input
                        type="url"
                        className="form-control"
                        placeholder="https://example.com/author-photo.jpg"
                        value={avatarUrl}
                        onChange={(e) => {
                          setAvatarUrl(e.target.value);
                          setPreviewUrl(e.target.value);
                          setAvatarFile(null);
                        }}
                      />
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.3rem', margin: 0 }}>
                        Direct web photo URL
                      </p>
                    </div>
                  ) : (
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
                          padding: '0.75rem',
                          border: '1px solid #e2e8f0',
                          borderRadius: '10px',
                          background: '#f8fafc'
                        }}>
                          <img
                            src={previewUrl}
                            alt="Author Preview"
                            style={{
                              width: '64px',
                              height: '64px',
                              borderRadius: '50%',
                              objectFit: 'cover',
                              border: '2px solid #cbd5e1',
                              background: '#fff'
                            }}
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-dark)', marginBottom: '0.15rem' }}>
                              {avatarFile ? avatarFile.name : 'Author Profile Photo'}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                              {avatarFile ? `${(avatarFile.size / 1024).toFixed(1)} KB` : 'Attached to author profile'}
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.35rem' }}>
                              <button
                                type="button"
                                className="btn btn-outline"
                                style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem' }}
                                onClick={() => fileInputRef.current?.click()}
                              >
                                Change Photo
                              </button>
                              <button
                                type="button"
                                className="btn btn-outline"
                                style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem', color: 'var(--danger)', borderColor: '#fca5a5' }}
                                onClick={handleRemovePhoto}
                              >
                                Remove
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
                            borderRadius: '10px',
                            padding: '1.25rem 1rem',
                            textAlign: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <div style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '50%',
                            background: '#fff',
                            border: '1px solid #e2e8f0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 0.5rem',
                            color: 'var(--primary)'
                          }}>
                            <UploadCloud size={20} />
                          </div>
                          <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-dark)' }}>
                            Upload author avatar or photo
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            PNG, JPG, WEBP, or SVG (Max 10MB)
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Author Name */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 700 }}>Author Full Name *</label>
                  <input
                    className="form-control"
                    placeholder="e.g. James Clear, Robert Greene"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                {/* Author Email */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 700 }}>Contact Email (Optional)</label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="author@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                {/* Author Bio */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 700 }}>Author Biography / Bio</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    placeholder="Brief background, notable accolades, or summary of writing style..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    style={{ resize: 'vertical' }}
                  />
                </div>

                {/* Status */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 700 }}>Status</label>
                  <select 
                    className="form-control" 
                    value={status} 
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Modal Footer */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '0.75rem',
                padding: '1rem 1.5rem',
                borderTop: '1px solid #e2e8f0',
                background: '#f8fafc'
              }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={handleCloseModal}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1.5rem' }}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2 size={15} className="spin" /> Saving...
                    </>
                  ) : editingAuthor ? (
                    'Save Changes'
                  ) : (
                    'Create Author'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
