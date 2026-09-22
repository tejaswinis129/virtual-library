import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import SearchBooks from './components/SearchBooks';
import MyLibrary from './components/MyLibrary';
import BookModal from './components/BookModal';
import Toast from './components/Toast';
import {
  getLibraryBooks,
  addBookToLibrary,
  updateLibraryBook,
  deleteLibraryBook,
} from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('search'); // 'search' or 'library'
  const [libraryBooks, setLibraryBooks] = useState([]);
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(true);

  // Modal State
  const [selectedBook, setSelectedBook] = useState(null);
  const [modalMode, setModalMode] = useState('view'); // 'view' or 'edit'
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Toast State
  const [toast, setToast] = useState(null); // { message, type }

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const fetchLibrary = async () => {
    try {
      const data = await getLibraryBooks();
      setLibraryBooks(data);
    } catch (err) {
      console.error('Error fetching library:', err);
      showToast('Could not load saved books from backend', 'error');
    } finally {
      setIsLoadingLibrary(false);
    }
  };

  useEffect(() => {
    fetchLibrary();
  }, []);

  const handleAddBook = async (book) => {
    try {
      const newBook = await addBookToLibrary({
        google_book_id: book.google_book_id || null,
        title: book.title,
        author: book.author,
        description: book.description,
        published_date: book.published_date,
        category: book.category,
        thumbnail: book.thumbnail,
      });

      setLibraryBooks((prev) => [newBook, ...prev]);
      showToast(`Added "${book.title}" to your library!`, 'success');
      return true;
    } catch (err) {
      showToast(err.message, 'error');
      return false;
    }
  };

  const handleUpdateBook = async (id, updatedFields) => {
    try {
      const updated = await updateLibraryBook(id, updatedFields);
      setLibraryBooks((prev) =>
        prev.map((b) => (b.id === id ? updated : b))
      );
      setSelectedBook(updated);
      showToast(`Updated "${updated.title}" successfully!`, 'success');
    } catch (err) {
      showToast(err.message, 'error');
      throw err;
    }
  };

  const handleDeleteBook = async (id) => {
    try {
      await deleteLibraryBook(id);
      setLibraryBooks((prev) => prev.filter((b) => b.id !== id));
      showToast('Book removed from library', 'info');
      if (selectedBook && selectedBook.id === id) {
        setIsModalOpen(false);
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleOpenModal = (book, mode = 'view') => {
    setSelectedBook(book);
    setModalMode(mode);
    setIsModalOpen(true);
  };

  const handleOpenAddCustomModal = () => {
    setSelectedBook({
      title: '',
      author: '',
      category: 'General',
      published_date: new Date().getFullYear().toString(),
      description: '',
      thumbnail: '',
    });
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleSaveModal = async (id, formData) => {
    if (id) {
      await handleUpdateBook(id, formData);
    } else {
      const added = await handleAddBook(formData);
      if (added) {
        setIsModalOpen(false);
      }
    }
  };

  const savedGoogleIds = libraryBooks
    .map((b) => b.google_book_id)
    .filter(Boolean);

  return (
    <div className="app-layout">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        libraryCount={libraryBooks.length}
      />

      <main className="main-content">
        {activeTab === 'search' ? (
          <SearchBooks
            onAddBook={handleAddBook}
            savedBookGoogleIds={savedGoogleIds}
            onSelectBookForModal={(book, mode) => handleOpenModal(book, mode)}
          />
        ) : (
          <MyLibrary
            libraryBooks={libraryBooks}
            onDeleteBook={handleDeleteBook}
            onOpenEditModal={(book) => handleOpenModal(book, 'edit')}
            onOpenViewModal={(book) => handleOpenModal(book, 'view')}
            onSwitchToSearch={() => setActiveTab('search')}
            onOpenAddCustomModal={handleOpenAddCustomModal}
          />
        )}
      </main>

      <BookModal
        book={selectedBook}
        isOpen={isModalOpen}
        mode={modalMode}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveModal}
        onAddToLibrary={handleAddBook}
        isSaved={
          selectedBook &&
          Boolean(
            selectedBook.id ||
              (selectedBook.google_book_id &&
                savedGoogleIds.includes(selectedBook.google_book_id))
          )
        }
      />
    </div>
  );
}
