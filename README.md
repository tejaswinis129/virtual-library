# 📚 Lumina — Virtual Library Full-Stack Application

A modern, full-stack **Virtual Library** application allowing users to search real-world books using the **Google Books API** and manage their personal library stored in **PostgreSQL**.

---

## 🚀 Features

- **Google Books API Search**: Search real-world books by title, author, or keyword with fallback resilience.
- **Rich Book Metadata**: Displays book cover, title, authors, synopsis, publication year, and category.
- **Personal Library Management**: Add books from search results or create custom volumes.
- **Edit & Update**: Update book metadata (title, author, category, published date, personal reading notes) stored in PostgreSQL.
- **Delete from Library**: One-click deletion with confirmation dialog.
- **Database Schema**: Structured `books` table in PostgreSQL with automatic table creation.
- **Modern UI / UX**: Glassmorphism aesthetic, dark mode, responsive layout, toast notifications, search suggestions, and skeleton loading states.

---

## 🛠️ Tech Stack

- **Frontend**: React (Vite), Vanilla CSS (Design tokens, glassmorphism, responsive grid), Lucide Icons
- **Backend**: Node.js & Express.js REST API
- **Database**: PostgreSQL (`pg` driver with auto-migration)
- **Deployment**: Docker, Docker Compose, Render Blueprint, Single-port Static Production Serving

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/books/search?query=:query` | Search Google Books API for matching real-world books |
| `GET` | `/api/library` | Get all books saved in PostgreSQL |
| `POST` | `/api/library` | Add a selected book to the personal library |
| `PUT` | `/api/library/:id` | Update a saved book's details by its database ID |
| `DELETE` | `/api/library/:id` | Delete a saved book from the library by its database ID |
| `GET` | `/api/health` | Health check endpoint |

---

## 🗄️ Database Schema (`books` table)

```sql
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
```

---

## 🏁 Running Locally (Currently Active)

Both services are configured and running:

- **Frontend Application**: [http://localhost:5173](http://localhost:5173)
- **Backend API Server**: [http://localhost:5000](http://localhost:5000)

To start them manually in separate terminals:
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

---

## 🚢 Deployment Options

### Option 1: One-Command Docker Deployment (Local or VPS)
Build and spin up the complete application container along with an isolated PostgreSQL database:
```bash
docker compose up --build -d
```
*Accessible on `http://localhost:5000`.*

### Option 2: Render / Railway / Fly.io / Heroku
The backend includes built-in static asset serving for `frontend/dist`.
1. Push this repository to GitHub.
2. In **Render** or **Railway**, create a new Web Service and link your repo.
3. Use the included `render.yaml` or set:
   - **Build Command**: `cd backend && npm install && cd ../frontend && npm install && npm run build`
   - **Start Command**: `cd backend && node src/index.js`
   - **Environment Variable**: `DATABASE_URL` (from your managed PostgreSQL instance)
