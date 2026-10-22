import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Users, 
  MessageSquare, 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Plus, 
  Search, 
  Filter, 
  Trash2, 
  ExternalLink, 
  Tag, 
  Sparkles, 
  Calendar, 
  User, 
  Mail, 
  Eye, 
  X, 
  AlertCircle,
  Check,
  Send,
  MessageCircle,
  Hash,
  Globe,
  BookOpen,
  LayoutGrid,
  List,
  UploadCloud,
  Loader2,
  Link as LinkIcon,
  Layers
} from 'lucide-react';
import { sanitizeImageUrl } from '../utils/imageHelper';
import { 
  db, 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  serverTimestamp, 
  query, 
  orderBy,
  onSnapshot,
  storage,
  ref,
  uploadBytes,
  getDownloadURL
} from '../firebase';

export default function CommunityGroupsPage({ 
  communityGroups = [], 
  usersList = [], 
  books = [] 
}) {
  const fileInputRef = useRef(null);

  // Dedicated filters: type, status, book, category, search
  const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'global' | 'bookwise'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'approved' | 'pending' | 'rejected'
  const [selectedBookFilter, setSelectedBookFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  
  // Inspection Modal states
  const [viewingGroup, setViewingGroup] = useState(null);
  const [groupMembers, setGroupMembers] = useState([]);
  const [groupMessages, setGroupMessages] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState('chat'); // 'info' | 'members' | 'chat'
  const [adminChatMessage, setAdminChatMessage] = useState('');
  const [sendingChat, setSendingChat] = useState(false);
  const chatScrollRef = useRef(null);

  // Create Group Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  
  // Creation Form Options: 2 Options (Global vs Book-wise)
  const [communityType, setCommunityType] = useState('GLOBAL'); // 'GLOBAL' | 'BOOK'
  const [selectedBookId, setSelectedBookId] = useState('');
  const [bookSearchQuery, setBookSearchQuery] = useState('');
  const [useUrlInput, setUseUrlInput] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const [newGroupForm, setNewGroupForm] = useState({
    name: '',
    description: '',
    category: 'Fiction',
    tags: '#reading, #bookclub',
    bannerImage: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=800',
    bannerFile: null,
    previewBanner: '',
    iconBg: '#ff7f00'
  });

  // Action status
  const [updatingId, setUpdatingId] = useState(null);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set();
    communityGroups.forEach(g => { if (g.category) set.add(g.category); });
    return ['All', ...Array.from(set)];
  }, [communityGroups]);

  // Books filtered for selector
  const selectableBooks = useMemo(() => {
    if (!bookSearchQuery.trim()) return books;
    const q = bookSearchQuery.toLowerCase();
    return books.filter(b => 
      (b.title || '').toLowerCase().includes(q) ||
      (b.author || '').toLowerCase().includes(q) ||
      (b.category || '').toLowerCase().includes(q)
    );
  }, [books, bookSearchQuery]);

  // Currently selected book object
  const selectedBook = useMemo(() => {
    return books.find(b => b.id === selectedBookId) || null;
  }, [books, selectedBookId]);

  // Statistics
  const stats = useMemo(() => {
    const total = communityGroups.length;
    const globalCount = communityGroups.filter(g => g.type === 'GLOBAL' || (!g.bookId && g.type !== 'BOOK')).length;
    const bookWiseCount = communityGroups.filter(g => g.type === 'BOOK' || !!g.bookId).length;
    const approved = communityGroups.filter(g => (g.status || '').toUpperCase() === 'APPROVED').length;
    const pending = communityGroups.filter(g => (g.status || '').toUpperCase() === 'PENDING').length;
    const rejected = communityGroups.filter(g => (g.status || '').toUpperCase() === 'REJECTED').length;
    
    const totalMembers = communityGroups.reduce((acc, g) => {
      const num = Number(g.numericMembers) || parseInt(g.membersCount) || 1;
      return acc + (isNaN(num) ? 1 : num);
    }, 0);

    return { total, globalCount, bookWiseCount, approved, pending, rejected, totalMembers };
  }, [communityGroups]);

  // Books available for filtering
  const bookFilterOptions = useMemo(() => {
    const list = [];
    const seen = new Set();
    communityGroups.forEach(g => {
      if ((g.type === 'BOOK' || g.bookId) && (g.bookTitle || g.bookId)) {
        const id = g.bookId || g.id;
        if (!seen.has(id)) {
          seen.add(id);
          list.push({ id, title: g.bookTitle || g.name });
        }
      }
    });
    books.forEach(b => {
      if (!seen.has(b.id)) {
        seen.add(b.id);
        list.push({ id: b.id, title: b.title });
      }
    });
    return list;
  }, [communityGroups, books]);

  // Filtered groups using decoupled filters
  const filteredGroups = useMemo(() => {
    return communityGroups.filter(g => {
      const status = (g.status || 'PENDING').toUpperCase();
      const isBookWise = g.type === 'BOOK' || !!g.bookId;
      const isGlobal = g.type === 'GLOBAL' || (!g.bookId && g.type !== 'BOOK');
      const term = searchTerm.toLowerCase().trim();

      // 1. Community Type Filter (Global vs Book-Wise)
      if (typeFilter === 'global' && !isGlobal) return false;
      if (typeFilter === 'bookwise' && !isBookWise) return false;

      // 2. Status Filter
      if (statusFilter === 'approved' && status !== 'APPROVED') return false;
      if (statusFilter === 'pending' && status !== 'PENDING') return false;
      if (statusFilter === 'rejected' && status !== 'REJECTED') return false;

      // 3. Specific Book Filter
      if (selectedBookFilter !== 'all') {
        const matchesBook = (g.bookId === selectedBookFilter) || ((g.bookTitle || '').toLowerCase() === selectedBookFilter.toLowerCase());
        if (!matchesBook) return false;
      }

      // 4. Category Filter
      if (selectedCategory !== 'All' && g.category !== selectedCategory) return false;

      // 5. Search Text
      if (term) {
        const name = (g.name || '').toLowerCase();
        const desc = (g.description || '').toLowerCase();
        const bTitle = (g.bookTitle || '').toLowerCase();
        const bAuthor = (g.bookAuthor || '').toLowerCase();
        const creator = (g.creatorName || '').toLowerCase();
        const creatorEmail = (g.creatorEmail || '').toLowerCase();
        const tags = Array.isArray(g.tags) ? g.tags.join(' ').toLowerCase() : '';

        const matches = name.includes(term) || 
          desc.includes(term) ||
          bTitle.includes(term) ||
          bAuthor.includes(term) ||
          creator.includes(term) ||
          creatorEmail.includes(term) ||
          tags.includes(term);

        if (!matches) return false;
      }

      return true;
    });
  }, [communityGroups, typeFilter, statusFilter, selectedBookFilter, selectedCategory, searchTerm]);

  // Handle book selection in Book-wise mode
  const handleSelectBook = (bookId) => {
    setSelectedBookId(bookId);
    const bk = books.find(b => b.id === bookId);
    if (bk) {
      setNewGroupForm(prev => ({
        ...prev,
        name: `${bk.title} Readers Club`,
        category: bk.category || 'Fiction',
        description: `Official reader community and discussion club for "${bk.title}" by ${bk.author || 'Author'}. Share chapter reflections, notes, and discussion topics.`,
        tags: `#${(bk.title || 'book').replace(/[^a-zA-Z0-9]/g, '')}, #bookclub, #${(bk.category || 'reading').replace(/\s+/g, '')}`,
        bannerImage: bk.cover || prev.bannerImage,
        previewBanner: bk.cover || prev.previewBanner
      }));
    }
  };

  // Real-time messages listener when viewing a group
  useEffect(() => {
    if (!viewingGroup?.id) {
      setGroupMessages([]);
      return;
    }

    const messagesRef = collection(db, 'community_groups', viewingGroup.id, 'messages');
    const unsubscribe = onSnapshot(messagesRef, (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => {
        const timeA = a.timestamp?.seconds || a.createdAt?.seconds || (new Date(a.timestamp || a.createdAt || 0).getTime() / 1000) || 0;
        const timeB = b.timestamp?.seconds || b.createdAt?.seconds || (new Date(b.timestamp || b.createdAt || 0).getTime() / 1000) || 0;
        return timeA - timeB;
      });
      setGroupMessages(list);
      setLoadingDetails(false);
    }, (err) => {
      console.warn('Real-time messages listener warning:', err);
    });

    return () => unsubscribe();
  }, [viewingGroup?.id]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (activeModalTab === 'chat' && chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [groupMessages, activeModalTab]);

  // Open modal for details
  const handleOpenGroupDetails = async (group, initialTab = 'chat') => {
    setViewingGroup(group);
    setActiveModalTab(initialTab);
    setLoadingDetails(true);

    // 1. Fetch Members subcollection
    try {
      const membersRef = collection(db, 'community_groups', group.id, 'members');
      const membersSnap = await getDocs(membersRef);
      const membersList = membersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setGroupMembers(membersList);

      // Auto-sync member count in Firestore document if mismatched
      if (membersList.length > 0 && Number(group.numericMembers) !== membersList.length) {
        try {
          await updateDoc(doc(db, 'community_groups', group.id), {
            numericMembers: membersList.length,
            membersCount: `${membersList.length} members`
          });
          setViewingGroup(prev => prev && prev.id === group.id ? {
            ...prev,
            numericMembers: membersList.length,
            membersCount: `${membersList.length} members`
          } : prev);
        } catch (syncErr) {
          console.warn('Auto-sync member count warning:', syncErr);
        }
      }
    } catch (err) {
      console.warn('Error fetching group members:', err);
      setGroupMembers([]);
    }

    // 2. Fetch Messages subcollection (without orderBy so missing timestamp never breaks)
    try {
      const messagesRef = collection(db, 'community_groups', group.id, 'messages');
      const messagesSnap = await getDocs(messagesRef);
      const messagesList = messagesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      messagesList.sort((a, b) => {
        const timeA = a.timestamp?.seconds || a.createdAt?.seconds || (new Date(a.timestamp || a.createdAt || 0).getTime() / 1000) || 0;
        const timeB = b.timestamp?.seconds || b.createdAt?.seconds || (new Date(b.timestamp || b.createdAt || 0).getTime() / 1000) || 0;
        return timeA - timeB;
      });
      setGroupMessages(messagesList);
    } catch (err) {
      console.warn('Error fetching group messages:', err);
      setGroupMessages([]);
    } finally {
      setLoadingDetails(false);
    }
  };

  // Send an Admin message into the community group chat
  const handleSendAdminMessage = async (e) => {
    if (e) e.preventDefault();
    if (!adminChatMessage.trim() || !viewingGroup?.id || sendingChat) return;

    const textToSend = adminChatMessage.trim();
    setSendingChat(true);

    try {
      const messagesRef = collection(db, 'community_groups', viewingGroup.id, 'messages');
      await addDoc(messagesRef, {
        text: textToSend,
        senderName: 'Admin (Bookkaboo)',
        senderRole: 'Admin',
        senderId: 'system-admin',
        senderAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
        timestamp: serverTimestamp(),
        chatType: 'group',
        groupId: viewingGroup.id
      });
      setAdminChatMessage('');
      setTimeout(() => {
        if (chatScrollRef.current) {
          chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
        }
      }, 100);
    } catch (err) {
      alert('Error sending admin message: ' + err.message);
    } finally {
      setSendingChat(false);
    }
  };

  // Update status (Approve / Reject)
  const handleUpdateStatus = async (groupId, newStatus) => {
    setUpdatingId(groupId);
    try {
      const groupRef = doc(db, 'community_groups', groupId);
      await updateDoc(groupRef, {
        status: newStatus,
        approvedAt: newStatus === 'APPROVED' ? serverTimestamp() : null,
        updatedAt: serverTimestamp()
      });

      if (viewingGroup && viewingGroup.id === groupId) {
        setViewingGroup(prev => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      alert('Error updating group status: ' + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  // Delete Group
  const handleDeleteGroup = async (id) => {
    if (!confirm('Are you sure you want to permanently delete this community group?')) return;
    try {
      await deleteDoc(doc(db, 'community_groups', id));
      if (viewingGroup && viewingGroup.id === id) {
        setViewingGroup(null);
      }
    } catch (err) {
      alert('Error deleting group: ' + err.message);
    }
  };

  // Handle file select for banner upload
  const handleBannerSelect = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (PNG, JPG, WEBP).');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('Image size exceeds 10MB limit.');
      return;
    }

    setNewGroupForm(prev => ({
      ...prev,
      bannerFile: file,
      previewBanner: URL.createObjectURL(file)
    }));
  };

  // Create new group handler (Supports both GLOBAL and BOOK-WISE)
  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroupForm.name.trim() || !newGroupForm.description.trim()) {
      alert('Please fill in group name and description.');
      return;
    }

    if (communityType === 'BOOK' && !selectedBookId) {
      alert('Please select a book from the catalog for this Book-wise community.');
      return;
    }

    setCreating(true);
    try {
      let finalBannerUrl = newGroupForm.bannerImage || 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=800';

      // If local image file was uploaded, upload to Firebase Storage
      if (newGroupForm.bannerFile) {
        try {
          const cleanName = newGroupForm.bannerFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
          const storageRef = ref(storage, `community_banners/${Date.now()}_${cleanName}`);
          const snapshot = await uploadBytes(storageRef, newGroupForm.bannerFile);
          finalBannerUrl = await getDownloadURL(snapshot.ref);
        } catch (storageErr) {
          console.warn('Firebase Storage banner upload fallback:', storageErr);
          finalBannerUrl = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(newGroupForm.bannerFile);
          });
        }
      }

      const parsedTags = (newGroupForm.tags || '')
        .split(',')
        .map(t => t.trim())
        .filter(Boolean)
        .map(t => t.startsWith('#') ? t : `#${t}`);

      const groupPayload = {
        name: newGroupForm.name.trim(),
        description: newGroupForm.description.trim(),
        category: newGroupForm.category || 'General',
        tags: parsedTags,
        type: communityType, // 'GLOBAL' or 'BOOK'
        bookId: communityType === 'BOOK' ? (selectedBook?.id || selectedBookId) : null,
        bookTitle: communityType === 'BOOK' ? (selectedBook?.title || '') : null,
        bookAuthor: communityType === 'BOOK' ? (selectedBook?.author || '') : null,
        bookCover: communityType === 'BOOK' ? (selectedBook?.cover || '') : null,
        bannerImage: finalBannerUrl,
        coverImage: finalBannerUrl,
        icon: communityType === 'BOOK' ? 'book' : 'globe',
        iconBg: newGroupForm.iconBg || '#ff7f00',
        status: 'APPROVED',
        numericMembers: 1,
        membersCount: '1 member',
        creatorId: 'system-admin',
        creatorName: 'Bookkaboo Admin',
        creatorEmail: 'admin@bookkaboo.com',
        creatorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        createdAt: serverTimestamp(),
        approvedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(collection(db, 'community_groups'), groupPayload);

      alert(`✅ ${communityType === 'BOOK' ? 'Book-Wise' : 'Global'} Community Group created successfully!`);
      setShowCreateModal(false);
      setCommunityType('GLOBAL');
      setSelectedBookId('');
      setNewGroupForm({
        name: '',
        description: '',
        category: 'Fiction',
        tags: '#reading, #bookclub',
        bannerImage: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=800',
        bannerFile: null,
        previewBanner: '',
        iconBg: '#ff7f00'
      });
    } catch (err) {
      console.error('Error creating group:', err);
      alert('Error creating group: ' + err.message);
    } finally {
      setCreating(false);
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
    return 'Recently';
  };

  const formatDateTime = (val) => {
    if (!val) return '—';
    try {
      if (val.toDate && typeof val.toDate === 'function') {
        return val.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
      }
      if (val.seconds) {
        return new Date(val.seconds * 1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
      }
      const d = new Date(val);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
      }
    } catch (e) {}
    return 'Just now';
  };

  return (
    <div>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-dark)', margin: 0 }}>Community Groups & Clubs</h2>
            <span className="badge badge-info" style={{ fontSize: '0.75rem' }}>Live Database</span>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Manage Global Discussion Clubs & Book-Wise Communities with live chat and member moderation
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => {
            setShowCreateModal(true);
            setCommunityType('GLOBAL');
          }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.25rem', fontWeight: 700 }}
        >
          <Plus size={18} /> + Create Community Group
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '1.75rem' }}>
        {/* Total Groups */}
        <div className="card" style={{ padding: '1.25rem', marginBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>TOTAL GROUPS</span>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
              <Users size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-dark)' }}>{stats.total}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            {stats.totalMembers.toLocaleString()} total members joined
          </div>
        </div>

        {/* Global Clubs */}
        <div className="card" style={{ padding: '1.25rem', marginBottom: 0, cursor: 'pointer', border: typeFilter === 'global' ? '2px solid #0284c7' : '1px solid #e2e8f0' }} onClick={() => { setTypeFilter('global'); setStatusFilter('all'); setSelectedBookFilter('all'); }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>GLOBAL CLUBS</span>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7' }}>
              <Globe size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0284c7' }}>{stats.globalCount}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Click to view open topic & genre forums</div>
        </div>

        {/* Book-wise Clubs */}
        <div className="card" style={{ padding: '1.25rem', marginBottom: 0, cursor: 'pointer', border: typeFilter === 'bookwise' ? '2px solid #059669' : '1px solid #e2e8f0' }} onClick={() => { setTypeFilter('bookwise'); setStatusFilter('all'); }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>BOOK-WISE CLUBS</span>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
              <BookOpen size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#059669' }}>{stats.bookWiseCount}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Click to view book-specific clubs</div>
        </div>

        {/* Pending Moderation */}
        <div className="card" style={{ padding: '1.25rem', marginBottom: 0, cursor: 'pointer', border: statusFilter === 'pending' ? '2px solid #f59e0b' : '1px solid #e2e8f0' }} onClick={() => setStatusFilter('pending')}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>PENDING MODERATION</span>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
              <Clock size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: stats.pending > 0 ? '#f59e0b' : 'var(--text-dark)' }}>
            {stats.pending}
          </div>
          <div style={{ fontSize: '0.75rem', color: stats.pending > 0 ? '#ef4444' : 'var(--text-muted)', marginTop: '0.2rem', fontWeight: stats.pending > 0 ? 700 : 400 }}>
            {stats.pending > 0 ? '⚠️ Click to review pending clubs' : 'All clubs approved'}
          </div>
        </div>
      </div>

      {/* Main Card with Dedicated Filters */}
      <div className="card">
        {/* Row 1: Primary Community Type Filters and Moderation Status */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem' }}>
          
          {/* Community Type Filter Tabs (Global vs Book-Wise) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginRight: '2px' }}>
              TYPE:
            </span>
            <button
              type="button"
              onClick={() => { setTypeFilter('all'); setSelectedBookFilter('all'); }}
              style={{
                padding: '0.45rem 0.95rem',
                borderRadius: '8px',
                border: typeFilter === 'all' ? '1px solid var(--primary)' : '1px solid #e2e8f0',
                fontSize: '0.825rem',
                fontWeight: 700,
                cursor: 'pointer',
                background: typeFilter === 'all' ? 'var(--primary)' : '#ffffff',
                color: typeFilter === 'all' ? '#fff' : 'var(--text-dark)',
                transition: 'all 0.15s ease'
              }}
            >
              All Types ({stats.total})
            </button>
            <button
              type="button"
              onClick={() => { setTypeFilter('global'); setSelectedBookFilter('all'); }}
              style={{
                padding: '0.45rem 0.95rem',
                borderRadius: '8px',
                border: typeFilter === 'global' ? '1px solid #0284c7' : '1px solid #e2e8f0',
                fontSize: '0.825rem',
                fontWeight: 700,
                cursor: 'pointer',
                background: typeFilter === 'global' ? '#0284c7' : '#ffffff',
                color: typeFilter === 'global' ? '#fff' : '#0284c7',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                transition: 'all 0.15s ease'
              }}
            >
              <Globe size={14} /> 🌐 Global Communities ({stats.globalCount})
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('bookwise')}
              style={{
                padding: '0.45rem 0.95rem',
                borderRadius: '8px',
                border: typeFilter === 'bookwise' ? '1px solid #059669' : '1px solid #e2e8f0',
                fontSize: '0.825rem',
                fontWeight: 700,
                cursor: 'pointer',
                background: typeFilter === 'bookwise' ? '#059669' : '#ffffff',
                color: typeFilter === 'bookwise' ? '#fff' : '#059669',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                transition: 'all 0.15s ease'
              }}
            >
              <BookOpen size={14} /> 📖 Book Communities ({stats.bookWiseCount})
            </button>
          </div>

          {/* Moderation Status Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginRight: '2px' }}>
              STATUS:
            </span>
            {[
              { id: 'all', label: 'All Status' },
              { id: 'approved', label: `Approved (${stats.approved})` },
              { id: 'pending', label: `Pending (${stats.pending})`, alert: stats.pending > 0 },
              { id: 'rejected', label: `Rejected (${stats.rejected})` }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                style={{
                  padding: '0.4rem 0.75rem',
                  borderRadius: '6px',
                  border: statusFilter === tab.id ? '1px solid #0f172a' : '1px solid #e2e8f0',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: statusFilter === tab.id ? '#0f172a' : '#f8fafc',
                  color: statusFilter === tab.id ? '#fff' : 'var(--text-muted)',
                  transition: 'all 0.15s ease'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Row 2: Secondary Controls: Search, Type dropdown, Book selector dropdown, Genre dropdown, Reset, View Mode */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap', flex: 1 }}>
            
            {/* Search Box */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#f8fafc', padding: '0.4rem 0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', minWidth: '220px' }}>
              <Search size={14} color="var(--text-muted)" />
              <input
                type="text"
                placeholder="Search club, book title, author, creator..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '0.825rem' }}
              />
              {searchTerm && (
                <button type="button" onClick={() => setSearchTerm('')} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}>
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Type Selector Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#f8fafc', padding: '0.35rem 0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              {typeFilter === 'bookwise' ? <BookOpen size={14} color="#059669" /> : typeFilter === 'global' ? <Globe size={14} color="#0284c7" /> : <Layers size={14} color="var(--primary)" />}
              <select
                value={typeFilter}
                onChange={e => {
                  setTypeFilter(e.target.value);
                  if (e.target.value !== 'bookwise') setSelectedBookFilter('all');
                }}
                style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-dark)', cursor: 'pointer' }}
              >
                <option value="all">👥 Filter: All Types</option>
                <option value="global">🌐 Filter: Global Communities</option>
                <option value="bookwise">📖 Filter: Book Communities</option>
              </select>
            </div>

            {/* Filter by Specific Book (Shown when Book-wise or when All) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#f8fafc', padding: '0.35rem 0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <BookOpen size={14} color="#059669" />
              <select
                value={selectedBookFilter}
                onChange={e => {
                  setSelectedBookFilter(e.target.value);
                  if (e.target.value !== 'all') setTypeFilter('bookwise');
                }}
                style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-dark)', cursor: 'pointer', maxWidth: '210px' }}
              >
                <option value="all">📚 Filter by Book (All)</option>
                {bookFilterOptions.map(b => (
                  <option key={b.id} value={b.id}>{b.title}</option>
                ))}
              </select>
            </div>

            {/* Category / Genre Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#f8fafc', padding: '0.35rem 0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <Filter size={14} color="var(--primary)" />
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-dark)', cursor: 'pointer' }}
              >
                {categories.map(c => (
                  <option key={c} value={c}>{c === 'All' ? '🏷️ All Genres' : c}</option>
                ))}
              </select>
            </div>

            {/* Reset Filters button if any active */}
            {(typeFilter !== 'all' || statusFilter !== 'all' || selectedBookFilter !== 'all' || selectedCategory !== 'All' || searchTerm) && (
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => {
                  setTypeFilter('all');
                  setStatusFilter('all');
                  setSelectedBookFilter('all');
                  setSelectedCategory('All');
                  setSearchTerm('');
                }}
                style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem', color: 'var(--primary)', borderColor: 'var(--primary-light)' }}
              >
                Reset Filters
              </button>
            )}
          </div>

          {/* View Mode Toggle (Grid vs Table) */}
          <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '8px', padding: '2px' }}>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              title="Grid Cards"
              style={{
                border: 'none',
                background: viewMode === 'grid' ? '#fff' : 'transparent',
                color: viewMode === 'grid' ? 'var(--primary)' : 'var(--text-muted)',
                borderRadius: '6px',
                padding: '5px 8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                boxShadow: viewMode === 'grid' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none'
              }}
            >
              <LayoutGrid size={15} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              title="Table View"
              style={{
                border: 'none',
                background: viewMode === 'table' ? '#fff' : 'transparent',
                color: viewMode === 'table' ? 'var(--primary)' : 'var(--text-muted)',
                borderRadius: '6px',
                padding: '5px 8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                boxShadow: viewMode === 'table' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none'
              }}
            >
              <List size={15} />
            </button>
          </div>
        </div>

        {/* Content Display: Grid Cards vs Table */}
        {filteredGroups.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-muted)' }}>
            <Users size={40} color="var(--text-light)" style={{ margin: '0 auto 0.75rem', display: 'block' }} />
            <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-dark)' }}>No community groups found</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Try adjusting your tab filter or search query.
            </div>
          </div>
        ) : viewMode === 'table' ? (
          /* Table View */
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th style={{ width: '45px' }}>#</th>
                  <th>Community Club</th>
                  <th>Type & Linked Book</th>
                  <th>Genre</th>
                  <th>Members</th>
                  <th>Creator</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredGroups.map((group, index) => {
                  const status = (group.status || 'PENDING').toUpperCase();
                  const isApproved = status === 'APPROVED';
                  const isPending = status === 'PENDING';
                  const isBookWise = group.type === 'BOOK' || !!group.bookId;
                  const banner = sanitizeImageUrl(group.bannerImage, 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=800');

                  return (
                    <tr key={group.id}>
                      <td>{index + 1}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <img
                            src={banner}
                            alt={group.name}
                            style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #e2e8f0', flexShrink: 0 }}
                            onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=800'; }}
                          />
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-dark)' }}>
                              {group.name}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '240px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {group.description || 'No description'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        {isBookWise ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 700, color: '#059669', background: '#ecfdf5', padding: '0.15rem 0.5rem', borderRadius: '4px', width: 'fit-content' }}>
                              <BookOpen size={11} /> Book Club
                            </span>
                            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-dark)' }}>
                              {group.bookTitle || 'Attached Book'}
                            </span>
                          </div>
                        ) : (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 700, color: '#0284c7', background: '#e0f2fe', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                            <Globe size={11} /> Global Club
                          </span>
                        )}
                      </td>
                      <td>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-dark)' }}>
                          {group.category || 'General'}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700 }}>
                        {group.membersCount || `${group.numericMembers || 1} members`}
                      </td>
                      <td>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{group.creatorName || 'Admin'}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{formatDate(group.createdAt)}</div>
                      </td>
                      <td>
                        <span className={`badge ${isApproved ? 'badge-success' : isPending ? 'badge-warning' : 'badge-danger'}`}>
                          ● {status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                          <button
                            className="btn btn-outline"
                            style={{ fontSize: '0.75rem', padding: '0.25rem 0.55rem', gap: '0.3rem' }}
                            onClick={() => handleOpenGroupDetails(group, 'info')}
                          >
                            <Eye size={12} /> Inspect
                          </button>
                          <button
                            className="btn-icon"
                            style={{ color: 'var(--danger)' }}
                            title="Delete Group"
                            onClick={() => handleDeleteGroup(group.id)}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* Grid Card View */
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: '1.25rem' }}>
            {filteredGroups.map(group => {
              const status = (group.status || 'PENDING').toUpperCase();
              const isApproved = status === 'APPROVED';
              const isPending = status === 'PENDING';
              const isBookWise = group.type === 'BOOK' || !!group.bookId;
              const banner = sanitizeImageUrl(group.bannerImage, 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=800');

              return (
                <div
                  key={group.id}
                  style={{
                    background: '#ffffff',
                    borderRadius: '12px',
                    border: isPending ? '2px solid #f59e0b' : '1px solid #e2e8f0',
                    boxShadow: 'var(--shadow-sm)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    position: 'relative'
                  }}
                >
                  {/* Banner Image & Status Header */}
                  <div style={{ position: 'relative', height: '115px', background: '#1e293b' }}>
                    <img
                      src={banner}
                      alt={group.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }}
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=800';
                      }}
                    />

                    {/* Top Badges: Status and Community Type */}
                    <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', gap: '0.4rem' }}>
                      {isBookWise ? (
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '0.2rem 0.55rem', borderRadius: '12px', background: '#059669', color: '#fff', display: 'inline-flex', alignItems: 'center', gap: '4px', boxShadow: '0 2px 4px rgba(0,0,0,0.25)' }}>
                          <BookOpen size={11} /> Book Club
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '0.2rem 0.55rem', borderRadius: '12px', background: '#0284c7', color: '#fff', display: 'inline-flex', alignItems: 'center', gap: '4px', boxShadow: '0 2px 4px rgba(0,0,0,0.25)' }}>
                          <Globe size={11} /> Global Club
                        </span>
                      )}
                    </div>

                    <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
                      <span
                        className={isApproved ? 'badge badge-success' : isPending ? 'badge badge-warning' : 'badge badge-danger'}
                        style={{ fontSize: '0.7rem', fontWeight: 800, padding: '0.25rem 0.6rem', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}
                      >
                        ● {status}
                      </span>
                    </div>

                    <div style={{ position: 'absolute', bottom: '10px', left: '12px', background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', padding: '0.2rem 0.6rem', borderRadius: '14px', fontSize: '0.75rem', color: '#fff', fontWeight: 600 }}>
                      {group.category || 'General'}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      {/* Linked Book banner if Book-wise */}
                      {isBookWise && group.bookTitle && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#ecfdf5', padding: '0.4rem 0.65rem', borderRadius: '6px', border: '1px solid #a7f3d0', marginBottom: '0.65rem' }}>
                          <BookOpen size={13} color="#059669" />
                          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#065f46', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            Book: {group.bookTitle}
                          </span>
                        </div>
                      )}

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-dark)', margin: 0 }}>
                          {group.name}
                        </h3>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', background: 'var(--primary-light)', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                          {group.membersCount || `${group.numericMembers || 1} members`}
                        </span>
                      </div>

                      <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', lineHeight: 1.45, marginBottom: '0.85rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {group.description || 'No description provided.'}
                      </p>

                      {/* Tags */}
                      {Array.isArray(group.tags) && group.tags.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.85rem' }}>
                          {group.tags.map((tag, idx) => (
                            <span key={idx} style={{ fontSize: '0.7rem', color: '#64748b', background: '#f1f5f9', padding: '0.15rem 0.45rem', borderRadius: '4px', fontWeight: 600 }}>
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Creator Info */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.65rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9', marginBottom: '0.85rem' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: isBookWise ? '#059669' : 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.75rem' }}>
                          {(group.creatorName || 'U').slice(0, 2).toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-dark)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            Created by: {group.creatorName || 'Admin'}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {group.creatorEmail || formatDate(group.createdAt)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9' }}>
                      <button
                        className="btn btn-outline"
                        style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', gap: '0.4rem', flex: 1 }}
                        onClick={() => handleOpenGroupDetails(group, 'chat')}
                      >
                        <MessageCircle size={14} /> View Details & Chat
                      </button>

                      {isPending ? (
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button
                            className="btn btn-success"
                            style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem', gap: '0.3rem' }}
                            disabled={updatingId === group.id}
                            onClick={() => handleUpdateStatus(group.id, 'APPROVED')}
                          >
                            <Check size={14} /> Approve
                          </button>
                          <button
                            className="btn btn-danger"
                            style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem', gap: '0.3rem' }}
                            disabled={updatingId === group.id}
                            onClick={() => handleUpdateStatus(group.id, 'REJECTED')}
                          >
                            <X size={14} /> Reject
                          </button>
                        </div>
                      ) : (
                        <button
                          className="btn-icon"
                          style={{ color: 'var(--danger)' }}
                          title="Delete Group"
                          onClick={() => handleDeleteGroup(group.id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CREATE COMMUNITY GROUP MODAL (WITH 2 OPTIONS: BOOK-WISE vs GLOBAL) */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '14px',
            maxWidth: '580px',
            width: '100%',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            maxHeight: '92vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Plus size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-dark)' }}>Create Community Club</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>Publish a new reader community to the platform</p>
                </div>
              </div>
              <button
                type="button"
                className="btn-icon"
                onClick={() => setShowCreateModal(false)}
                style={{ padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleCreateGroup} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                
                {/* 2 OPTIONS SELECTOR: GLOBAL COMMUNITY VS BOOK-WISE COMMUNITY */}
                <div>
                  <label className="form-label" style={{ fontWeight: 800, marginBottom: '0.5rem' }}>
                    Select Community Type *
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    {/* Option 1: Global Community */}
                    <div
                      onClick={() => setCommunityType('GLOBAL')}
                      style={{
                        padding: '1rem',
                        borderRadius: '10px',
                        border: `2px solid ${communityType === 'GLOBAL' ? 'var(--primary)' : '#e2e8f0'}`,
                        background: communityType === 'GLOBAL' ? 'var(--primary-light)' : '#f8fafc',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        position: 'relative'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <Globe size={18} color={communityType === 'GLOBAL' ? 'var(--primary)' : 'var(--text-muted)'} />
                        <span style={{ fontWeight: 800, fontSize: '0.9rem', color: communityType === 'GLOBAL' ? 'var(--primary)' : 'var(--text-dark)' }}>
                          Global Club
                        </span>
                      </div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.35 }}>
                        Open discussion club for general genres, themes, and reading goals
                      </p>
                      {communityType === 'GLOBAL' && (
                        <div style={{ position: 'absolute', top: '8px', right: '8px', width: 18, height: 18, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Check size={11} strokeWidth={3} />
                        </div>
                      )}
                    </div>

                    {/* Option 2: Book-wise Community */}
                    <div
                      onClick={() => setCommunityType('BOOK')}
                      style={{
                        padding: '1rem',
                        borderRadius: '10px',
                        border: `2px solid ${communityType === 'BOOK' ? '#059669' : '#e2e8f0'}`,
                        background: communityType === 'BOOK' ? '#ecfdf5' : '#f8fafc',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        position: 'relative'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <BookOpen size={18} color={communityType === 'BOOK' ? '#059669' : 'var(--text-muted)'} />
                        <span style={{ fontWeight: 800, fontSize: '0.9rem', color: communityType === 'BOOK' ? '#059669' : 'var(--text-dark)' }}>
                          Book-Wise Club
                        </span>
                      </div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.35 }}>
                        Tied directly to a specific catalog book for chapter discussions
                      </p>
                      {communityType === 'BOOK' && (
                        <div style={{ position: 'absolute', top: '8px', right: '8px', width: 18, height: 18, borderRadius: '50%', background: '#059669', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Check size={11} strokeWidth={3} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* If Book-wise: Book Picker */}
                {communityType === 'BOOK' && (
                  <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid #cbd5e1' }}>
                    <label className="form-label" style={{ fontWeight: 800, color: '#065f46', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
                      <BookOpen size={15} /> Select Book From Catalog *
                    </label>

                    {/* Book search input */}
                    <div style={{ position: 'relative', marginBottom: '0.65rem' }}>
                      <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                      <input
                        type="text"
                        placeholder="Search books by title, author..."
                        className="form-control"
                        style={{ paddingLeft: '32px', fontSize: '0.825rem', height: '36px' }}
                        value={bookSearchQuery}
                        onChange={(e) => setBookSearchQuery(e.target.value)}
                      />
                    </div>

                    <select
                      className="form-control"
                      value={selectedBookId}
                      onChange={e => handleSelectBook(e.target.value)}
                      required={communityType === 'BOOK'}
                      style={{ fontWeight: 600 }}
                    >
                      <option value="">-- Choose a Book ({selectableBooks.length} available) --</option>
                      {selectableBooks.map(b => (
                        <option key={b.id} value={b.id}>
                          {b.title} — {b.author || 'Author'} ({b.category || 'General'})
                        </option>
                      ))}
                    </select>

                    {/* Selected Book Mini Preview */}
                    {selectedBook && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.75rem', padding: '0.65rem', background: '#ffffff', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
                        {selectedBook.cover ? (
                          <img
                            src={selectedBook.cover}
                            alt={selectedBook.title}
                            style={{ width: '42px', height: '56px', objectFit: 'cover', borderRadius: '4px' }}
                          />
                        ) : (
                          <div style={{ width: '42px', height: '56px', borderRadius: '4px', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <BookOpen size={18} color="#059669" />
                          </div>
                        )}
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#065f46' }}>{selectedBook.title}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>by {selectedBook.author || 'Author'} • {selectedBook.category || 'General'}</div>
                          <div style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 600, marginTop: '2px' }}>
                            {(Number(selectedBook.reads) || 0).toLocaleString()} platform reads
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Group Name */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 700 }}>Group / Club Name *</label>
                  <input
                    className="form-control"
                    placeholder="e.g. Science Fiction Explorers"
                    value={newGroupForm.name}
                    onChange={e => setNewGroupForm({ ...newGroupForm, name: e.target.value })}
                    required
                  />
                </div>

                {/* Category / Genre */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 700 }}>Genre / Category *</label>
                  <select
                    className="form-control"
                    value={newGroupForm.category}
                    onChange={e => setNewGroupForm({ ...newGroupForm, category: e.target.value })}
                  >
                    <option value="Fiction">Fiction</option>
                    <option value="Non-Fiction">Non-Fiction</option>
                    <option value="Self Help">Self Help</option>
                    <option value="Wellness">Wellness</option>
                    <option value="Business">Business</option>
                    <option value="Productivity">Productivity</option>
                    <option value="Kids">Kids</option>
                    <option value="Regional">Regional</option>
                    <option value="General">General</option>
                  </select>
                </div>

                {/* Description */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 700 }}>Description *</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    placeholder="Describe group themes, discussion rules, meeting schedules..."
                    value={newGroupForm.description}
                    onChange={e => setNewGroupForm({ ...newGroupForm, description: e.target.value })}
                    required
                    style={{ resize: 'vertical' }}
                  />
                </div>

                {/* Tags */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 700 }}>Tags (comma-separated)</label>
                  <input
                    className="form-control"
                    placeholder="#reading, #discussion, #bookclub"
                    value={newGroupForm.tags}
                    onChange={e => setNewGroupForm({ ...newGroupForm, tags: e.target.value })}
                  />
                </div>

                {/* Banner Image Upload / URL */}
                <div className="form-group" style={{ margin: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <label className="form-label" style={{ fontWeight: 700, margin: 0 }}>Club Banner / Cover Image</label>
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
                      <LinkIcon size={12} /> {useUrlInput ? 'Upload Image File' : 'Paste Direct URL'}
                    </button>
                  </div>

                  {useUrlInput ? (
                    <input
                      type="url"
                      className="form-control"
                      placeholder="https://images.unsplash.com/..."
                      value={newGroupForm.bannerImage}
                      onChange={e => setNewGroupForm({ ...newGroupForm, bannerImage: e.target.value, previewBanner: e.target.value })}
                    />
                  ) : (
                    <div>
                      <input
                        type="file"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        accept="image/*"
                        onChange={e => handleBannerSelect(e.target.files?.[0])}
                      />

                      {newGroupForm.previewBanner ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.65rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                          <img
                            src={newGroupForm.previewBanner}
                            alt="Preview"
                            style={{ width: '80px', height: '50px', objectFit: 'cover', borderRadius: '6px' }}
                          />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-dark)' }}>
                              {newGroupForm.bannerFile ? newGroupForm.bannerFile.name : 'Banner Attached'}
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                              <button
                                type="button"
                                className="btn btn-outline"
                                style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem' }}
                                onClick={() => fileInputRef.current?.click()}
                              >
                                Change
                              </button>
                              <button
                                type="button"
                                className="btn btn-outline"
                                style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem', color: 'var(--danger)', borderColor: '#fca5a5' }}
                                onClick={() => setNewGroupForm(prev => ({ ...prev, bannerFile: null, previewBanner: '', bannerImage: '' }))}
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
                          onDrop={(e) => {
                            e.preventDefault();
                            setDragOver(false);
                            handleBannerSelect(e.dataTransfer.files?.[0]);
                          }}
                          onClick={() => fileInputRef.current?.click()}
                          style={{
                            border: `2px dashed ${dragOver ? 'var(--primary)' : '#cbd5e1'}`,
                            background: dragOver ? 'var(--primary-light)' : '#f8fafc',
                            borderRadius: '10px',
                            padding: '1.25rem 1rem',
                            textAlign: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#fff', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.4rem', color: 'var(--primary)' }}>
                            <UploadCloud size={18} />
                          </div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-dark)' }}>
                            Click to upload or drag & drop banner
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            PNG, JPG, or WEBP (Max 10MB)
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', padding: '1rem 1.5rem', borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowCreateModal(false)}
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={creating}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1.5rem', fontWeight: 700 }}
                >
                  {creating ? (
                    <>
                      <Loader2 size={16} className="spin" /> Creating Club...
                    </>
                  ) : (
                    `Create ${communityType === 'BOOK' ? 'Book-Wise' : 'Global'} Group`
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GROUP DETAIL INSPECTION MODAL */}
      {viewingGroup && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '14px',
            width: '100%',
            maxWidth: '680px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '90vh'
          }}>
            {/* Modal Header Banner */}
            <div style={{ position: 'relative', height: '140px', background: '#1e293b' }}>
              <img
                src={sanitizeImageUrl(viewingGroup.bannerImage, 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=800')}
                alt={viewingGroup.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }}
                onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=800'; }}
              />

              <button
                onClick={() => setViewingGroup(null)}
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  background: 'rgba(0,0,0,0.6)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <X size={18} />
              </button>

              <div style={{ position: 'absolute', bottom: '12px', left: '16px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="badge badge-info" style={{ fontSize: '0.75rem', fontWeight: 800 }}>
                  {viewingGroup.category || 'General'}
                </span>
                <span className={`badge ${(viewingGroup.status || '').toUpperCase() === 'APPROVED' ? 'badge-success' : (viewingGroup.status || '').toUpperCase() === 'PENDING' ? 'badge-warning' : 'badge-danger'}`} style={{ fontSize: '0.75rem', fontWeight: 800 }}>
                  ● {(viewingGroup.status || 'PENDING').toUpperCase()}
                </span>
              </div>
            </div>

            {/* Modal Navigation Tabs */}
            {(() => {
              const effectiveCount = groupMembers.length > 0 
                ? groupMembers.length 
                : (Number(viewingGroup.numericMembers) || parseInt(viewingGroup.membersCount) || 1);

              return (
                <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', padding: '0 1rem' }}>
                  {[
                    { id: 'info', label: 'Group Information' },
                    { id: 'members', label: `Members (${effectiveCount})` },
                    { id: 'chat', label: `Discussion Chat (${groupMessages.length})` }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveModalTab(tab.id)}
                      style={{
                        padding: '0.75rem 1.15rem',
                        border: 'none',
                        background: 'transparent',
                        borderBottom: activeModalTab === tab.id ? '2px solid var(--primary)' : '2px solid transparent',
                        color: activeModalTab === tab.id ? 'var(--primary)' : 'var(--text-muted)',
                        fontWeight: 700,
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              );
            })()}

            {/* Modal Body */}
            <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
              {/* Tab 1: Info */}
              {activeModalTab === 'info' && (
                <div>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '0.5rem' }}>
                    {viewingGroup.name}
                  </h2>

                  {viewingGroup.bookTitle && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#ecfdf5', padding: '0.5rem 0.85rem', borderRadius: '6px', border: '1px solid #a7f3d0', marginBottom: '1rem' }}>
                      <BookOpen size={16} color="#059669" />
                      <div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#059669', display: 'block' }}>LINKED CATALOG BOOK</span>
                        <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#065f46' }}>{viewingGroup.bookTitle}</span>
                        {viewingGroup.bookAuthor && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}> by {viewingGroup.bookAuthor}</span>}
                      </div>
                    </div>
                  )}

                  <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
                    {viewingGroup.description || 'No description provided.'}
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1.25rem' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontWeight: 700 }}>CREATOR / OWNER</div>
                      <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-dark)' }}>{viewingGroup.creatorName || 'Admin'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{viewingGroup.creatorEmail || 'system@bookkaboo.com'}</div>
                    </div>

                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontWeight: 700 }}>CREATED DATE</div>
                      <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-dark)' }}>{formatDate(viewingGroup.createdAt)}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {groupMembers.length > 0 ? `${groupMembers.length} active members` : (viewingGroup.membersCount || `${viewingGroup.numericMembers || 1} members`)}
                      </div>
                    </div>
                  </div>

                  {/* Moderation Controls */}
                  <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>Change Approval Status:</div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        className="btn btn-success"
                        style={{ padding: '0.45rem 1rem', fontSize: '0.8rem', gap: '0.4rem' }}
                        disabled={updatingId === viewingGroup.id || (viewingGroup.status || '').toUpperCase() === 'APPROVED'}
                        onClick={() => handleUpdateStatus(viewingGroup.id, 'APPROVED')}
                      >
                        <Check size={14} /> Approve Group
                      </button>
                      <button
                        className="btn btn-danger"
                        style={{ padding: '0.45rem 1rem', fontSize: '0.8rem', gap: '0.4rem' }}
                        disabled={updatingId === viewingGroup.id || (viewingGroup.status || '').toUpperCase() === 'REJECTED'}
                        onClick={() => handleUpdateStatus(viewingGroup.id, 'REJECTED')}
                      >
                        <X size={14} /> Reject Group
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Members */}
              {activeModalTab === 'members' && (
                <div>
                  {/* Enrollment Summary Banner */}
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    background: '#eff6ff', 
                    border: '1px solid #bfdbfe', 
                    borderRadius: '8px', 
                    padding: '0.85rem 1.15rem', 
                    marginBottom: '1.25rem' 
                  }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1e40af', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Community Enrollment
                      </div>
                      <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1e3a8a' }}>
                        {groupMembers.length > 0 
                          ? `${groupMembers.length} Registered App Members` 
                          : (viewingGroup.membersCount || `${viewingGroup.numericMembers || 1} Registered Readers`)}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className="badge badge-info" style={{ fontSize: '0.75rem', fontWeight: 700 }}>
                        {groupMembers.length > 0 
                          ? `${groupMembers.filter(m => m.isOnline).length} Online Now` 
                          : 'Global Preset Audience'}
                      </span>
                    </div>
                  </div>

                  {loadingDetails && groupMembers.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                      <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 0.5rem', display: 'block' }} />
                      <div>Loading group members...</div>
                    </div>
                  ) : groupMembers.length === 0 ? (
                    <div>
                      {/* Creator / Host Card */}
                      <div style={{ 
                        padding: '1rem', 
                        background: '#f8fafc', 
                        borderRadius: '8px', 
                        border: '1px solid #e2e8f0', 
                        marginBottom: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.85rem'
                      }}>
                        <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.9rem' }}>
                          {(viewingGroup.creatorName || 'A').slice(0, 2).toUpperCase()}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-dark)' }}>
                              {viewingGroup.creatorName || 'System Admin'}
                            </span>
                            <span className="badge badge-primary" style={{ fontSize: '0.68rem', padding: '0.1rem 0.4rem' }}>
                              Group Founder
                            </span>
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            {viewingGroup.creatorEmail || 'system@bookkaboo.com'}
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'center', padding: '1.5rem 1rem', background: '#fafafa', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                        <Users size={28} color="var(--text-light)" style={{ margin: '0 auto 0.5rem', display: 'block' }} />
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-dark)' }}>
                          Global Reader Community
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem', maxWidth: '400px', margin: '0.25rem auto 0' }}>
                          This channel serves a global audience of {viewingGroup.membersCount || `${viewingGroup.numericMembers || 1} readers`} enrolled across the mobile reading application.
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                      {groupMembers.map(member => (
                        <div
                          key={member.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.75rem 1rem',
                            background: '#f8fafc',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                            transition: 'background 0.15s ease'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                            <div style={{ position: 'relative' }}>
                              {sanitizeImageUrl(member.avatar) ? (
                                <img 
                                  src={sanitizeImageUrl(member.avatar)} 
                                  alt={member.name} 
                                  style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} 
                                />
                              ) : (
                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#6366f1', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem' }}>
                                  {(member.name || 'M').slice(0, 2).toUpperCase()}
                                </div>
                              )}
                              {/* Online indicator dot */}
                              <span style={{
                                position: 'absolute',
                                bottom: '1px',
                                right: '1px',
                                width: '10px',
                                height: '10px',
                                borderRadius: '50%',
                                background: member.isOnline ? '#10b981' : '#94a3b8',
                                border: '2px solid #fff'
                              }} title={member.isOnline ? 'Online' : 'Offline'} />
                            </div>

                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                                <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-dark)' }}>
                                  {member.name || 'Member'}
                                </span>
                                {member.isOnline && (
                                  <span style={{ fontSize: '0.68rem', color: '#059669', fontWeight: 700 }}>
                                    ● Online
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                {member.email || member.userId}
                              </div>
                              {member.joinedAt && (
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-light)', marginTop: '0.1rem' }}>
                                  Joined: {formatDate(member.joinedAt)}
                                </div>
                              )}
                            </div>
                          </div>

                          <div style={{ textAlign: 'right' }}>
                            <span
                              className={member.role === 'Admin' ? 'badge badge-info' : 'badge badge-success'}
                              style={{ fontSize: '0.72rem', fontWeight: 700 }}
                            >
                              {member.role || 'Member'}
                            </span>
                            {member.lastSeen && (
                              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                Last active: {formatDateTime(member.lastSeen)}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Chat */}
              {activeModalTab === 'chat' && (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {/* Discussion Header */}
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    padding: '0.5rem 0.85rem', 
                    background: '#f8fafc', 
                    border: '1px solid #e2e8f0', 
                    borderRadius: '8px', 
                    marginBottom: '0.85rem' 
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <MessageCircle size={16} color="var(--primary)" />
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-dark)' }}>
                        Club Discussion Room
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        ({groupMessages.length} total messages)
                      </span>
                    </div>
                    <span style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981' }} />
                      Live Synced
                    </span>
                  </div>

                  {/* Messages Scroll Area */}
                  <div 
                    ref={chatScrollRef}
                    style={{ 
                      flex: 1, 
                      overflowY: 'auto', 
                      maxHeight: '380px', 
                      minHeight: '260px', 
                      paddingRight: '0.5rem', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: '0.85rem',
                      marginBottom: '1rem',
                      padding: '0.5rem'
                    }}
                  >
                    {loadingDetails && groupMessages.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                        <Loader2 size={26} className="animate-spin" style={{ margin: '0 auto 0.5rem', display: 'block' }} />
                        <div>Loading group discussion messages...</div>
                      </div>
                    ) : groupMessages.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                        <MessageCircle size={36} color="var(--text-light)" style={{ margin: '0 auto 0.65rem', display: 'block' }} />
                        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-dark)' }}>
                          No messages posted in this club yet
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                          Readers can chat here, or you can send a welcome announcement below as Admin.
                        </div>
                      </div>
                    ) : (
                      groupMessages.map(msg => {
                        const isAdmin = msg.senderRole === 'Admin' || msg.senderId === 'system-admin' || msg.senderId === 'admin_panel';
                        return (
                          <div
                            key={msg.id}
                            style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: '0.75rem',
                              padding: '0.75rem 0.85rem',
                              background: isAdmin ? '#f0fdf4' : '#f8fafc',
                              borderRadius: '8px',
                              border: isAdmin ? '1px solid #bbf7d0' : '1px solid #e2e8f0'
                            }}
                          >
                            {sanitizeImageUrl(msg.senderAvatar) ? (
                              <img 
                                src={sanitizeImageUrl(msg.senderAvatar)} 
                                alt={msg.senderName} 
                                style={{ width: '34px', height: '34px', borderRadius: '50%', objectFit: 'cover' }} 
                              />
                            ) : (
                              <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: isAdmin ? '#059669' : '#ff7f00', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.78rem' }}>
                                {(msg.senderName || 'U').slice(0, 2).toUpperCase()}
                              </div>
                            )}

                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                                  <span style={{ fontWeight: 800, fontSize: '0.85rem', color: isAdmin ? '#065f46' : 'var(--text-dark)' }}>
                                    {msg.senderName || 'Anonymous'}
                                  </span>
                                  {isAdmin && (
                                    <span className="badge badge-success" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', fontWeight: 800 }}>
                                      Admin / Host
                                    </span>
                                  )}
                                </div>
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                  {formatDateTime(msg.timestamp || msg.createdAt)}
                                </span>
                              </div>

                              <div style={{ 
                                fontSize: '0.875rem', 
                                color: 'var(--text-dark)', 
                                lineHeight: 1.45, 
                                background: '#fff', 
                                padding: '0.55rem 0.85rem', 
                                borderRadius: '6px', 
                                border: '1px solid #f1f5f9',
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word'
                              }}>
                                {msg.text || msg.message || '—'}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Admin Quick Reply Bar */}
                  <form 
                    onSubmit={handleSendAdminMessage}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.65rem', 
                      paddingTop: '0.85rem', 
                      borderTop: '1px solid #e2e8f0' 
                    }}
                  >
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Post a message or announcement as Bookkaboo Admin..."
                      value={adminChatMessage}
                      onChange={e => setAdminChatMessage(e.target.value)}
                      style={{ flex: 1, fontSize: '0.875rem', padding: '0.6rem 0.85rem' }}
                      disabled={sendingChat}
                    />
                    <button
                      type="submit"
                      className="btn btn-primary"
                      style={{ padding: '0.6rem 1.15rem', fontSize: '0.85rem', gap: '0.4rem' }}
                      disabled={sendingChat || !adminChatMessage.trim()}
                    >
                      {sendingChat ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                      Send
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
