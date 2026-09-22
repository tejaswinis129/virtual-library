const express = require('express');
const { query } = require('../db');
const router = express.Router();

// GET /api/library - Returns all books saved in the PostgreSQL database
router.get('/', async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM books ORDER BY created_at DESC, id DESC'
    );
    return res.json(result.rows);
  } catch (error) {
    console.error('Error fetching library books:', error.message);
    return res.status(500).json({ error: 'Failed to fetch library books', details: error.message });
  }
});

// POST /api/library - Adds a selected real-world book to the user's library
router.post('/', async (req, res) => {
  try {
    const {
      google_book_id,
      title,
      author,
      description,
      published_date,
      category,
      thumbnail,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Book title is required' });
    }

    // Optional check: If google_book_id is provided, check if it's already in the library
    if (google_book_id) {
      const existing = await query('SELECT * FROM books WHERE google_book_id = $1', [google_book_id]);
      if (existing.rows.length > 0) {
        return res.status(409).json({
          message: 'This book is already in your library!',
          book: existing.rows[0],
        });
      }
    }

    const insertQuery = `
      INSERT INTO books (google_book_id, title, author, description, published_date, category, thumbnail)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;

    const values = [
      google_book_id || null,
      title.trim(),
      author ? author.trim() : 'Unknown Author',
      description ? description.trim() : '',
      published_date ? published_date.trim() : 'N/A',
      category ? category.trim() : 'General',
      thumbnail || '',
    ];

    const result = await query(insertQuery, values);
    return res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error adding book to library:', error.message);
    return res.status(500).json({ error: 'Failed to add book to library', details: error.message });
  }
});

// PUT /api/library/:id - Updates a saved book using its database ID
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      author,
      description,
      published_date,
      category,
      thumbnail,
      google_book_id,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Book title cannot be empty' });
    }

    // Check if book exists
    const checkBook = await query('SELECT * FROM books WHERE id = $1', [id]);
    if (checkBook.rows.length === 0) {
      return res.status(404).json({ error: `Book with id ${id} not found` });
    }

    const current = checkBook.rows[0];

    const updateQuery = `
      UPDATE books
      SET
        title = $1,
        author = $2,
        description = $3,
        published_date = $4,
        category = $5,
        thumbnail = $6,
        google_book_id = COALESCE($7, google_book_id)
      WHERE id = $8
      RETURNING *;
    `;

    const values = [
      title.trim(),
      author !== undefined ? author.trim() : current.author,
      description !== undefined ? description.trim() : current.description,
      published_date !== undefined ? published_date.trim() : current.published_date,
      category !== undefined ? category.trim() : current.category,
      thumbnail !== undefined ? thumbnail : current.thumbnail,
      google_book_id || null,
      id,
    ];

    const result = await query(updateQuery, values);
    return res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating book:', error.message);
    return res.status(500).json({ error: 'Failed to update book', details: error.message });
  }
});

// DELETE /api/library/:id - Deletes a saved book using its database ID
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const deleteQuery = 'DELETE FROM books WHERE id = $1 RETURNING *;';
    const result = await query(deleteQuery, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: `Book with id ${id} not found` });
    }

    return res.json({
      message: 'Book successfully removed from your library',
      deleted_book: result.rows[0],
    });
  } catch (error) {
    console.error('Error deleting book:', error.message);
    return res.status(500).json({ error: 'Failed to delete book', details: error.message });
  }
});

module.exports = router;
