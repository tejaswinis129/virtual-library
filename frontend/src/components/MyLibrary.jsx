import React, { useState, useMemo } from 'react';
import {
  Library,
  Search,
  Filter,
  Trash2,
  Edit3,
  Eye,
  Plus,
  BookOpen,
  ArrowUpDown,
  BookMarked,
} from 'lucide-react';

export default function MyLibrary({
  libraryBooks,
  onDeleteBook,
  onOpenEditModal,
  onOpenViewModal,
  onSwitchToSearch,
  onOpenAddCustomModal,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest'); // 'newest', 'title', 'author'
  const [deletingId, setDeletingId] = useState(null);

  // Extract unique categories from saved books
  const categories = useMemo(() => {
    const set = new Set();
    libraryBooks.forEach((b) => {
      if (b.category && b.category.trim()) {
        set.add(b.category.trim());
      }
    });
    return Array.from(set);
  }, [libraryBooks]);

  // Filtered and sorted books
  const filteredBooks = useMemo(() => {
    return libraryBooks
      .filter((book) => {
        const matchesSearch =
          book.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          book.author?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          book.description?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesCategory =
          selectedCategory === 'ALL' || book.category === selectedCategory;

        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => {
        if (sortBy === 'title') {
          return (a.title || '').localeCompare(b.title || '');
        }
        if (sortBy === 'author') {
          return (a.author || '').localeCompare(b.author || '');
        }
        // newest (default by id/created_at)
        return (b.id || 0) - (a.id || 0);
      });
  }, [libraryBooks, searchTerm, selectedCategory, sortBy]);

  const handleDeleteClick = async (id, title) => {
    if (window.confirm(`Are you sure you want to remove "${title}" from your library?`)) {
      setDeletingId(id);
      try {
        await onDeleteBook(id);
      } finally {
        setDeletingId(null);
      }
    }
  };

  return (
    <div className="library-page">
      {/* Library Top Bar */}
      <section className="library-header-section">
        <div className="library-title-area">
          <div className="library-heading-row">
            <div className="icon-badge">
              <BookMarked size={22} />
            </div>
            <div>
              <h1 className="library-title">My Personal Library</h1>
              <p className="library-subtitle">
                {libraryBooks.length} {libraryBooks.length === 1 ? 'volume' : 'volumes'} saved in PostgreSQL database
              </p>
            </div>
          </div>

          <button
            className="btn-primary"
            onClick={onOpenAddCustomModal}
          >
            <Plus size={18} />
            <span>Add Custom Book</span>
          </button>
        </div>

        {/* Filters and Controls */}
        {libraryBooks.length > 0 && (
          <div className="library-controls-bar">
            {/* Search within library */}
            <div className="control-search">
              <Search size={16} />
              <input
                type="text"
                placeholder="Filter saved books by title or author..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  className="clear-filter-btn"
                  onClick={() => setSearchTerm('')}
                >
                  ×
                </button>
              )}
            </div>

            {/* Category Filter */}
            <div className="control-select-group">
              <Filter size={15} />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="select-custom"
              >
                <option value="ALL">All Categories ({libraryBooks.length})</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Filter */}
            <div className="control-select-group">
              <ArrowUpDown size={15} />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="select-custom"
              >
                <option value="newest">Recently Added</option>
                <option value="title">Sort by Title (A-Z)</option>
                <option value="author">Sort by Author (A-Z)</option>
              </select>
            </div>
          </div>
        )}
      </section>

      {/* Books Content */}
      {libraryBooks.length === 0 ? (
        <div className="library-empty-state">
          <div className="empty-illustration">
            <Library size={64} className="empty-icon-lib" />
          </div>
          <h2>Your Virtual Library is Empty</h2>
          <p>
            Start curating your personal book collection! Search real-world titles from Google Books or add your own custom entries.
          </p>
          <div className="empty-actions">
            <button className="btn-primary btn-large" onClick={onSwitchToSearch}>
              <Search size={18} />
              <span>Search Google Books</span>
            </button>
            <button className="btn-secondary btn-large" onClick={onOpenAddCustomModal}>
              <Plus size={18} />
              <span>Add Custom Book</span>
            </button>
          </div>
        </div>
      ) : filteredBooks.length === 0 ? (
        <div className="library-no-match">
          <BookOpen size={48} />
          <h3>No matching books found</h3>
          <p>No books in your library match "{searchTerm}".</p>
          <button
            className="btn-secondary"
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('ALL');
            }}
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="library-grid">
          {filteredBooks.map((book) => (
            <div key={book.id} className="library-card">
              <div
                className="lib-cover-wrapper"
                onClick={() => onOpenViewModal(book)}
              >
                {book.thumbnail ? (
                  <img
                    src={book.thumbnail}
                    alt={book.title}
                    className="lib-cover-img"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src =
                        'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400';
                    }}
                  />
                ) : (
                  <div className="lib-cover-placeholder">
                    <BookOpen size={40} />
                    <span>No Cover</span>
                  </div>
                )}
                <div className="lib-overlay">
                  <Eye size={18} />
                  <span>View Details</span>
                </div>
              </div>

              <div className="lib-details">
                <div className="lib-badges">
                  <span className="category-pill-small">
                    {book.category || 'General'}
                  </span>
                  {book.published_date && (
                    <span className="year-pill">
                      {book.published_date.substring(0, 4)}
                    </span>
                  )}
                </div>

                <h3
                  className="lib-title"
                  title={book.title}
                  onClick={() => onOpenViewModal(book)}
                >
                  {book.title}
                </h3>

                <p className="lib-author">{book.author || 'Unknown Author'}</p>

                <p className="lib-desc">
                  {book.description
                    ? book.description.substring(0, 110) + '...'
                    : 'No description added for this book.'}
                </p>

                <div className="lib-card-actions">
                  <button
                    className="lib-action-btn edit-btn"
                    onClick={() => onOpenEditModal(book)}
                    title="Edit book details"
                  >
                    <Edit3 size={15} />
                    <span>Edit</span>
                  </button>

                  <button
                    className="lib-action-btn delete-btn"
                    onClick={() => handleDeleteClick(book.id, book.title)}
                    disabled={deletingId === book.id}
                    title="Remove from library"
                  >
                    <Trash2 size={15} />
                    <span>{deletingId === book.id ? 'Deleting...' : 'Delete'}</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
