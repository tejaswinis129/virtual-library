const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const searchBooks = async (query) => {
  const response = await fetch(`${API_BASE_URL}/books/search?query=${encodeURIComponent(query)}`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Error ${response.status}: Failed to search books`);
  }
  return response.json();
};

export const getLibraryBooks = async () => {
  const response = await fetch(`${API_BASE_URL}/library`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Error ${response.status}: Failed to fetch library`);
  }
  return response.json();
};

export const addBookToLibrary = async (bookData) => {
  const response = await fetch(`${API_BASE_URL}/library`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bookData),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    if (response.status === 409) {
      throw new Error(errorData.message || 'Book is already in your library');
    }
    throw new Error(errorData.error || `Error ${response.status}: Failed to add book`);
  }
  return response.json();
};

export const updateLibraryBook = async (id, updatedData) => {
  const response = await fetch(`${API_BASE_URL}/library/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updatedData),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Error ${response.status}: Failed to update book`);
  }
  return response.json();
};

export const deleteLibraryBook = async (id) => {
  const response = await fetch(`${API_BASE_URL}/library/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Error ${response.status}: Failed to delete book`);
  }
  return response.json();
};
