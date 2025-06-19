import React, { useEffect, useState } from 'react';
import api from '../../services/axiosInstance';

const ManageTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [form, setForm] = useState({ showtimeID: '', price: '', availableTickets: 100 });
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const res = await api.get('/tickets');
      setTickets(res.data);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/tickets/${editingId}`, {
          newShowtimeID: form.showtimeID,
          newPrice: form.price,
          newAvailableTickets: form.availableTickets
        });
        setMessage('Ticket updated successfully!');
      } else {
        await api.post('/tickets', form);
        setMessage('Ticket added successfully!');
      }
      setForm({ showtimeID: '', price: '', availableTickets: 100 });
      setEditingId(null);
      fetchTickets();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving ticket:', error);
      setMessage('Something went wrong.');
    }
  };

  const handleEdit = (ticket) => {
    setForm({
      showtimeID: ticket.showtimeID,
      price: ticket.price,
      availableTickets: ticket.availableTickets
    });
    setEditingId(ticket.ticketID);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/tickets/${id}`);
      fetchTickets();
    } catch (error) {
      console.error('Error deleting ticket:', error);
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: '1100px' }}>
      <h2>Manage Tickets</h2>
      {message && <p className="form-success">{message}</p>}
      <form onSubmit={handleSubmit} className="flex-column" style={{ backgroundColor: '#fff', padding: '1rem', borderRadius: '8px', boxShadow: '0 0 8px rgba(0,0,0,0.1)' }}>
        <input name="showtimeID" value={form.showtimeID} onChange={handleChange} placeholder="Showtime ID" required />
        <input name="price" type="number" value={form.price} onChange={handleChange} placeholder="Price" required />
        <input name="availableTickets" type="number" value={form.availableTickets} onChange={handleChange} placeholder="Available Tickets" required />
        <button type="submit" style={{ marginTop: '1rem' }}>{editingId ? 'Update Ticket' : 'Add Ticket'}</button>
      </form>

      <ul>
        {tickets.map((ticket) => (
          <li key={ticket.ticketID} className="flex-row" style={{ background: '#fdfdfd', padding: '1rem', borderRadius: '6px', marginTop: '1rem', boxShadow: '0 0 6px rgba(0,0,0,0.05)', justifyContent: 'space-between' }}>
            <div>
              Showtime {ticket.showtimeID} — Rs {ticket.price} (Available: {ticket.availableTickets})
            </div>
            <div>
              <button onClick={() => handleEdit(ticket)} style={{ marginRight: '0.5rem' }}>Edit</button>
              <button onClick={() => handleDelete(ticket.ticketID)}>Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ManageTickets;
