import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import SidebarLayout from './components/SidebarLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import BooksPage from './pages/BooksPage';
import AddBookPage from './pages/AddBookPage';
import AddCategoryPage from './pages/AddCategoryPage';
import CategoriesPage from './pages/CategoriesPage';
import AuthorsPage from './pages/AuthorsPage';
import UsersPage from './pages/UsersPage';
import UserDetailsPage from './pages/UserDetailsPage';
import PaymentsPage from './pages/PaymentsPage';
import DownloadsPage from './pages/DownloadsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import WishlistPage from './pages/WishlistPage';
import NotificationsPage from './pages/NotificationsPage';
import BannersPage from './pages/BannersPage';
import GamesPage from './pages/GamesPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import ProfilePage from './pages/ProfilePage';
import ReviewsPage from './pages/ReviewsPage';
import ReviewApprovalsPage from './pages/ReviewApprovalsPage';
import AuthorKycPage from './pages/AuthorKycPage';
import CommunityGroupsPage from './pages/CommunityGroupsPage';
import GroupApprovalsPage from './pages/GroupApprovalsPage';
import {
  db,
  collection,
  collectionGroup,
  onSnapshot,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  serverTimestamp
} from './firebase';

export default function App() {
  // Collections State
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [downloads, setDownloads] = useState([]);
  const [payments, setPayments] = useState([]);
  const [banners, setBanners] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [communityGroups, setCommunityGroups] = useState([]);
  const [libraryProgress, setLibraryProgress] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All');
  const [editingBook, setEditingBook] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);

  // Firestore Real-time Snapshot Listeners
  useEffect(() => {
    const unsubBooks = onSnapshot(collection(db, 'books'), (snapshot) => {
      setBooks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubCategories = onSnapshot(collection(db, 'categories'), (snapshot) => {
      setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubAuthors = onSnapshot(collection(db, 'authors'), (snapshot) => {
      setAuthors(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const uData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsersList(uData);
      if (uData.length > 0 && !selectedUser) setSelectedUser(uData[0]);
    });
    const unsubDownloads = onSnapshot(collectionGroup(db, 'downloads'), (snapshot) => {
      setDownloads(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => {
      console.warn('Error reading downloads collectionGroup:', err);
    });
    const unsubPayments = onSnapshot(collection(db, 'payments'), (snapshot) => {
      setPayments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubBanners = onSnapshot(collection(db, 'banners'), (snapshot) => {
      setBanners(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubReviews = onSnapshot(collection(db, 'reviews'), (snapshot) => {
      setReviews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => {
      console.warn('Error reading reviews:', err);
    });
    const unsubCommunity = onSnapshot(collection(db, 'community_groups'), (snapshot) => {
      setCommunityGroups(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => {
      console.warn('Error reading community_groups:', err);
    });
    const unsubLibrary = onSnapshot(collectionGroup(db, 'library'), (snapshot) => {
      setLibraryProgress(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => {
      console.warn('Error reading library collectionGroup:', err);
    });

    return () => {
      unsubBooks();
      unsubCategories();
      unsubAuthors();
      unsubUsers();
      unsubDownloads();
      unsubPayments();
      unsubBanners();
      unsubReviews();
      unsubCommunity();
      unsubLibrary();
    };
  }, []);

  // CRUD Actions
  const handleAddCategory = async (catName, status = 'Active', imageUrl = '') => {
    try {
      await addDoc(collection(db, 'categories'), { 
        name: catName, 
        status: status || 'Active', 
        image: imageUrl || '', 
        imageUrl: imageUrl || '', 
        createdAt: serverTimestamp() 
      });
    } catch (err) {
      setCategories(prev => [...prev, { id: 'cat_' + Date.now(), name: catName, status: status || 'Active', image: imageUrl, imageUrl }]);
    }
  };

  const handleUpdateCategory = async (id, newName, status = 'Active', imageUrl = '') => {
    try {
      const updateData = { name: newName, status: status || 'Active' };
      if (imageUrl !== undefined) {
        updateData.image = imageUrl;
        updateData.imageUrl = imageUrl;
      }
      await updateDoc(doc(db, 'categories', id), updateData);
    } catch (err) {
      setCategories(prev => prev.map(c => c.id === id ? { ...c, name: newName, status: status || c.status, image: imageUrl ?? c.image, imageUrl: imageUrl ?? c.imageUrl } : c));
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!confirm('Delete category?')) return;
    try {
      await deleteDoc(doc(db, 'categories', id));
    } catch (err) {
      setCategories(prev => prev.filter(c => c.id !== id));
    }
  };

  const handleAddAuthor = async (authorInput) => {
    try {
      const data = typeof authorInput === 'string' ? { name: authorInput } : authorInput;
      const avatarUrl = data.avatar || data.image || data.imageUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150';
      await addDoc(collection(db, 'authors'), {
        name: data.name,
        avatar: avatarUrl,
        image: avatarUrl,
        imageUrl: avatarUrl,
        bio: data.bio || '',
        email: data.email || '',
        status: data.status || 'Active',
        createdAt: serverTimestamp()
      });
    } catch (err) {
      const data = typeof authorInput === 'string' ? { name: authorInput } : authorInput;
      setAuthors(prev => [...prev, { id: 'auth_' + Date.now(), ...data, status: data.status || 'Active' }]);
    }
  };

  const handleUpdateAuthor = async (id, authorInput) => {
    try {
      const data = typeof authorInput === 'string' ? { name: authorInput } : authorInput;
      const updateData = {
        name: data.name,
        status: data.status || 'Active',
        bio: data.bio || '',
        email: data.email || ''
      };
      if (data.avatar !== undefined || data.image !== undefined || data.imageUrl !== undefined) {
        const pic = data.avatar || data.image || data.imageUrl || '';
        updateData.avatar = pic;
        updateData.image = pic;
        updateData.imageUrl = pic;
      }
      await updateDoc(doc(db, 'authors', id), updateData);
    } catch (err) {
      const data = typeof authorInput === 'string' ? { name: authorInput } : authorInput;
      setAuthors(prev => prev.map(a => a.id === id ? { ...a, ...data } : a));
    }
  };

  const handleDeleteAuthor = async (id) => {
    if (!confirm('Delete author?')) return;
    try {
      await deleteDoc(doc(db, 'authors', id));
    } catch (err) {
      setAuthors(prev => prev.filter(a => a.id !== id));
    }
  };

  const handleDeleteBook = async (id) => {
    if (!confirm('Delete book?')) return;
    try {
      await deleteDoc(doc(db, 'books', id));
    } catch (err) {
      setBooks(prev => prev.filter(b => b.id !== id));
    }
  };

  const handleAddBanner = async (banData) => {
    try {
      const bannerPayload = typeof banData === 'string'
        ? { title: banData, status: 'Active', createdAt: serverTimestamp() }
        : { ...banData, createdAt: serverTimestamp() };
      await addDoc(collection(db, 'banners'), bannerPayload);
    } catch (err) {
      const fallback = typeof banData === 'string'
        ? { id: 'ban_' + Date.now(), title: banData, status: 'Active' }
        : { id: 'ban_' + Date.now(), ...banData, status: 'Active' };
      setBanners(prev => [...prev, fallback]);
    }
  };

  const handleToggleBannerStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'Active' ? 'Paused' : 'Active';
    try {
      await updateDoc(doc(db, 'banners', id), { status: nextStatus });
    } catch (err) {
      setBanners(prev => prev.map(b => b.id === id ? { ...b, status: nextStatus } : b));
    }
  };

  const handleDeleteBanner = async (id) => {
    if (!confirm('Delete banner?')) return;
    try {
      await deleteDoc(doc(db, 'banners', id));
    } catch (err) {
      setBanners(prev => prev.filter(b => b.id !== id));
    }
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        <Route path="/*" element={
          <SidebarLayout reviews={reviews} communityGroups={communityGroups}>
            <Routes>
              <Route path="/" element={<DashboardPage books={books} usersList={usersList} downloads={downloads} reviews={reviews} communityGroups={communityGroups} libraryProgress={libraryProgress} />} />
              <Route path="/books" element={
                <BooksPage
                  books={books}
                  categories={categories}
                  reviews={reviews}
                  selectedCategoryFilter={selectedCategoryFilter}
                  setSelectedCategoryFilter={setSelectedCategoryFilter}
                  onEditBook={setEditingBook}
                  onDeleteBook={handleDeleteBook}
                />
              } />
              <Route path="/books/add" element={
                <AddBookPage
                  categories={categories}
                  authors={authors}
                  editingBook={editingBook}
                  onSaveComplete={() => setEditingBook(null)}
                />
              } />
              <Route path="/categories" element={
                <CategoriesPage
                  categories={categories}
                  books={books}
                  onEditCategory={setEditingCategory}
                  onDeleteCategory={handleDeleteCategory}
                  setSelectedCategoryFilter={setSelectedCategoryFilter}
                />
              } />
              <Route path="/categories/add" element={
                <AddCategoryPage
                  editingCategory={editingCategory}
                  onSaveCategory={async (param1, param2, param3, param4) => {
                    if (editingCategory?.id) {
                      await handleUpdateCategory(param1, param2, param3, param4);
                    } else {
                      await handleAddCategory(param1, param2, param3);
                    }
                    setEditingCategory(null);
                  }}
                />
              } />
              <Route path="/authors" element={
                <AuthorsPage
                  authors={authors}
                  books={books}
                  onAddAuthor={handleAddAuthor}
                  onUpdateAuthor={handleUpdateAuthor}
                  onDeleteAuthor={handleDeleteAuthor}
                />
              } />
              <Route path="/users" element={<UsersPage usersList={usersList} books={books} downloads={downloads} reviews={reviews} setSelectedUser={setSelectedUser} />} />
              <Route path="/users/:id" element={<UserDetailsPage selectedUser={selectedUser} usersList={usersList} books={books} reviews={reviews} />} />
              <Route path="/community-groups" element={<CommunityGroupsPage communityGroups={communityGroups} usersList={usersList} books={books} />} />
              <Route path="/group-approvals" element={<GroupApprovalsPage communityGroups={communityGroups} usersList={usersList} />} />
              <Route path="/payments" element={<PaymentsPage payments={payments} usersList={usersList} />} />
              <Route path="/downloads" element={<DownloadsPage downloads={downloads} usersList={usersList} books={books} />} />
              <Route path="/analytics" element={<AnalyticsPage books={books} usersList={usersList} downloads={downloads} libraryProgress={libraryProgress} communityGroups={communityGroups} />} />
              <Route path="/wishlist" element={<WishlistPage usersList={usersList} books={books} />} />
              <Route path="/reviews" element={<ReviewsPage reviews={reviews} books={books} usersList={usersList} />} />
              <Route path="/review-approvals" element={<ReviewApprovalsPage reviews={reviews} books={books} usersList={usersList} />} />
              <Route path="/notifications" element={<NotificationsPage usersList={usersList} />} />
              <Route path="/banners" element={<BannersPage banners={banners} onAddBanner={handleAddBanner} onDeleteBanner={handleDeleteBanner} onToggleBannerStatus={handleToggleBannerStatus} />} />
              <Route path="/games" element={<GamesPage />} />
              <Route path="/reports" element={<ReportsPage books={books} usersList={usersList} downloads={downloads} reviews={reviews} communityGroups={communityGroups} libraryProgress={libraryProgress} />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/profile" element={<ProfilePage usersList={usersList} />} />

              {/* Author Flow Routes */}
              <Route path="/author/my-books" element={
                <BooksPage
                  books={books}
                  categories={categories}
                  reviews={reviews}
                  selectedCategoryFilter={selectedCategoryFilter}
                  setSelectedCategoryFilter={setSelectedCategoryFilter}
                  onEditBook={setEditingBook}
                  onDeleteBook={handleDeleteBook}
                />
              } />
              <Route path="/author/add-book" element={
                <AddBookPage
                  categories={categories}
                  authors={authors}
                  editingBook={editingBook}
                  onSaveComplete={() => setEditingBook(null)}
                />
              } />
              <Route path="/author/sales" element={<AnalyticsPage books={books} usersList={usersList} downloads={downloads} />} />
              <Route path="/author/payouts" element={<PaymentsPage payments={payments} />} />
              <Route path="/author/kyc" element={<AuthorKycPage authors={authors} books={books} />} />
            </Routes>
          </SidebarLayout>
        } />
      </Routes>
    </BrowserRouter>
  );
}
