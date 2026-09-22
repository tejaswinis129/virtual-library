import React from 'react';
import { BookOpen, Search, Library, Sparkles } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, libraryCount, isPostgres }) {
  return (
    <header className="header-glass">
      <div className="header-container">
        <div className="brand" onClick={() => setActiveTab('search')}>
          <div className="brand-icon-wrapper">
            <BookOpen className="brand-icon" size={26} />
            <Sparkles className="sparkle-accent" size={14} />
          </div>
          <div className="brand-text">
            <span className="brand-title">Lumina</span>
            <span className="brand-subtitle">Virtual Library</span>
          </div>
        </div>

        <nav className="nav-tabs">
          <button
            className={`nav-tab-btn ${activeTab === 'search' ? 'active' : ''}`}
            onClick={() => setActiveTab('search')}
          >
            <Search size={18} />
            <span>Discover Books</span>
          </button>

          <button
            className={`nav-tab-btn ${activeTab === 'library' ? 'active' : ''}`}
            onClick={() => setActiveTab('library')}
          >
            <Library size={18} />
            <span>My Library</span>
            <span className="count-badge">{libraryCount}</span>
          </button>
        </nav>

        <div className="db-status-badge" title="PostgreSQL Database Connection">
          <span className="status-dot"></span>
          <span className="status-label">PostgreSQL Live</span>
        </div>
      </div>
    </header>
  );
}
