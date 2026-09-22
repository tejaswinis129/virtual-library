const express = require('express');
const axios = require('axios');
const router = express.Router();

// Fallback search using OpenLibrary API if Google Books hits rate limits (429)
async function searchOpenLibrary(query, limit = 20) {
  try {
    const res = await axios.get('https://openlibrary.org/search.json', {
      params: { q: query, limit },
      timeout: 8000,
    });
    const docs = res.data.docs || [];
    return docs.map((doc) => {
      const coverId = doc.cover_i;
      const thumbnail = coverId
        ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`
        : '';
      return {
        google_book_id: doc.key ? doc.key.replace('/works/', '') : `ol_${Math.random().toString(36).substring(7)}`,
        title: doc.title || 'Untitled',
        author: Array.isArray(doc.author_name) ? doc.author_name.join(', ') : 'Unknown Author',
        description: doc.first_sentence ? (Array.isArray(doc.first_sentence) ? doc.first_sentence[0] : doc.first_sentence) : 'A notable publication available in public libraries.',
        published_date: doc.first_publish_year ? String(doc.first_publish_year) : 'N/A',
        category: Array.isArray(doc.subject) && doc.subject.length > 0 ? doc.subject[0] : 'General',
        thumbnail,
        page_count: doc.number_of_pages_median || null,
        language: doc.language ? doc.language[0] : 'en',
        preview_link: `https://openlibrary.org${doc.key || ''}`,
        info_link: `https://openlibrary.org${doc.key || ''}`,
      };
    });
  } catch (err) {
    console.warn('OpenLibrary fallback also failed:', err.message);
    return [];
  }
}

// GET /api/books/search?query=harry
router.get('/search', async (req, res) => {
  try {
    const { query, maxResults = 24 } = req.query;

    if (!query || !query.trim()) {
      return res.status(400).json({ error: 'Search query parameter is required (e.g. ?query=harry)' });
    }

    const trimmedQuery = query.trim();
    const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
    const params = {
      q: trimmedQuery,
      maxResults: Math.min(parseInt(maxResults, 10) || 24, 40),
      printType: 'books',
    };
    if (apiKey) {
      params.key = apiKey;
    }

    let items = [];
    let totalItems = 0;

    try {
      const response = await axios.get('https://www.googleapis.com/books/v1/volumes', {
        params,
        timeout: 8000,
      });
      items = response.data.items || [];
      totalItems = response.data.totalItems || 0;
    } catch (googleError) {
      console.warn(`Google Books API returned error (${googleError.message}). Attempting OpenLibrary fallback...`);
      const fallbackResults = await searchOpenLibrary(trimmedQuery, params.maxResults);
      if (fallbackResults.length > 0) {
        return res.json({
          total_items: fallbackResults.length,
          source: 'openlibrary',
          books: fallbackResults,
        });
      }
      throw googleError;
    }

    const formattedBooks = items.map((item) => {
      const volumeInfo = item.volumeInfo || {};
      const imageLinks = volumeInfo.imageLinks || {};

      let thumbnail = imageLinks.thumbnail || imageLinks.smallThumbnail || '';
      if (thumbnail.startsWith('http:')) {
        thumbnail = thumbnail.replace('http:', 'https:');
      }

      return {
        google_book_id: item.id || '',
        title: volumeInfo.title || 'Untitled',
        author: Array.isArray(volumeInfo.authors) ? volumeInfo.authors.join(', ') : (volumeInfo.authors || 'Unknown Author'),
        description: volumeInfo.description || '',
        published_date: volumeInfo.publishedDate || 'N/A',
        category: Array.isArray(volumeInfo.categories) && volumeInfo.categories.length > 0 ? volumeInfo.categories[0] : 'General',
        thumbnail,
        page_count: volumeInfo.pageCount || null,
        language: volumeInfo.language || 'en',
        preview_link: volumeInfo.previewLink || '',
        info_link: volumeInfo.infoLink || '',
      };
    });

    return res.json({
      total_items: totalItems,
      source: 'google_books',
      books: formattedBooks,
    });
  } catch (error) {
    console.error('Error in books search route:', error.message);
    return res.status(500).json({
      error: 'Failed to search books API',
      details: error.message,
    });
  }
});

module.exports = router;
