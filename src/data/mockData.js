export const mockBooks = [
  { id: 1, title: 'Atomic Habits', author: 'James Clear', category: 'Self Help', price: 20, status: 'Active', cover: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=200', downloads: 1240, reads: 1540 },
  { id: 2, title: 'Deep Work', author: 'Cal Newport', category: 'Productivity', price: 20, status: 'Active', cover: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=200', downloads: 980, reads: 1120 },
  { id: 3, title: 'Ikigai', author: 'Hector Garcia', category: 'Wellness', price: 20, status: 'Active', cover: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=200', downloads: 860, reads: 940 },
  { id: 4, title: 'The Alchemist', author: 'Paulo Coelho', category: 'Fiction', price: 20, status: 'Active', cover: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=200', downloads: 820, reads: 890 },
  { id: 5, title: 'Think Like a Monk', author: 'Jay Shetty', category: 'Self Help', price: 20, status: 'Active', cover: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&q=80&w=200', downloads: 790, reads: 850 }
];

export const mockCategories = [
  { id: 1, name: 'Fiction', books: 320, status: 'Active' },
  { id: 2, name: 'Romance', books: 280, status: 'Active' },
  { id: 3, name: 'Self Help', books: 410, status: 'Active' },
  { id: 4, name: 'Business', books: 220, status: 'Active' },
  { id: 5, name: 'Education', books: 310, status: 'Active' },
  { id: 6, name: 'Children', books: 190, status: 'Active' },
  { id: 7, name: 'Science', books: 160, status: 'Active' },
  { id: 8, name: 'Biography', books: 180, status: 'Active' }
];

export const mockAuthors = [
  { id: 1, name: 'James Clear', books: 12, status: 'Active', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150' },
  { id: 2, name: 'Cal Newport', books: 10, status: 'Active', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150' },
  { id: 3, name: 'Hector Garcia', books: 8, status: 'Active', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150' },
  { id: 4, name: 'Paulo Coelho', books: 15, status: 'Active', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150' },
  { id: 5, name: 'Jay Shetty', books: 9, status: 'Active', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=150' },
  { id: 6, name: 'Robin Sharma', books: 11, status: 'Active', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=150' },
  { id: 7, name: 'Anna Lembke', books: 6, status: 'Active', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150' }
];

export const mockUsers = [
  { id: 1, name: 'Priya Sharma', email: 'priya@gmail.com', joined: '23 Sep 2025', status: 'Active', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150', purchases: 12, spent: 240, reads: 18, downloads: 26 },
  { id: 2, name: 'Arun Karthik', email: 'arun@gmail.com', joined: '22 Sep 2025', status: 'Active', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150', purchases: 5, spent: 100, reads: 8, downloads: 10 },
  { id: 3, name: 'Meena R', email: 'meena@gmail.com', joined: '20 Sep 2025', status: 'Active', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150', purchases: 9, spent: 180, reads: 14, downloads: 19 },
  { id: 4, name: 'Vignesh S', email: 'vignesh@gmail.com', joined: '19 Sep 2025', status: 'Active', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150', purchases: 3, spent: 60, reads: 4, downloads: 5 },
  { id: 5, name: 'Kavya N', email: 'kavya@gmail.com', joined: '18 Sep 2025', status: 'Active', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150', purchases: 7, spent: 140, reads: 11, downloads: 15 },
  { id: 6, name: 'Rahul P', email: 'rahul@gmail.com', joined: '17 Sep 2025', status: 'Inactive', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=150', purchases: 2, spent: 40, reads: 3, downloads: 4 },
  { id: 7, name: 'Sneha M', email: 'sneha@gmail.com', joined: '16 Sep 2025', status: 'Active', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=150', purchases: 8, spent: 160, reads: 12, downloads: 16 }
];

export const mockPayments = [
  { id: 1, user: 'Priya Sharma', book: 'Atomic Habits', amount: 20, method: 'UPI', status: 'Paid', date: '23 Sep 2025' },
  { id: 2, user: 'Arun Karthik', book: 'Deep Work', amount: 20, method: 'Card', status: 'Paid', date: '22 Sep 2025' },
  { id: 3, user: 'Meena R', book: 'Ikigai', amount: 20, method: 'Wallet', status: 'Paid', date: '20 Sep 2025' },
  { id: 4, user: 'Vignesh S', book: 'The Alchemist', amount: 20, method: 'Net Banking', status: 'Paid', date: '19 Sep 2025' },
  { id: 5, user: 'Kavya N', book: 'Think Like a Monk', amount: 20, method: 'UPI', status: 'Paid', date: '18 Sep 2025' }
];

export const mockAuthorBooks = [
  { id: 1, title: 'Atomic Habits', category: 'Self Help', price: 20, status: 'Draft' },
  { id: 2, title: 'Deep Work', category: 'Productivity', price: 20, status: 'Draft' },
  { id: 3, title: 'Ikigai', category: 'Wellness', price: 20, status: 'Published' },
  { id: 4, title: 'The Alchemist', category: 'Fiction', price: 20, status: 'Under Review' },
  { id: 5, title: 'Think Like a Monk', category: 'Self Help', price: 20, status: 'Rejected' }
];

export const mockAuthorPayouts = [
  { id: 1, date: '25 Sep 2025', description: 'Book Sale', amount: 400, status: 'Paid' },
  { id: 2, date: '25 Sep 2025', description: 'Book Sale', amount: 380, status: 'Paid' },
  { id: 3, date: '23 Sep 2025', description: 'Book Sale', amount: 320, status: 'Paid' },
  { id: 4, date: '22 Sep 2025', description: 'Book Sale', amount: 260, status: 'Paid' },
  { id: 5, date: '23 Sep 2025', description: 'Book Sale', amount: 220, status: 'Paid' }
];
