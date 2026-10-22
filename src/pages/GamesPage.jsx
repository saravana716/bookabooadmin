import React, { useState, useEffect } from 'react';
import { 
  Gamepad2, 
  HelpCircle, 
  Type, 
  Plus, 
  Trash2, 
  Edit2, 
  Sparkles, 
  CheckCircle2, 
  Save, 
  RefreshCw,
  Shuffle,
  Lightbulb,
  Award
} from 'lucide-react';
import { 
  db, 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc, 
  serverTimestamp 
} from '../firebase';
import { generateAutoQuiz, generateAutoWords, scrambleWord } from '../utils/gameGenerator';

export default function GamesPage() {
  const [activeTab, setActiveTab] = useState('quiz'); // 'quiz' | 'word'
  const [quizzes, setQuizzes] = useState([]);
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Quiz Question modal/form state
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [editingQuizId, setEditingQuizId] = useState(null);
  const [quizForm, setQuizForm] = useState({
    question: '',
    options: ['', '', '', ''],
    correctIndex: 0,
    category: 'Literature'
  });

  // New Word Scramble modal/form state
  const [showWordModal, setShowWordModal] = useState(false);
  const [editingWordId, setEditingWordId] = useState(null);
  const [wordForm, setWordForm] = useState({
    word: '',
    clue: '',
    points: 200
  });

  // Real-time Firestore synchronization
  useEffect(() => {
    const unsubQuiz = onSnapshot(collection(db, 'game_quizzes'), (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setQuizzes(data);
      setLoading(false);
    });

    const unsubWords = onSnapshot(collection(db, 'game_words'), (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setWords(data);
    });

    return () => {
      unsubQuiz();
      unsubWords();
    };
  }, []);

  // Save / Update Quiz Question
  const handleSaveQuiz = async (e) => {
    e.preventDefault();
    const chosenAnswer = quizForm.options[quizForm.correctIndex]?.trim() || '';

    if (!quizForm.question.trim() || !chosenAnswer) {
      alert('Please fill in the question and make sure the selected correct answer option is not empty.');
      return;
    }

    const trimmedQuestion = quizForm.question.trim().toLowerCase();
    // Duplicate check: ensure no other question matches
    const isDuplicate = quizzes.some(
      q => q.id !== editingQuizId && (q.question || '').trim().toLowerCase() === trimmedQuestion
    );
    if (isDuplicate) {
      alert(`⚠️ Duplicate Question!\nA quiz question with text "${quizForm.question.trim()}" already exists. Please enter a unique question.`);
      return;
    }

    try {
      const qId = editingQuizId || `quiz_${Date.now()}`;
      await setDoc(doc(db, 'game_quizzes', qId), {
        question: quizForm.question.trim(),
        options: quizForm.options.map(o => o.trim()).filter(Boolean),
        correctAnswer: chosenAnswer,
        category: quizForm.category || 'General',
        updatedAt: serverTimestamp()
      }, { merge: true });

      setShowQuizModal(false);
      setEditingQuizId(null);
      setQuizForm({ question: '', options: ['', '', '', ''], correctIndex: 0, category: 'Literature' });
    } catch (err) {
      alert('Error saving quiz question: ' + err.message);
    }
  };

  const handleDeleteQuiz = async (id) => {
    if (!confirm('Are you sure you want to delete this quiz question?')) return;
    try {
      await deleteDoc(doc(db, 'game_quizzes', id));
    } catch (err) {
      alert('Error deleting: ' + err.message);
    }
  };

  // Save / Update Word Scramble
  const handleSaveWord = async (e) => {
    e.preventDefault();
    const cleanWord = wordForm.word.replace(/\s+/g, '').toUpperCase().trim();
    if (!cleanWord || !wordForm.clue.trim()) {
      alert('Please fill in both a valid single target word and a clue.');
      return;
    }

    // Duplicate check: ensure word does not already exist
    const isDuplicate = words.some(
      w => w.id !== editingWordId && (w.word || '').replace(/\s+/g, '').toUpperCase() === cleanWord
    );
    if (isDuplicate) {
      alert(`⚠️ Duplicate Word!\nThe target word "${cleanWord}" is already present in your Word Scramble game. Please choose a different word.`);
      return;
    }

    try {
      const wId = editingWordId || `word_${Date.now()}`;
      await setDoc(doc(db, 'game_words', wId), {
        word: cleanWord,
        clue: wordForm.clue.trim(),
        scrambled: scrambleWord(cleanWord),
        updatedAt: serverTimestamp()
      }, { merge: true });

      setShowWordModal(false);
      setEditingWordId(null);
      setWordForm({ word: '', clue: '' });
    } catch (err) {
      alert('Error saving word: ' + err.message);
    }
  };

  const handleDeleteWord = async (id) => {
    if (!confirm('Are you sure you want to delete this word puzzle?')) return;
    try {
      await deleteDoc(doc(db, 'game_words', id));
    } catch (err) {
      alert('Error deleting: ' + err.message);
    }
  };

  // Auto-Generate batch questions with deduplication
  const handleAutoGenerateQuiz = async () => {
    const autoList = generateAutoQuiz(quizzes, '', '', 4);
    if (!autoList || autoList.length === 0) {
      alert('All questions in the current pool are already in your game collection!');
      return;
    }
    try {
      for (const item of autoList) {
        await setDoc(doc(db, 'game_quizzes', item.id), {
          question: item.question,
          options: item.options,
          correctAnswer: item.correctAnswer,
          category: 'Book Knowledge',
          createdAt: serverTimestamp()
        });
      }
      alert(`✓ ${autoList.length} new unique Quiz Questions generated without duplicates!`);
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  // Auto-Generate batch words with deduplication
  const handleAutoGenerateWords = async () => {
    const autoWords = generateAutoWords(words, '', 4);
    if (!autoWords || autoWords.length === 0) {
      alert('All words in the pool are already added! You have a rich puzzle collection.');
      return;
    }
    try {
      for (const item of autoWords) {
        await setDoc(doc(db, 'game_words', item.id), {
          word: item.word,
          clue: item.clue,
          scrambled: item.scrambled,
          createdAt: serverTimestamp()
        });
      }
      alert(`✓ ${autoWords.length} new unique Word Scramble puzzles generated without duplicates!`);
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  return (
    <div>
      {/* Top Header Card */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #ff5e15, #ff8c42)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(255, 94, 21, 0.3)'
            }}>
              <Gamepad2 size={26} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-dark)' }}>Interactive Games Management</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Configure Book Quiz (Q&A) and Word Scramble puzzles for the mobile application
              </p>
            </div>
          </div>

          {/* Navigation Pill Tabs */}
          <div style={{ display: 'flex', background: '#f1f5f9', padding: '0.35rem', borderRadius: '12px', gap: '0.35rem' }}>
            <button
              onClick={() => setActiveTab('quiz')}
              style={{
                border: 'none',
                padding: '0.55rem 1.25rem',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: activeTab === 'quiz' ? '#ffffff' : 'transparent',
                color: activeTab === 'quiz' ? 'var(--primary)' : 'var(--text-muted)',
                boxShadow: activeTab === 'quiz' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              <HelpCircle size={16} /> Book Quiz ({quizzes.length})
            </button>
            <button
              onClick={() => setActiveTab('word')}
              style={{
                border: 'none',
                padding: '0.55rem 1.25rem',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: activeTab === 'word' ? '#ffffff' : 'transparent',
                color: activeTab === 'word' ? '#6366f1' : 'var(--text-muted)',
                boxShadow: activeTab === 'word' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              <Type size={16} /> Word Scramble ({words.length})
            </button>
          </div>
        </div>
      </div>

      {/* GAME 1: BOOK QUIZ TAB */}
      {activeTab === 'quiz' && (
        <div className="card">
          <div className="card-header" style={{ flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 className="card-title">Book Quiz Questions</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Multiple-choice questions displayed on the mobile Book Quiz screen (matches your mobile app layout)
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                className="btn btn-outline"
                onClick={handleAutoGenerateQuiz}
                style={{ color: '#8b5cf6', borderColor: '#c4b5fd', background: '#f5f3ff' }}
              >
                <Sparkles size={16} /> Auto-Generate Questions
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setEditingQuizId(null);
                  setQuizForm({ question: '', options: ['', '', '', ''], correctAnswer: '', category: 'Literature' });
                  setShowQuizModal(true);
                }}
              >
                <Plus size={16} /> + Add Question
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.25rem' }}>
            {quizzes.length === 0 ? (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                No questions found. Click "<b>Auto-Generate Questions</b>" or "<b>+ Add Question</b>" to create one.
              </div>
            ) : (
              quizzes.map((q, idx) => (
                <div
                  key={q.id}
                  style={{
                    background: '#ffffff',
                    border: '1px solid var(--border-color)',
                    borderRadius: '14px',
                    padding: '1.25rem',
                    boxShadow: 'var(--shadow-sm)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)', background: 'var(--primary-light)', padding: '0.2rem 0.6rem', borderRadius: '12px' }}>
                        Question {idx + 1}
                      </span>
                      <div style={{ display: 'flex', gap: '0.35rem' }}>
                        <button
                          className="btn-icon"
                          title="Edit"
                          onClick={() => {
                            setEditingQuizId(q.id);
                            const foundIdx = (q.options || []).findIndex(opt => opt === q.correctAnswer);
                            setQuizForm({
                              question: q.question,
                              options: q.options || ['', '', '', ''],
                              correctIndex: foundIdx >= 0 ? foundIdx : 0,
                              category: q.category || 'Literature'
                            });
                            setShowQuizModal(true);
                          }}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          className="btn-icon"
                          title="Delete"
                          style={{ color: 'var(--danger)' }}
                          onClick={() => handleDeleteQuiz(q.id)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '1rem', lineHeight: 1.4 }}>
                      {q.question}
                    </h4>

                    {/* Options list matching the mobile UI */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                      {(q.options || []).map((opt, oIdx) => {
                        const isCorrect = opt === q.correctAnswer;
                        return (
                          <div
                            key={oIdx}
                            style={{
                              padding: '0.65rem 0.9rem',
                              borderRadius: '10px',
                              border: isCorrect ? '2px solid #10b981' : '1px solid #e2e8f0',
                              background: isCorrect ? '#ecfdf5' : '#f8fafc',
                              color: isCorrect ? '#065f46' : 'var(--text-dark)',
                              fontSize: '0.85rem',
                              fontWeight: isCorrect ? 700 : 500,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between'
                            }}
                          >
                            <span>{opt}</span>
                            {isCorrect && <CheckCircle2 size={16} color="#10b981" />}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px solid #f1f5f9', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Category: <b>{q.category || 'Literature'}</b></span>
                    <span style={{ color: '#10b981', fontWeight: 700 }}>✓ Verified Answer</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* GAME 2: WORD SCRAMBLE TAB */}
      {activeTab === 'word' && (
        <div className="card">
          <div className="card-header" style={{ flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 className="card-title">Word Scramble Puzzles</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Words, clues, and point rewards configured for the Word Scramble mobile game
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                className="btn btn-outline"
                onClick={handleAutoGenerateWords}
                style={{ color: '#6366f1', borderColor: '#c7d2fe', background: '#eef2ff' }}
              >
                <Sparkles size={16} /> Auto-Generate Puzzles
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setEditingWordId(null);
                  setWordForm({ word: '', clue: '', points: 200 });
                  setShowWordModal(true);
                }}
              >
                <Plus size={16} /> + Add Word & Clue
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
            {words.length === 0 ? (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                No word puzzles found. Click "<b>Auto-Generate Puzzles</b>" or "<b>+ Add Word & Clue</b>" to create one.
              </div>
            ) : (
              words.map((w, idx) => (
                <div
                  key={w.id}
                  style={{
                    background: '#ffffff',
                    border: '1px solid var(--border-color)',
                    borderRadius: '16px',
                    padding: '1.35rem',
                    boxShadow: 'var(--shadow-sm)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    {/* Clue Box */}
                    <div style={{
                      background: '#fffbeb',
                      border: '1px solid #fef3c7',
                      padding: '0.85rem',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.75rem',
                      marginBottom: '1.25rem'
                    }}>
                      <div style={{ background: '#f59e0b', color: '#fff', padding: '0.35rem', borderRadius: '8px' }}>
                        <Lightbulb size={16} />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#b45309', textTransform: 'uppercase' }}>YOUR CLUE</div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#78350f' }}>{w.clue}</div>
                      </div>
                    </div>

                    {/* Word Letters Display */}
                    <div style={{ marginBottom: '1rem' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                        TARGET WORD: <span style={{ color: '#10b981', fontWeight: 900 }}>{w.word}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        {(w.word || '').split('').map((char, cIdx) => (
                          <div
                            key={cIdx}
                            style={{
                              width: '38px',
                              height: '42px',
                              background: '#4f46e5',
                              color: '#fff',
                              borderRadius: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 900,
                              fontSize: '1.1rem',
                              boxShadow: '0 3px 6px rgba(79, 70, 229, 0.3)'
                            }}
                          >
                            {char}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Scrambled: <b>{w.scrambled || scrambleWord(w.word)}</b>
                    </span>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button
                        className="btn-icon"
                        title="Edit"
                        onClick={() => {
                          setEditingWordId(w.id);
                          setWordForm({
                            word: w.word,
                            clue: w.clue,
                            points: w.points || 200
                          });
                          setShowWordModal(true);
                        }}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        className="btn-icon"
                        title="Delete"
                        style={{ color: 'var(--danger)' }}
                        onClick={() => handleDeleteWord(w.id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* QUIZ QUESTION MODAL */}
      {showQuizModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '540px', margin: 0, boxShadow: 'var(--shadow-lg)' }}>
            <div className="card-header" style={{ marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
              <h3 className="card-title">{editingQuizId ? 'Edit Quiz Question' : 'Add Quiz Question'}</h3>
              <button className="btn-icon" onClick={() => setShowQuizModal(false)}>✕</button>
            </div>

            <form onSubmit={handleSaveQuiz}>
              <div className="form-group">
                <label className="form-label">Question Text *</label>
                <input
                  className="form-control"
                  placeholder="e.g. Who wrote 'Harry Potter'?"
                  value={quizForm.question}
                  onChange={e => setQuizForm({ ...quizForm, question: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Category</label>
                <input
                  className="form-control"
                  placeholder="e.g. Literature, Fiction, Mindset"
                  value={quizForm.category}
                  onChange={e => setQuizForm({ ...quizForm, category: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">4 Answer Options *</label>
                {quizForm.options.map((opt, i) => {
                  const isSelected = quizForm.correctIndex === i;
                  return (
                    <div 
                      key={i} 
                      onClick={() => setQuizForm({ ...quizForm, correctIndex: i })}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.75rem', 
                        marginBottom: '0.65rem',
                        padding: '0.35rem 0.6rem',
                        borderRadius: '10px',
                        border: isSelected ? '2px solid #10b981' : '1px solid #e2e8f0',
                        background: isSelected ? '#ecfdf5' : '#ffffff',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <input
                        type="radio"
                        id={`quiz_opt_radio_${i}`}
                        name="quizModalCorrectAnswer"
                        checked={isSelected}
                        onChange={() => setQuizForm({ ...quizForm, correctIndex: i })}
                        style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: '#10b981' }}
                      />
                      <input
                        className="form-control"
                        placeholder={`Option ${i + 1}`}
                        value={opt}
                        onClick={e => e.stopPropagation()}
                        onChange={e => {
                          const newOptions = [...quizForm.options];
                          newOptions[i] = e.target.value;
                          setQuizForm({ ...quizForm, options: newOptions });
                        }}
                        style={{ 
                          border: isSelected ? '1px solid #10b981' : '1px solid #cbd5e1',
                          background: '#ffffff'
                        }}
                        required
                      />
                      {isSelected ? (
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#10b981', whiteSpace: 'nowrap' }}>
                          ✓ Correct
                        </span>
                      ) : null}
                    </div>
                  );
                })}
                <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                  ● Click any radio button or option box to mark it as the correct answer.
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowQuizModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Question</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WORD SCRAMBLE MODAL */}
      {showWordModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '480px', margin: 0, boxShadow: 'var(--shadow-lg)' }}>
            <div className="card-header" style={{ marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
              <h3 className="card-title">{editingWordId ? 'Edit Word Puzzle' : 'Add Word Scramble Puzzle'}</h3>
              <button className="btn-icon" onClick={() => setShowWordModal(false)}>✕</button>
            </div>

            <form onSubmit={handleSaveWord}>
              <div className="form-group">
                <label className="form-label">Target Word * (Single word only)</label>
                <input
                  className="form-control"
                  placeholder="e.g. THEME"
                  value={wordForm.word}
                  onChange={e => setWordForm({ ...wordForm, word: e.target.value.replace(/\s+/g, '').toUpperCase() })}
                  required
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Enter one word for users to unscramble.</span>
              </div>

              <div className="form-group">
                <label className="form-label">Clue Description *</label>
                <textarea
                  className="form-control"
                  rows="3"
                  placeholder="e.g. The main idea or underlying meaning in a story"
                  value={wordForm.clue}
                  onChange={e => setWordForm({ ...wordForm, clue: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowWordModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ background: '#4f46e5' }}>Save Word Puzzle</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
