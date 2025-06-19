import React, { useEffect, useState } from 'react';
import api from '../../services/axiosInstance';

const ManageScreens = () => {
  const [screens, setScreens] = useState([]);
  const [form, setForm] = useState({ theatreID: '', screenName: '', totalSeats: '' });
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchScreens();
  }, []);

  const fetchScreens = async () => {
    try {
      const res = await api.get('/screens');
      setScreens(res.data);
    } catch (error) {
      console.error('Error fetching screens:', error);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/screens/${editingId}`, {
          newTheatreID: form.theatreID,
          newScreenName: form.screenName,
          newTotalSeats: form.totalSeats
        });
        setMessage('Screen updated successfully!');
      } else {
        await api.post('/screens', form);
        setMessage('Screen added successfully!');
      }
      setForm({ theatreID: '', screenName: '', totalSeats: '' });
      setEditingId(null);
      fetchScreens();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving screen:', error);
      setMessage('Something went wrong.');
    }
  };

  const handleEdit = (screen) => {
    setForm({
      theatreID: screen.theatreID,
      screenName: screen.screenName,
      totalSeats: screen.totalSeats
    });
    setEditingId(screen.screenID);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/screens/${id}`);
      fetchScreens();
    } catch (error) {
      console.error('Error deleting screen:', error);
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: '1100px' }}>
      <h2>Manage Screens</h2>
      {message && <p className="form-success">{message}</p>}
      <form onSubmit={handleSubmit} className="flex-column" style={{ backgroundColor: '#fff', padding: '1rem', borderRadius: '8px', boxShadow: '0 0 8px rgba(0,0,0,0.1)' }}>
        <input name="theatreID" value={form.theatreID} onChange={handleChange} placeholder="Theatre ID" required />
        <input name="screenName" value={form.screenName} onChange={handleChange} placeholder="Screen Name" required />
        <input name="totalSeats" type="number" value={form.totalSeats} onChange={handleChange} placeholder="Total Seats" required />
        <button type="submit" style={{ marginTop: '1rem' }}>{editingId ? 'Update Screen' : 'Add Screen'}</button>
      </form>

      <ul>
        {screens.map((screen) => (
          <li key={screen.screenID} className="flex-row" style={{ background: '#fdfdfd', padding: '1rem', borderRadius: '6px', marginTop: '1rem', boxShadow: '0 0 6px rgba(0,0,0,0.05)', justifyContent: 'space-between' }}>
            <div>
              <strong>{screen.screenName}</strong> — Theatre ID: {screen.theatreID} (Seats: {screen.totalSeats})
            </div>
            <div>
              <button onClick={() => handleEdit(screen)} style={{ marginRight: '0.5rem' }}>Edit</button>
              <button onClick={() => handleDelete(screen.screenID)}>Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ManageScreens;