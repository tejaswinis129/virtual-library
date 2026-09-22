import React, { useState, useEffect } from 'react';
import { Search, Plus, Check, Eye, BookOpen, AlertCircle, Sparkles, Loader2 } from 'lucide-react';
import { searchBooks } from '../services/api';

const POPULAR_SEARCHES = [
  'Harry Potter',
  'Clean Code',
  'Science Fiction',
  'Artificial Intelligence',
  'Psychology of Money',
  'Dune',
  'Atomic Habits',
];

export default function SearchBooks({
  onAddBook,
  savedBookGoogleIds,
  onSelectBookForModal,
}) {
  const [query, setQuery] = useState('Harry Potter');
  const [books, setBooks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [addingId, setAddingId] = useState(null);

  const performSearch = async (searchQuery) => {
    if (!searchQuery || !searchQuery.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await searchBooks(searchQuery.trim());
      setBooks(data.books || []);
      setHasSearched(true);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to fetch books. Please check backend connection.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Initial search on mount
    performSearch('Harry Potter');
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    performSearch(query);
  };

  const handleQuickSearch = (term) => {
    setQuery(term);
    performSearch(term);
  };

  const handleAdd = async (book) => {
    setAddingId(book.google_book_id || book.title);
    try {
      await onAddBook(book);
    } finally {
      setAddingId(null);
    }
  };

  return (
    <div className="search-page">
      {/* Hero Section */}
      <section className="search-hero">
        <div className="hero-badge">
          <Sparkles size={14} className="hero-sparkle" />
          <span>Explore Millions of Real-World Titles</span>
        </div>
        <h1 className="hero-title">Discover Your Next Favorite Book</h1>
        <p className="hero-subtitle">
          Search books across global libraries by title, author, or genre, and save them to your PostgreSQL collection.
        </p>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="search-bar-form">
          <div className="search-input-wrapper">
            <Search className="search-icon" size={20} />
            <input
              type="text"
              className="search-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title, author, or keyword (e.g. 'Harry Potter', 'Stephen King')..."
              autoFocus
            />
            {query && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => setQuery('')}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>
          <button type="submit" className="search-submit-btn" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="spinner" size={18} />
                <span>Searching...</span>
              </>
            ) : (
              <>
                <Search size={18} />
                <span>Search Books</span>
              </>
            )}
          </button>
        </form>

        {/* Quick Suggestion Chips */}
        <div className="quick-suggestions">
          <span className="suggestion-label">Trending:</span>
          <div className="chips-list">
            {POPULAR_SEARCHES.map((term) => (
              <button
                key={term}
                type="button"
                className={`suggestion-chip ${query.toLowerCase() === term.toLowerCase() ? 'active' : ''}`}
                onClick={() => handleQuickSearch(term)}
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Error Message */}
      {error && (
        <div className="error-banner">
          <AlertCircle size={20} />
          <div className="error-text">
            <h4>Search Failed</h4>
            <p>{error}</p>
          </div>
          <button className="btn-retry" onClick={() => performSearch(query)}>
            Retry
          </button>
        </div>
      )}

      {/* Loading Skeletons */}
      {isLoading && (
        <div className="books-grid">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="book-card-skeleton">
              <div className="skeleton-cover shimmer"></div>
              <div className="skeleton-content">
                <div className="skeleton-line pill shimmer"></div>
                <div className="skeleton-line title shimmer"></div>
                <div className="skeleton-line author shimmer"></div>
                <div className="skeleton-line desc shimmer"></div>
                <div className="skeleton-line btn shimmer"></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Search Results Grid */}
      {!isLoading && books.length > 0 && (
        <div className="results-container">
          <div className="results-header">
            <h3>
              Results for "<span className="highlight">{query}</span>"
            </h3>
            <span className="results-count">{books.length} titles found</span>
          </div>

          <div className="books-grid">
            {books.map((book) => {
              const isSaved =
                book.google_book_id &&
                savedBookGoogleIds.includes(book.google_book_id);
              const isCurrentlyAdding =
                addingId === (book.google_book_id || book.title);

              return (
                <div key={book.google_book_id || book.title} className="book-card">
                  <div
                    className="card-cover-wrapper"
                    onClick={() => onSelectBookForModal(book, 'view')}
                  >
                    {book.thumbnail ? (
                      <img
                        src={book.thumbnail}
                        alt={book.title}
                        className="card-cover-img"
                        loading="lazy"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src =
                            'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400';
                        }}
                      />
                    ) : (
                      <div className="card-cover-placeholder">
                        <BookOpen size={36} />
                        <span>No Cover</span>
                      </div>
                    )}
                    <div className="cover-overlay">
                      <span className="preview-cta">
                        <Eye size={16} /> Quick Preview
                      </span>
                    </div>
                  </div>

                  <div className="card-info">
                    <div className="card-tags">
                      <span className="category-pill-small">
                        {book.category || 'General'}
                      </span>
                      {book.published_date && (
                        <span className="year-pill">
                          {book.published_date.substring(0, 4)}
                        </span>
                      )}
                    </div>

                    <h4
                      className="card-title"
                      title={book.title}
                      onClick={() => onSelectBookForModal(book, 'view')}
                    >
                      {book.title}
                    </h4>

                    <p className="card-author">{book.author}</p>

                    <p className="card-snippet">
                      {book.description
                        ? book.description.substring(0, 95) + '...'
                        : 'No description available for this volume.'}
                    </p>

                    <div className="card-actions">
                      <button
                        className={`btn-add ${isSaved ? 'in-library' : ''}`}
                        onClick={() => !isSaved && handleAdd(book)}
                        disabled={isSaved || isCurrentlyAdding}
                        title={isSaved ? 'Already saved in library' : 'Add to personal library'}
                      >
                        {isSaved ? (
                          <>
                            <Check size={16} />
                            <span>In Library</span>
                          </>
                        ) : isCurrentlyAdding ? (
                          <>
                            <Loader2 className="spinner" size={16} />
                            <span>Adding...</span>
                          </>
                        ) : (
                          <>
                            <Plus size={16} />
                            <span>Add to Library</span>
                          </>
                        )}
                      </button>

                      <button
                        className="btn-details-icon"
                        onClick={() => onSelectBookForModal(book, 'view')}
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty Search Results */}
      {!isLoading && hasSearched && books.length === 0 && !error && (
        <div className="empty-results">
          <BookOpen size={56} className="empty-icon" />
          <h3>No books found for "{query}"</h3>
          <p>Try searching for a different title, author, or a broader topic.</p>
        </div>
      )}
    </div>
  );
}
