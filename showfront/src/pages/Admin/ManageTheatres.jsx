import React, { useEffect, useState } from 'react';
import api from '../../services/axiosInstance';

const ManageTheatres = () => {
  const [theatres, setTheatres] = useState([]);
  const [form, setForm] = useState({ theatreName: '', theatreLocation: '', totalSeats: '' });
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchTheatres();
  }, []);

  const fetchTheatres = async () => {
    try {
      const res = await api.get('/theatres');
      setTheatres(res.data);
      console.log('Theatres fetched:', res.data);
    } catch (error) {
      console.error('Error fetching theatres:', error); 
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        const res = await api.put(`/theatres/${editingId}`, form);
        console.log('Theatre updated:', res.data); 
        setMessage('Theatre updated successfully!');
      } else {
        const res = await api.post('/theatres', form);
        console.log('Theatre added:', res.data); 
        setMessage('Theatre added successfully!');
      }
      console.log('Form data:', form);
      setForm({ theatreName: '', theatreLocation: '', totalSeats: '' });
      setEditingId(null);
      fetchTheatres();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error:', error); 
      setMessage('Something went wrong.');
    }
  };

  const handleEdit = (theatre) => {
    console.log('Editing ID:', theatre.theatreID); 
    setForm({
      theatreName: theatre.theatreName,
      theatreLocation: theatre.theatreLocation,
      totalSeats: theatre.totalSeats
    });
    setEditingId(theatre.theatreID);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/theatres/${id}`);
      console.log('Theatre deleted:', id);
      fetchTheatres();
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: '1100px' }}>
      <h2>Manage Theatres</h2>
      {message && <p className="form-success">{message}</p>}
      <form onSubmit={handleSubmit} className="flex-column" style={{
        backgroundColor: '#fff',
        padding: '1rem',
        borderRadius: '8px',
        boxShadow: '0 0 8px rgba(0,0,0,0.1)'
      }}>
        <input
          name="theatreName"
          value={form.theatreName}
          onChange={handleChange}
          placeholder="Theatre Name"
          required
        />
        <input
          name="theatreLocation"
          value={form.theatreLocation}
          onChange={handleChange}
          placeholder="Location"
          required
        />
        <input
          name="totalSeats"
          type="number"
          value={form.totalSeats}
          onChange={handleChange}
          placeholder="Total Seats"
          required
        />
        <button type="submit" style={{ marginTop: '1rem' }}>
          {editingId ? 'Update Theatre' : 'Add Theatre'}
        </button>
      </form>

      <ul>
        {theatres.map((theatre) => (
          <li key={theatre.theatreID} className="flex-row" style={{
            background: '#fdfdfd',
            padding: '1rem',
            borderRadius: '6px',
            marginTop: '1rem',
            boxShadow: '0 0 6px rgba(0,0,0,0.05)',
            justifyContent: 'space-between'
          }}>
            <div>
              <strong>{theatre.theatreName}</strong> — {theatre.theatreLocation} (Seats: {theatre.totalSeats})
            </div>
            <div>
              <button onClick={() => handleEdit(theatre)} style={{ marginRight: '0.5rem' }}>Edit</button>
              <button onClick={() => handleDelete(theatre.theatreID)}>Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ManageTheatres;
