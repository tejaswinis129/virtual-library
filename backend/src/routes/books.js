const express = require('express');
const axios = require('axios');
const router = express.Router();

// Curated book catalog for instant reliability if external APIs hit rate-limits (HTTP 429)
const CURATED_FALLBACKS = [
  {
    google_book_id: 'bk_hp1',
    title: "Harry Potter and the Sorcerer's Stone",
    author: 'J.K. Rowling',
    description: 'Harry Potter has never even heard of Hogwarts when the letters start dropping on the doormat at number four, Privet Drive. Addressed in green ink on yellowish parchment with a purple seal, they are swiftly confiscated by his aunt and uncle.',
    published_date: '1997-06-26',
    category: 'Fantasy & Magic',
    thumbnail: 'https://images.unsplash.com/photo-1618666012174-83b441c0bc76?auto=format&fit=crop&q=80&w=400',
    page_count: 309,
    language: 'en',
    preview_link: 'https://books.google.com',
    info_link: 'https://books.google.com',
  },
  {
    google_book_id: 'bk_cc1',
    title: 'Clean Code: A Handbook of Agile Software Craftsmanship',
    author: 'Robert C. Martin',
    description: 'Even bad code can function. But if code isn\'t clean, it can bring a development organization to its knees. Every year, countless hours and significant resources are lost because of poorly written code.',
    published_date: '2008-08-01',
    category: 'Computers & Technology',
    thumbnail: 'https://images.unsplash.com/photo-1532012164546-f432f2e3edd3?auto=format&fit=crop&q=80&w=400',
    page_count: 464,
    language: 'en',
    preview_link: 'https://books.google.com',
    info_link: 'https://books.google.com',
  },
  {
    google_book_id: 'bk_dn1',
    title: 'Dune: Deluxe Edition',
    author: 'Frank Herbert',
    description: 'Set on the desert planet Arrakis, Dune is the story of the boy Paul Atreides, heir to a noble family tasked with ruling an inhospitable world where the only thing of value is the "spice" melange.',
    published_date: '1965-08-01',
    category: 'Science Fiction',
    thumbnail: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400',
    page_count: 688,
    language: 'en',
    preview_link: 'https://books.google.com',
    info_link: 'https://books.google.com',
  },
  {
    google_book_id: 'bk_ah1',
    title: 'Atomic Habits: Tiny Changes, Remarkable Results',
    author: 'James Clear',
    description: 'No matter your goals, Atomic Habits offers a proven framework for improving--every day. James Clear, one of the world\'s leading experts on habit formation, reveals practical strategies that will teach you exactly how to form good habits.',
    published_date: '2018-10-16',
    category: 'Self-Help & Psychology',
    thumbnail: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=400',
    page_count: 320,
    language: 'en',
    preview_link: 'https://books.google.com',
    info_link: 'https://books.google.com',
  },
  {
    google_book_id: 'bk_pm1',
    title: 'The Psychology of Money',
    author: 'Morgan Housel',
    description: 'Doing well with money isn\'t necessarily about what you know. It\'s about how you behave. And behavior is hard to teach, even to really smart people.',
    published_date: '2020-09-08',
    category: 'Finance & Business',
    thumbnail: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=400',
    page_count: 252,
    language: 'en',
    preview_link: 'https://books.google.com',
    info_link: 'https://books.google.com',
  },
  {
    google_book_id: 'bk_sp1',
    title: 'Sapiens: A Brief History of Humankind',
    author: 'Yuval Noah Harari',
    description: 'One hundred thousand years ago, at least six different species of humans inhabited Earth. Yet today there is only one--homo sapiens. What happened to the others? And what may happen to us?',
    published_date: '2014-09-04',
    category: 'History & Anthropology',
    thumbnail: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=400',
    page_count: 443,
    language: 'en',
    preview_link: 'https://books.google.com',
    info_link: 'https://books.google.com',
  },
];

// Fallback search using OpenLibrary API
async function searchOpenLibrary(query, limit = 20) {
  try {
    const res = await axios.get('https://openlibrary.org/search.json', {
      params: { q: query, limit },
      timeout: 5000,
    });
    const docs = res.data.docs || [];
    return docs.map((doc) => {
      const coverId = doc.cover_i;
      const thumbnail = coverId
        ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`
        : 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400';
      return {
        google_book_id: doc.key ? doc.key.replace('/works/', '') : `ol_${Math.random().toString(36).substring(7)}`,
        title: doc.title || 'Untitled',
        author: Array.isArray(doc.author_name) ? doc.author_name.join(', ') : 'Unknown Author',
        description: doc.first_sentence ? (Array.isArray(doc.first_sentence) ? doc.first_sentence[0] : doc.first_sentence) : 'A notable title in global catalog archives.',
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
        timeout: 6000,
      });
      items = response.data.items || [];
      totalItems = response.data.totalItems || 0;
    } catch (googleError) {
      console.warn(`Google Books API request throttled (${googleError.message}). Using backup search...`);
      const fallbackResults = await searchOpenLibrary(trimmedQuery, params.maxResults);
      if (fallbackResults.length > 0) {
        return res.json({
          total_items: fallbackResults.length,
          source: 'openlibrary_backup',
          books: fallbackResults,
        });
      }

      // Filter from curated catalog
      const matchingCurated = CURATED_FALLBACKS.filter(
        (b) =>
          b.title.toLowerCase().includes(trimmedQuery.toLowerCase()) ||
          b.author.toLowerCase().includes(trimmedQuery.toLowerCase()) ||
          b.category.toLowerCase().includes(trimmedQuery.toLowerCase())
      );

      const returnedCurated = matchingCurated.length > 0 ? matchingCurated : CURATED_FALLBACKS;

      return res.json({
        total_items: returnedCurated.length,
        source: 'curated_catalog',
        books: returnedCurated,
      });
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
