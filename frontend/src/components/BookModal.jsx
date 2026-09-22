import React, { useState, useEffect } from 'react';
import { X, Calendar, Tag, User, BookOpen, ExternalLink, Save, Check, Plus } from 'lucide-react';

export default function BookModal({
  book,
  isOpen,
  onClose,
  onSave,
  onAddToLibrary,
  isSaved,
  mode = 'view', // 'view' or 'edit'
}) {
  const [isEditing, setIsEditing] = useState(mode === 'edit');
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    category: '',
    published_date: '',
    description: '',
    thumbnail: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (book) {
      setFormData({
        title: book.title || '',
        author: book.author || '',
        category: book.category || 'General',
        published_date: book.published_date || '',
        description: book.description || '',
        thumbnail: book.thumbnail || '',
      });
      setIsEditing(mode === 'edit');
    }
  }, [book, mode]);

  if (!isOpen || !book) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSave(book.id, formData);
      setIsEditing(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
          <X size={20} />
        </button>

        <div className="modal-body">
          {/* Left Column: Cover & Quick Actions */}
          <div className="modal-cover-column">
            <div className="modal-cover-wrapper">
              {formData.thumbnail ? (
                <img
                  src={formData.thumbnail}
                  alt={formData.title}
                  className="modal-cover-img"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400';
                  }}
                />
              ) : (
                <div className="modal-cover-placeholder">
                  <BookOpen size={48} />
                  <span>No Cover Available</span>
                </div>
              )}
            </div>

            {book.id && !isEditing && (
              <button
                className="btn-secondary btn-full"
                onClick={() => setIsEditing(true)}
              >
                Edit Book Details
              </button>
            )}

            {!book.id && onAddToLibrary && (
              <button
                className={`btn-primary btn-full ${isSaved ? 'btn-saved' : ''}`}
                onClick={() => onAddToLibrary(book)}
                disabled={isSaved}
              >
                {isSaved ? (
                  <>
                    <Check size={18} /> In Library
                  </>
                ) : (
                  <>
                    <Plus size={18} /> Add to Library
                  </>
                )}
              </button>
            )}

            {(book.preview_link || book.info_link) && (
              <a
                href={book.preview_link || book.info_link}
                target="_blank"
                rel="noreferrer"
                className="external-preview-link"
              >
                <span>Read Google Preview</span>
                <ExternalLink size={14} />
              </a>
            )}
          </div>

          {/* Right Column: Details or Edit Form */}
          <div className="modal-content-column">
            {isEditing ? (
              <form onSubmit={handleSaveSubmit} className="edit-form">
                <div className="form-header">
                  <h3>Edit Book Information</h3>
                  <p>Update title, author, category, or personal reading notes.</p>
                </div>

                <div className="form-group">
                  <label htmlFor="title">Title *</label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="author">Author</label>
                    <input
                      type="text"
                      id="author"
                      name="author"
                      value={formData.author}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="category">Category</label>
                    <input
                      type="text"
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="published_date">Published Date</label>
                    <input
                      type="text"
                      id="published_date"
                      name="published_date"
                      value={formData.published_date}
                      onChange={handleChange}
                      placeholder="e.g. 2020-05-12 or 2020"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="thumbnail">Cover Image URL</label>
                    <input
                      type="url"
                      id="thumbnail"
                      name="thumbnail"
                      value={formData.thumbnail}
                      onChange={handleChange}
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="description">Description / Notes</label>
                  <textarea
                    id="description"
                    name="description"
                    rows={4}
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Book overview, quotes, or personal notes..."
                  />
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => {
                      if (!book.id) {
                        onClose();
                      } else {
                        setIsEditing(false);
                      }
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={isSubmitting}
                  >
                    <Save size={16} />
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="view-details">
                <div className="details-header">
                  <span className="category-pill">{book.category || 'General'}</span>
                  <h2 className="details-title">{book.title}</h2>
                  <div className="details-meta-row">
                    <div className="meta-item">
                      <User size={16} />
                      <span>{book.author || 'Unknown Author'}</span>
                    </div>
                    {book.published_date && (
                      <div className="meta-item">
                        <Calendar size={16} />
                        <span>{book.published_date}</span>
                      </div>
                    )}
                    {book.google_book_id && (
                      <div className="meta-item id-tag">
                        <Tag size={14} />
                        <span>ID: {book.google_book_id.substring(0, 12)}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="details-section">
                  <h4>Synopsis & Notes</h4>
                  <div className="details-description">
                    {book.description ? (
                      <p>{book.description}</p>
                    ) : (
                      <p className="no-description">No summary available for this book.</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
