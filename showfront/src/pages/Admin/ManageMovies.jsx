import React, { useState, useEffect } from 'react';
import axios from '../../services/axiosInstance';

function ManageMovies() {
  const [mode, setMode] = useState('view');

  const [formData, setFormData] = useState({
    title: '',
    genre: '',
    releaseDate: '',
    duration: '',
    description: '',
    image: null
  });

  const [movieList, setMovieList] = useState([]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'image') {
      setFormData({ ...formData, image: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      genre: '',
      releaseDate: '',
      duration: '',
      description: '',
      image: null
    });
  };

  const handleAdd = async () => {
    const data = new FormData();
    Object.keys(formData).forEach(key => {
      if (formData[key] !== null) data.append(key, formData[key]);
    });

    try {
      const res = await axios.post('/movies', data);
      alert(`🎬 Movie added! ID: ${res.data.movieID}`);
      resetForm();
      fetchMovies();
    } catch (err) {
      console.error(err);
      alert('Failed to add movie');
    }
  };

  const handleUpdate = async () => {
    try {
      const search = await axios.get(`/movies/title/${formData.title}`);
      const movieID = search.data.movieID;
      if (!movieID) throw new Error('Movie not found');

      const data = new FormData();
      Object.keys(formData).forEach(key => {
        if (key !== 'title' && formData[key]) data.append(key, formData[key]);
      });

      await axios.put(`/movies/${movieID}`, data);
      alert('✅ Movie updated!');
      resetForm();
      fetchMovies();
    } catch (err) {
      console.error(err);
      alert('Update failed: ' + err.message);
    }
  };

  const handleDelete = async () => {
    try {
      const search = await axios.get(`/movies/title/${formData.title}`);
      const movieID = search.data.movieID;
      if (!movieID) throw new Error('Movie not found');

      await axios.delete(`/movies/${movieID}`);
      alert('🗑️ Movie deleted!');
      resetForm();
      fetchMovies();
    } catch (err) {
      console.error(err);
      alert('Delete failed: ' + err.message);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title) return alert('Title is required');

    if (mode === 'add') handleAdd();
    if (mode === 'update') handleUpdate();
    if (mode === 'delete') handleDelete();
  };

  const fetchMovies = async () => {
    try {
      const res = await axios.get('/movies');
      setMovieList(res.data);
    } catch (err) {
      console.error('Failed to fetch movies:', err);
    }
  };

  useEffect(() => {
    if (mode === 'view') fetchMovies();
  }, [mode]);

  return (
    <div style={container}>
      <div style={buttonGroup}>
      <button onClick={() => setMode('view')} style={mode === 'view' ? activeBtn : inactiveBtn}>View All</button>
        <button onClick={() => setMode('add')} style={mode === 'add' ? activeBtn : inactiveBtn}>Add</button>
        <button onClick={() => setMode('update')} style={mode === 'update' ? activeBtn : inactiveBtn}>Update</button>
        <button onClick={() => setMode('delete')} style={mode === 'delete' ? activeBtn : inactiveBtn}>Delete</button>
      </div>

      {mode === 'view' ? (
        <div style={movieGrid}>
          {movieList.map((movie) => (
            <div key={movie.movieID} style={movieCard}>
              <img src={movie.imageURL} alt={movie.title} style={movieImage} />
              <h3>{movie.title}</h3>
              <p><strong>Genre:</strong> {movie.genre}</p>
              <p><strong>Release:</strong> {movie.releaseDate}</p>
              <p><strong>Duration:</strong> {movie.duration} min</p>
              <p style={{ fontSize: '14px' }}>{movie.description}</p>
            </div>
          ))}
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={formStyle}>
          <h2 style={titleStyle}>{mode === 'add' ? '🎬 Add Movie' : mode === 'update' ? '✏️ Update Movie' : '🗑️ Delete Movie'}</h2>
          <input name="title" placeholder="Movie Title" value={formData.title} onChange={handleChange} required style={inputStyle} />
          {mode !== 'delete' && (
            <>
              <input name="genre" placeholder="Genre" value={formData.genre} onChange={handleChange} style={inputStyle} />
              <input name="releaseDate" type="date" value={formData.releaseDate} onChange={handleChange} style={inputStyle} />
              <input name="duration" type="number" placeholder="Duration (mins)" value={formData.duration} onChange={handleChange} style={inputStyle} />
              <textarea name="description" placeholder="Description" value={formData.description} onChange={handleChange} style={textareaStyle} />
              <input name="image" type="file" accept="image/*" onChange={handleChange} style={fileInputStyle} />
            </>
          )}
          <button type="submit" style={buttonStyle}>
            {mode === 'add' ? 'Add Movie' : mode === 'update' ? 'Update Movie' : 'Delete Movie'}
          </button>
        </form>
      )}
    </div>
  );
}

// Styling
const container = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  minHeight: '100vh',
  padding: '40px 20px',
  background: 'linear-gradient(to right, #f3e7e9, #e3eeff)'
};

const buttonGroup = {
  display: 'flex',
  gap: '10px',
  marginBottom: '20px',
  flexWrap: 'wrap',
  justifyContent: 'center'
};

const activeBtn = {
  backgroundColor: '#5e35b1',
  color: '#fff',
  fontWeight: 'bold',
  border: 'none',
  borderRadius: '8px',
  padding: '10px 20px',
  cursor: 'pointer'
};

const inactiveBtn = {
  ...activeBtn,
  backgroundColor: '#ddd',
  color: '#333'
};

const formStyle = {
  width: '100%',
  maxWidth: '540px',
  backgroundColor: '#ffffff',
  padding: '2rem 2.5rem',
  borderRadius: '18px',
  boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
  display: 'flex',
  flexDirection: 'column',
  gap: '18px'
};

const titleStyle = {
  textAlign: 'center',
  fontSize: '28px',
  fontWeight: '600',
  color: '#5e35b1'
};

const inputStyle = {
  padding: '14px 16px',
  fontSize: '16px',
  borderRadius: '10px',
  border: '1px solid #ccc',
  outlineColor: '#5e35b1',
  backgroundColor: '#fdfaff',
  width: '100%',
  color: '#000000',
  boxSizing: 'border-box'
};

const textareaStyle = {
  ...inputStyle,
  height: '100px',
  resize: 'vertical'
};

const fileInputStyle = {
  ...inputStyle,
  padding: '10px',
  fontSize: '14px',
  backgroundColor: '#f0eefc',
  cursor: 'pointer'
};

const buttonStyle = {
  padding: '14px',
  backgroundColor: '#5e35b1',
  color: '#fff',
  fontWeight: 'bold',
  fontSize: '16px',
  border: 'none',
  borderRadius: '10px',
  cursor: 'pointer',
  transition: 'background-color 0.3s ease'
};

const movieGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
  gap: '20px',
  width: '100%',
  maxWidth: '1200px',
  padding: '20px'
};

const movieCard = {
  backgroundColor: '#fff',
  borderRadius: '12px',
  boxShadow: '0 8px 20px rgba(0,0,0,0.1)',
  padding: '16px',
  textAlign: 'center'
};

const movieImage = {
  width: '100%',
  height: '280px',
  objectFit: 'cover',
  borderRadius: '10px',
  marginBottom: '12px'
};

export default ManageMovies;
