const { Pool } = require('pg');
require('dotenv').config();

const poolConfig = process.env.DATABASE_URL
  ? { connectionString: process.env.DATABASE_URL }
  : {
      user: process.env.PGUSER || 'postgres',
      host: process.env.PGHOST || 'localhost',
      database: process.env.PGDATABASE || 'postgres',
      password: process.env.PGPASSWORD || 'postgres',
      port: parseInt(process.env.PGPORT || '5432', 10),
      connectionTimeoutMillis: 3000,
    };

const pool = new Pool(poolConfig);

let isPostgresConnected = false;

// In-memory relational store fallback if local PostgreSQL credentials are not yet configured
let fallbackBooks = [];
let fallbackIdCounter = 1;

const initDb = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS books (
      id SERIAL PRIMARY KEY,
      google_book_id VARCHAR(255),
      title VARCHAR(500) NOT NULL,
      author VARCHAR(500),
      description TEXT,
      published_date VARCHAR(100),
      category VARCHAR(255),
      thumbnail TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;

  try {
    const client = await pool.connect();
    await client.query(createTableQuery);
    isPostgresConnected = true;
    console.log('✅ PostgreSQL: Connected successfully & "books" table is ready.');
    client.release();
  } catch (error) {
    isPostgresConnected = false;
    console.warn('\n⚠️  PostgreSQL Notice:', error.message);
    console.warn('👉 To connect your live PostgreSQL database, set your credentials in backend/.env');
    console.warn('⚡ Using memory store fallback in the meantime so you can test all features right away.\n');
  }
};

const query = async (text, params = []) => {
  if (isPostgresConnected) {
    return pool.query(text, params);
  }

  // Fallback simulator for SQL queries if PostgreSQL credentials are yet to be updated
  const sql = text.trim();

  // SELECT * FROM books WHERE google_book_id = $1
  if (sql.includes('SELECT * FROM books WHERE google_book_id = $1')) {
    const book = fallbackBooks.find((b) => b.google_book_id === params[0]);
    return { rows: book ? [book] : [] };
  }

  // SELECT * FROM books WHERE id = $1
  if (sql.includes('SELECT * FROM books WHERE id = $1')) {
    const book = fallbackBooks.find((b) => b.id === parseInt(params[0], 10));
    return { rows: book ? [book] : [] };
  }

  // SELECT * FROM books ORDER BY ...
  if (sql.startsWith('SELECT * FROM books')) {
    const sorted = [...fallbackBooks].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return { rows: sorted };
  }

  // INSERT INTO books
  if (sql.startsWith('INSERT INTO books')) {
    const newBook = {
      id: fallbackIdCounter++,
      google_book_id: params[0] || null,
      title: params[1],
      author: params[2],
      description: params[3],
      published_date: params[4],
      category: params[5],
      thumbnail: params[6],
      created_at: new Date().toISOString(),
    };
    fallbackBooks.unshift(newBook);
    return { rows: [newBook] };
  }

  // UPDATE books
  if (sql.startsWith('UPDATE books')) {
    const id = parseInt(params[params.length - 1], 10);
    const index = fallbackBooks.findIndex((b) => b.id === id);
    if (index !== -1) {
      fallbackBooks[index] = {
        ...fallbackBooks[index],
        title: params[0],
        author: params[1],
        description: params[2],
        published_date: params[3],
        category: params[4],
        thumbnail: params[5],
        google_book_id: params[6] || fallbackBooks[index].google_book_id,
      };
      return { rows: [fallbackBooks[index]] };
    }
    return { rows: [] };
  }

  // DELETE FROM books WHERE id = $1
  if (sql.startsWith('DELETE FROM books WHERE id = $1')) {
    const id = parseInt(params[0], 10);
    const index = fallbackBooks.findIndex((b) => b.id === id);
    if (index !== -1) {
      const deleted = fallbackBooks.splice(index, 1)[0];
      return { rows: [deleted] };
    }
    return { rows: [] };
  }

  return { rows: [] };
};

module.exports = {
  pool,
  query,
  initDb,
  isPostgresConnected: () => isPostgresConnected,
};
