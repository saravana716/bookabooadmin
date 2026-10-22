import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Upload, FileText, ArrowLeft, Loader2, Image as ImageIcon, Sparkles, Code, Plus, Trash2, Edit3, CheckCircle2, Gamepad2 } from 'lucide-react';
import { storage, ref, uploadBytes, getDownloadURL, db, addDoc, updateDoc, doc, collection, setDoc, serverTimestamp } from '../firebase';
import { extractChaptersFromPDF } from '../utils/pdfExtractor';
import { generateAutoQuiz, generateAutoWords } from '../utils/gameGenerator';

export default function AddBookPage({ categories = [], authors = [], editingBook, onSaveComplete }) {
  const navigate = useNavigate();
  const [bookForm, setBookForm] = useState({
    title: editingBook?.title || '',
    author: editingBook?.author || (authors[0]?.name || 'Morgan Housel'),
    category: editingBook?.category || (categories[0]?.name || 'Self Help'),
    price: editingBook?.price || '20',
    description: editingBook?.description || '',
    status: editingBook?.status || 'Active',
    cover: editingBook?.cover || '',
    pdfUrl: editingBook?.pdfUrl || ''
  });

  const [coverFile, setCoverFile] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);
  const [loading, setLoading] = useState(false);

  // Chapter & Text JSON state for dynamic mobile reading
  const [chapters, setChapters] = useState(() => {
    if (editingBook?.chapters && editingBook.chapters.length > 0) {
      return editingBook.chapters;
    }
    return [
      { id: 'chapter_1', title: 'Chapter 1: Introduction', content: ['Welcome to the book! Upload a PDF file or edit these paragraphs directly to generate dynamic mobile text.'] }
    ];
  });
  const [extractingPdf, setExtractingPdf] = useState(false);
  const [activeTab, setActiveTab] = useState('details'); // 'details' | 'chapters' | 'games' | 'json'

  // Interactive Games state for this book
  const [bookQuizzes, setBookQuizzes] = useState(editingBook?.quizzes || [
    {
      id: 'q_1',
      question: "Who wrote 'Harry Potter'?",
      options: ["J.R.R. Tolkien", "J.K. Rowling", "George R.R. Martin", "Stephen King"],
      correctAnswer: "J.K. Rowling"
    }
  ]);
  const [bookWords, setBookWords] = useState(editingBook?.words || [
    {
      id: 'w_1',
      word: "THEME",
      clue: "The main idea or underlying meaning in a story",
      points: 200
    }
  ]);

  // Fetch chapters & games if editing existing book
  React.useEffect(() => {
    if (editingBook?.chapters && editingBook.chapters.length > 0) {
      setChapters(editingBook.chapters);
    }
    if (editingBook?.quizzes && editingBook.quizzes.length > 0) {
      setBookQuizzes(editingBook.quizzes);
    }
    if (editingBook?.words && editingBook.words.length > 0) {
      setBookWords(editingBook.words);
    }
  }, [editingBook]);

  // Handles PDF file upload & automatic text + game extraction
  const handlePdfChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      alert('⚠️ PDF file size exceeds 50MB limit.');
      e.target.value = '';
      setPdfFile(null);
      return;
    }

    setPdfFile(file);
    setExtractingPdf(true);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const extractedChapters = await extractChaptersFromPDF(arrayBuffer);
      if (extractedChapters && extractedChapters.length > 0) {
        setChapters(extractedChapters);
        console.log('Successfully extracted chapters:', extractedChapters);
      }

      // Automatically generate book quiz & word games directly from extracted chapters and book info
      const fullText = (extractedChapters || []).map(ch => (Array.isArray(ch.content) ? ch.content.join(' ') : String(ch.content || ''))).join(' ');
      const autoQ = generateAutoQuiz(bookQuizzes, bookForm.title || file.name.replace('.pdf', ''), bookForm.author || '', 4);
      const autoW = generateAutoWords(bookWords, fullText, 4);
      setBookQuizzes(autoQ);
      setBookWords(autoW);
    } catch (err) {
      console.warn('PDF text extraction error:', err);
    } finally {
      setExtractingPdf(false);
    }
  };

  const handleSaveBook = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let coverUrl = bookForm.cover || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=200';
      let pdfUrl = bookForm.pdfUrl || '';

      if (coverFile) {
        try {
          console.log('Uploading cover to Firebase Storage...');
          const storageRef = ref(storage, `covers/${Date.now()}_${coverFile.name}`);
          const snapshot = await uploadBytes(storageRef, coverFile);
          coverUrl = await getDownloadURL(snapshot.ref);
        } catch (err) {
          console.warn('Firebase Storage Cover upload fallback:', err);
          coverUrl = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(coverFile);
          });
        }
      }

      if (pdfFile) {
        try {
          console.log('Uploading PDF to Firebase Storage...');
          const pdfStorageRef = ref(storage, `books_pdf/${Date.now()}_${pdfFile.name}`);
          const snapshot = await uploadBytes(pdfStorageRef, pdfFile);
          pdfUrl = await getDownloadURL(snapshot.ref);
        } catch (err) {
          console.warn('Firebase Storage PDF upload error:', err);
          if (pdfFile.size <= 750000) {
            pdfUrl = await new Promise((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result);
              reader.readAsDataURL(pdfFile);
            });
          } else {
            alert(
              '⚠️ Firebase Storage Permission Error (403 Forbidden):\n\n' +
              'Your PDF file is larger than 1MB, so it must be stored in Firebase Storage.\n' +
              'Please open your Firebase Console -> Storage -> Rules tab and set:\n\n' +
              'allow read, write: if true;\n\n' +
              'Then retry saving.'
            );
            setLoading(false);
            return;
          }
        }
      }

      // Check for duplicate words inside bookWords
      const wordNames = bookWords.map(w => (w.word || '').replace(/\s+/g, '').toUpperCase().trim()).filter(Boolean);
      const duplicateWord = wordNames.find((item, index) => wordNames.indexOf(item) !== index);
      if (duplicateWord) {
        alert(`⚠️ Duplicate Word in Game List!\nThe target word "${duplicateWord}" is listed more than once. Each target word must be unique.`);
        setLoading(false);
        return;
      }

      // Check for duplicate questions inside bookQuizzes
      const questionsList = bookQuizzes.map(q => (q.question || '').toLowerCase().trim()).filter(Boolean);
      const duplicateQuestion = questionsList.find((item, index) => questionsList.indexOf(item) !== index);
      if (duplicateQuestion) {
        alert(`⚠️ Duplicate Quiz Question!\nA question appears more than once in your Book Quiz list. Please make sure every question is unique.`);
        setLoading(false);
        return;
      }

      // Format clean chapters
      const sanitizedChapters = chapters.map((ch, idx) => ({
        id: ch.id || `chapter_${idx + 1}`,
        title: ch.title || `Chapter ${idx + 1}`,
        content: Array.isArray(ch.content) ? ch.content : String(ch.content).split('\n\n').filter(Boolean)
      }));

      const bookData = {
        title: bookForm.title,
        author: bookForm.author,
        category: bookForm.category,
        price: Number(bookForm.price),
        description: bookForm.description || '',
        status: bookForm.status || 'Active',
        cover: coverUrl,
        pdfUrl: pdfUrl,
        chapters: sanitizedChapters, // Clean JSON Chapter Array stored in book doc
        quizzes: bookQuizzes, // Book Quiz Questions
        words: bookWords, // Word Scramble Puzzles
        hasTextJson: sanitizedChapters.length > 0,
        updatedAt: serverTimestamp()
      };

      let targetBookId = editingBook?.id;

      if (targetBookId) {
        await updateDoc(doc(db, 'books', targetBookId), bookData);
      } else {
        bookData.createdAt = serverTimestamp();
        bookData.downloads = 0;
        bookData.reads = 0;
        const newDocRef = await addDoc(collection(db, 'books'), bookData);
        targetBookId = newDocRef.id;
      }

      // Also save chapters into a subcollection "chapters" for high-performance mobile streaming
      if (targetBookId && sanitizedChapters.length > 0) {
        try {
          const chaptersColRef = collection(db, 'books', targetBookId, 'chapters');
          for (let i = 0; i < sanitizedChapters.length; i++) {
            const ch = sanitizedChapters[i];
            await setDoc(doc(chaptersColRef, ch.id || `chapter_${i + 1}`), {
              order: i + 1,
              title: ch.title,
              content: ch.content
            });
          }
        } catch (subColErr) {
          console.warn('Could not update chapters subcollection:', subColErr);
        }
      }

      if (onSaveComplete) onSaveComplete();
      navigate('/books');
    } catch (error) {
      alert('Error saving book: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Chapter manipulation helpers
  const handleAddChapter = () => {
    const newId = `chapter_${chapters.length + 1}`;
    setChapters([...chapters, { id: newId, title: `Chapter ${chapters.length + 1}`, content: ['Write paragraph here...'] }]);
  };

  const handleUpdateChapterTitle = (index, newTitle) => {
    const updated = [...chapters];
    updated[index].title = newTitle;
    setChapters(updated);
  };

  const handleUpdateChapterContent = (index, textStr) => {
    const updated = [...chapters];
    updated[index].content = textStr.split('\n\n').filter(Boolean);
    setChapters(updated);
  };

  const handleDeleteChapter = (index) => {
    if (chapters.length <= 1) {
      alert('A book must contain at least 1 chapter.');
      return;
    }
    setChapters(chapters.filter((_, i) => i !== index));
  };

  return (
    <div style={{ maxWidth: '920px', margin: '0 auto' }}>
      {/* Page Navigation Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <button className="btn btn-outline" onClick={() => navigate('/books')} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
          <ArrowLeft size={16} /> Back to Books
        </button>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Upload PDF & generate Text/JSON for mobile reader</span>
      </div>

      <div className="card" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BookOpen size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-dark)' }}>
                {editingBook ? 'Edit Book Details' : 'Add New Book'}
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>PDF Upload + Auto Text/JSON Extraction for Native Reader</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div style={{ display: 'flex', background: '#f1f5f9', padding: '0.25rem', borderRadius: '8px', gap: '0.25rem' }}>
            <button
              type="button"
              onClick={() => setActiveTab('details')}
              style={{
                border: 'none',
                padding: '0.45rem 0.9rem',
                borderRadius: '6px',
                fontSize: '0.825rem',
                fontWeight: 700,
                cursor: 'pointer',
                background: activeTab === 'details' ? '#fff' : 'transparent',
                color: activeTab === 'details' ? 'var(--primary)' : 'var(--text-muted)',
                boxShadow: activeTab === 'details' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              Book Details & PDF
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('chapters')}
              style={{
                border: 'none',
                padding: '0.45rem 0.9rem',
                borderRadius: '6px',
                fontSize: '0.825rem',
                fontWeight: 700,
                cursor: 'pointer',
                background: activeTab === 'chapters' ? '#fff' : 'transparent',
                color: activeTab === 'chapters' ? 'var(--primary)' : 'var(--text-muted)',
                boxShadow: activeTab === 'chapters' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              <Sparkles size={14} color="#8b5cf6" /> Chapters ({chapters.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('games')}
              style={{
                border: 'none',
                padding: '0.45rem 0.9rem',
                borderRadius: '6px',
                fontSize: '0.825rem',
                fontWeight: 700,
                cursor: 'pointer',
                background: activeTab === 'games' ? '#fff' : 'transparent',
                color: activeTab === 'games' ? 'var(--primary)' : 'var(--text-muted)',
                boxShadow: activeTab === 'games' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              <Gamepad2 size={14} color="#f59e0b" /> Games ({bookQuizzes.length + bookWords.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('json')}
              style={{
                border: 'none',
                padding: '0.45rem 0.9rem',
                borderRadius: '6px',
                fontSize: '0.825rem',
                fontWeight: 700,
                cursor: 'pointer',
                background: activeTab === 'json' ? '#fff' : 'transparent',
                color: activeTab === 'json' ? 'var(--primary)' : 'var(--text-muted)',
                boxShadow: activeTab === 'json' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              <Code size={14} /> Mobile JSON
            </button>
          </div>
        </div>

        <form onSubmit={handleSaveBook}>
          {activeTab === 'details' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                <div className="form-group">
                  <label className="form-label">Book Title *</label>
                  <input className="form-control" placeholder="Enter book title" value={bookForm.title} onChange={e => setBookForm({ ...bookForm, title: e.target.value })} required />
                </div>

                <div className="form-group">
                  <label className="form-label">Author Name *</label>
                  <select
                    className="form-control"
                    value={bookForm.author}
                    onChange={e => setBookForm({ ...bookForm, author: e.target.value })}
                    required
                  >
                    {authors.length > 0 ? (
                      authors.map(a => <option key={a.id} value={a.name}>{a.name}</option>)
                    ) : (
                      <>
                        <option value="Morgan Housel">Morgan Housel</option>
                        <option value="James Clear">James Clear</option>
                        <option value="Robert Kiyosaki">Robert Kiyosaki</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.25rem' }}>
                <div className="form-group">
                  <label className="form-label">Category *</label>
                  <select className="form-control" value={bookForm.category} onChange={e => setBookForm({ ...bookForm, category: e.target.value })}>
                    {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    <option>Self Help</option>
                    <option>Productivity</option>
                    <option>Fiction</option>
                    <option>Wellness</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Price (₹) *</label>
                  <input className="form-control" type="number" placeholder="20" value={bookForm.price} onChange={e => setBookForm({ ...bookForm, price: e.target.value })} required />
                </div>

                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-control" value={bookForm.status} onChange={e => setBookForm({ ...bookForm, status: e.target.value })}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* File Upload & Direct URL Sections */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', margin: '1rem 0' }}>
                {/* Cover Upload & URL Card */}
                <div style={{ border: '2px dashed var(--border-color)', padding: '1.25rem', borderRadius: '10px', background: '#fafafa' }}>
                  <div style={{ textAlign: 'center', marginBottom: '0.75rem' }}>
                    <ImageIcon size={32} color="var(--primary)" style={{ marginBottom: '0.25rem' }} />
                    <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>Book Cover Image</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>JPG, PNG (Max 50MB) or Image URL</div>
                  </div>
                  
                  <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Upload Image File</label>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={e => {
                        const file = e.target.files[0];
                        if (file && file.size > 50 * 1024 * 1024) {
                          alert('⚠️ File size exceeds 50MB limit.');
                          e.target.value = '';
                          setCoverFile(null);
                          return;
                        }
                        setCoverFile(file);
                      }} 
                      className="form-control" 
                      style={{ fontSize: '0.8rem' }} 
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Or Cover Storage/Image URL</label>
                    <input 
                      type="url" 
                      className="form-control" 
                      placeholder="https://firebasestorage.googleapis.com/..." 
                      value={bookForm.cover} 
                      onChange={e => setBookForm({ ...bookForm, cover: e.target.value })} 
                      style={{ fontSize: '0.8rem' }} 
                    />
                  </div>
                </div>

                {/* PDF Upload & URL Card */}
                <div style={{ border: '2px dashed #ff9466', padding: '1.25rem', borderRadius: '10px', background: '#fff7ed' }}>
                  <div style={{ textAlign: 'center', marginBottom: '0.75rem' }}>
                    <FileText size={32} color="#ea580c" style={{ marginBottom: '0.25rem' }} />
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ea580c' }}>PDF Book File (.pdf)</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Upload PDF (Auto-extracts chapters for app)</div>
                  </div>

                  <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                    <label className="form-label" style={{ fontSize: '0.75rem', color: '#ea580c' }}>Upload PDF File (Max 50MB)</label>
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={handlePdfChange}
                      className="form-control"
                      style={{ fontSize: '0.8rem', background: '#fff' }}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.75rem', color: '#ea580c' }}>Or PDF Storage/Doc URL *</label>
                    <input 
                      type="url" 
                      className="form-control" 
                      placeholder="https://firebasestorage.googleapis.com/..." 
                      value={bookForm.pdfUrl} 
                      onChange={e => setBookForm({ ...bookForm, pdfUrl: e.target.value })} 
                      style={{ fontSize: '0.8rem', background: '#fff' }} 
                    />
                  </div>
                  
                  {extractingPdf ? (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#8b5cf6', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Loader2 size={14} className="spin" /> Converting PDF text to JSON chapters...
                    </div>
                  ) : pdfFile ? (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#10b981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <CheckCircle2 size={14} /> Extracted {chapters.length} chapters from {(pdfFile.size / (1024 * 1024)).toFixed(2)} MB PDF
                    </div>
                  ) : bookForm.pdfUrl ? (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>
                      ✓ Attached PDF URL Active
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-control" rows="3" placeholder="Write a description for this book..." value={bookForm.description} onChange={e => setBookForm({ ...bookForm, description: e.target.value })}></textarea>
              </div>
            </>
          )}

          {activeTab === 'chapters' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-dark)' }}>Dynamic Chapter & Paragraph Content</h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Each paragraph is rendered dynamically in the mobile app, supporting themes, fonts, and Audio TTS.</p>
                </div>
                <button type="button" className="btn btn-outline" onClick={handleAddChapter} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem' }}>
                  <Plus size={14} /> Add Chapter
                </button>
              </div>

              {chapters.map((ch, idx) => (
                <div key={idx} style={{ background: '#fff', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '1.25rem', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--primary)', background: 'var(--primary-light)', padding: '0.25rem 0.6rem', borderRadius: '6px' }}>
                      #{idx + 1}
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      value={ch.title}
                      onChange={e => handleUpdateChapterTitle(idx, e.target.value)}
                      placeholder="Chapter Title"
                      style={{ fontWeight: 700, fontSize: '0.9rem' }}
                    />
                    <button type="button" className="btn-icon" onClick={() => handleDeleteChapter(idx)} style={{ color: 'var(--danger)' }} title="Delete Chapter">
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Paragraphs (Separate paragraphs with blank lines):</label>
                    <textarea
                      className="form-control"
                      rows="5"
                      value={Array.isArray(ch.content) ? ch.content.join('\n\n') : String(ch.content || '')}
                      onChange={e => handleUpdateChapterContent(idx, e.target.value)}
                      placeholder="Enter paragraphs for this chapter..."
                      style={{ fontSize: '0.85rem', lineHeight: '1.6' }}
                    />
                    <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '0.25rem', textAlign: 'right' }}>
                      {Array.isArray(ch.content) ? ch.content.length : 1} paragraph(s) in this chapter
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'games' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-dark)' }}>Interactive Book Games (Quiz & Words)</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Generated automatically from book title/metadata or customizable for mobile game screens.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => {
                      const fullChapterText = chapters.map(ch => (Array.isArray(ch.content) ? ch.content.join(' ') : String(ch.content || ''))).join(' ');
                      const newQ = generateAutoQuiz(bookQuizzes, bookForm.title, bookForm.author, 4, fullChapterText);
                      const newW = generateAutoWords(bookWords, fullChapterText, 4);

                      if (newQ.length === 0 && newW.length === 0) {
                        alert('All questions and words in the pool have already been generated for this book!');
                        return;
                      }

                      // Replace with fresh set or merge without duplicates
                      setBookQuizzes(newQ.length >= 4 ? newQ : [...bookQuizzes, ...newQ]);
                      setBookWords(newW.length >= 4 ? newW : [...bookWords, ...newW]);
                    }}
                    style={{ color: '#8b5cf6', borderColor: '#c4b5fd', background: '#f5f3ff', fontSize: '0.8rem' }}
                  >
                    <Sparkles size={14} /> Re-Generate Games (New Words & Quiz)
                  </button>
                </div>
              </div>

              {/* Game 1: Book Quiz Questions */}
              <div style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    1. Book Quiz Questions ({bookQuizzes.length})
                  </h4>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => {
                      // Generate a brand new unique question from the quiz pool
                      const freshQuestions = generateAutoQuiz(bookQuizzes, bookForm.title, bookForm.author, 1);
                      if (freshQuestions && freshQuestions.length > 0) {
                        setBookQuizzes([...bookQuizzes, freshQuestions[0]]);
                      } else {
                        setBookQuizzes([...bookQuizzes, {
                          id: `q_${Date.now()}`,
                          question: `Custom Question ${bookQuizzes.length + 1}`,
                          options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
                          correctAnswer: 'Option 1'
                        }]);
                      }
                    }}
                    style={{ fontSize: '0.75rem', padding: '0.3rem 0.7rem' }}
                  >
                    <Plus size={13} /> Add Quiz Question
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {bookQuizzes.map((q, qIdx) => (
                    <div key={qIdx} style={{ background: '#fff', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '1rem' }}>
                      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)', background: 'var(--primary-light)', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>
                          Q{qIdx + 1}
                        </span>
                        <input
                          type="text"
                          className="form-control"
                          value={q.question}
                          onChange={e => {
                            const updated = [...bookQuizzes];
                            updated[qIdx].question = e.target.value;
                            setBookQuizzes(updated);
                          }}
                          placeholder="Question"
                          style={{ fontWeight: 700, fontSize: '0.875rem' }}
                        />
                        <button
                          type="button"
                          className="btn-icon"
                          onClick={() => setBookQuizzes(bookQuizzes.filter((_, i) => i !== qIdx))}
                          style={{ color: 'var(--danger)' }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                        {(q.options || []).map((opt, oIdx) => {
                          const isCorrect = q.correctAnswer === opt && opt !== '';
                          return (
                            <div 
                              key={oIdx} 
                              onClick={() => {
                                const updated = [...bookQuizzes];
                                updated[qIdx].correctAnswer = opt;
                                setBookQuizzes(updated);
                              }}
                              style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '0.5rem',
                                padding: '0.35rem 0.5rem',
                                borderRadius: '8px',
                                border: isCorrect ? '2px solid #10b981' : '1px solid #e2e8f0',
                                background: isCorrect ? '#ecfdf5' : '#ffffff',
                                cursor: 'pointer'
                              }}
                            >
                              <input
                                type="radio"
                                id={`book_q_${qIdx}_opt_${oIdx}`}
                                name={`correct_radio_${qIdx}`}
                                checked={isCorrect}
                                onChange={() => {
                                  const updated = [...bookQuizzes];
                                  updated[qIdx].correctAnswer = opt;
                                  setBookQuizzes(updated);
                                }}
                                style={{ accentColor: '#10b981', cursor: 'pointer', width: '16px', height: '16px' }}
                                title="Mark as correct answer"
                              />
                              <input
                                className="form-control"
                                value={opt}
                                onClick={e => e.stopPropagation()}
                                onChange={e => {
                                  const updated = [...bookQuizzes];
                                  const oldOpt = updated[qIdx].options[oIdx];
                                  updated[qIdx].options[oIdx] = e.target.value;
                                  if (updated[qIdx].correctAnswer === oldOpt) {
                                    updated[qIdx].correctAnswer = e.target.value;
                                  }
                                  setBookQuizzes(updated);
                                }}
                                placeholder={`Option ${oIdx + 1}`}
                                style={{ fontSize: '0.8rem', padding: '0.35rem 0.5rem', background: '#fff' }}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Game 2: Word Scramble Puzzles */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#4f46e5', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    2. Word Scramble Puzzles ({bookWords.length})
                  </h4>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => {
                      const freshWordObj = generateAutoWords(bookWords, '', 1)[0] || {
                        word: 'NOVEL',
                        clue: 'A long work of narrative fiction'
                      };
                      setBookWords([...bookWords, {
                        id: `w_${Date.now()}`,
                        word: freshWordObj.word,
                        clue: freshWordObj.clue
                      }]);
                    }}
                    style={{ fontSize: '0.75rem', padding: '0.3rem 0.7rem' }}
                  >
                    <Plus size={13} /> Add Word Puzzle
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                  {bookWords.map((w, wIdx) => (
                    <div key={wIdx} style={{ background: '#fff', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#4f46e5' }}>Word #{wIdx + 1}</span>
                        <button
                          type="button"
                          className="btn-icon"
                          onClick={() => setBookWords(bookWords.filter((_, i) => i !== wIdx))}
                          style={{ color: 'var(--danger)' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <div style={{ marginBottom: '0.5rem' }}>
                        <label style={{ fontSize: '0.725rem', fontWeight: 700, color: 'var(--text-muted)' }}>Target Word (Single Word):</label>
                        <input
                          className="form-control"
                          value={w.word}
                          onChange={e => {
                            const updated = [...bookWords];
                            updated[wIdx].word = e.target.value.replace(/\s+/g, '').toUpperCase();
                            setBookWords(updated);
                          }}
                          placeholder="e.g. THEME"
                          style={{ fontWeight: 800, color: '#4f46e5', fontSize: '0.85rem' }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '0.725rem', fontWeight: 700, color: 'var(--text-muted)' }}>Clue:</label>
                        <input
                          className="form-control"
                          value={w.clue}
                          onChange={e => {
                            const updated = [...bookWords];
                            updated[wIdx].clue = e.target.value;
                            setBookWords(updated);
                          }}
                          placeholder="Clue description..."
                          style={{ fontSize: '0.8rem' }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'json' && (
            <div>
              <div style={{ background: '#1e293b', color: '#f8fafc', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#38bdf8' }}>Mobile Firestore Document JSON Structure</span>
                  <span style={{ fontSize: '0.725rem', color: '#94a3b8' }}>Read-only preview</span>
                </div>
                <pre style={{ fontSize: '0.75rem', fontFamily: 'monospace', maxHeight: '350px', overflowY: 'auto', background: '#0f172a', padding: '1rem', borderRadius: '6px', margin: 0 }}>
                  {JSON.stringify({
                    id: editingBook?.id || 'generated_book_id',
                    title: bookForm.title || 'Untitled Book',
                    author: bookForm.author || 'Unknown',
                    category: bookForm.category,
                    price: Number(bookForm.price),
                    cover: bookForm.cover || 'https://...',
                    pdfUrl: bookForm.pdfUrl || 'https://...',
                    chapters: chapters
                  }, null, 2)}
                </pre>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                💡 <b>Mobile App Integration:</b> The mobile React Native app fetches this `chapters` JSON array from Firestore. Inside `reader.tsx`, FlashList iterates over `chapters[currentChapterIndex].content` to render paragraph cards dynamically with customizable fonts, themes, and `expo-speech` Audio Reader!
              </p>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
            <button type="button" className="btn btn-outline" onClick={() => navigate('/books')}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ padding: '0.7rem 1.8rem' }} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 size={16} className="spin" /> Uploading & Saving...
                </>
              ) : editingBook ? 'Save Changes' : 'Save Book & Chapters'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

