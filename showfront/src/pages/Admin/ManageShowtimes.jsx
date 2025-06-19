import React, { useEffect, useState } from 'react';
import api from '../../services/axiosInstance';

const ManageShowtimes = () => {
  const [showtimes, setShowtimes] = useState([]);
  const [movies, setMovies] = useState([]);
  const [screens, setScreens] = useState([]);
  const [theatres, setTheatres] = useState([]);
  const [form, setForm] = useState({ movieID: '', screenID: '', showDate: '', showStartTime: '', showEndTime: '', availableSeats: 100 });
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchShowtimes();
    fetchMovies();
    fetchScreens();
    fetchTheatres();
  }, []);

  const fetchShowtimes = async () => {
    try {
      const res = await api.get('/showtimes');
      setShowtimes(res.data);
    } catch (error) {
      console.error('Error fetching showtimes:', error);
    }
  };

  const fetchMovies = async () => {
    try {
      const res = await api.get('/movies');
      setMovies(res.data);
    } catch (error) {
      console.error('Error fetching movies:', error);
    }
  };

  const fetchScreens = async () => {
    try {
      const res = await api.get('/screens');
      setScreens(res.data);
    } catch (error) {
      console.error('Error fetching screens:', error);
    }
  };

  const fetchTheatres = async () => {
    try {
      const res = await api.get('/theatres');
      setTheatres(res.data);
    } catch (error) {
      console.error('Error fetching theatres:', error);
    }
  };

  const getMovieName = (id) => {
    const movie = movies.find(m => m.movieID === id);
    return movie ? `${movie.title} (ID: ${movie.movieID})` : `Movie ${id}`;
  };

  const getTheatreScreenInfo = (screenID) => {
    const screen = screens.find(s => s.screenID === screenID);
    const theatre = screen && theatres.find(t => t.theatreID === screen.theatreID);
    if (!screen || !theatre) return 'Unavailable';
    return `${theatre.theatreName} (ID: ${theatre.theatreID}), Screen: ${screen.screenName}`;
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/showtimes/${editingId}`, {
          newMovieID: form.movieID,
          newScreenID: form.screenID,
          newShowDate: form.showDate,
          newShowStartTime: form.showStartTime,
          newShowEndTime: form.showEndTime,
          newAvailableSeats: form.availableSeats
        });
        setMessage('Showtime updated successfully!');
      } else {
        await api.post('/showtimes', form);
        setMessage('Showtime added successfully!');
      }
      setForm({ movieID: '', screenID: '', showDate: '', showStartTime: '', showEndTime: '', availableSeats: 100 });
      setEditingId(null);
      fetchShowtimes();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving showtime:', error);
      setMessage('Something went wrong.');
    }
  };

  const handleEdit = (showtime) => {
    setForm({
      movieID: showtime.movieID,
      screenID: showtime.screenID,
      showDate: showtime.showDate?.slice(0, 10),
      showStartTime: showtime.showStartTime,
      showEndTime: showtime.showEndTime,
      availableSeats: showtime.availableSeats
    });
    setEditingId(showtime.showtimeID);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/showtimes/${id}`);
      fetchShowtimes();
    } catch (error) {
      console.error('Error deleting showtime:', error);
    }
  };

  const formatTime = (time) => {
    if (!time) return '';
    const date = new Date(time);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB');
  };

  return (
    <div className="page-container" style={{ maxWidth: '1100px' }}>
      <h2>Manage Showtimes</h2>
      {message && <p className="form-success">{message}</p>}
      <form onSubmit={handleSubmit} className="flex-column" style={{ backgroundColor: '#fff', padding: '1rem', borderRadius: '8px', boxShadow: '0 0 8px rgba(0,0,0,0.1)' }}>
        <input name="movieID" value={form.movieID} onChange={handleChange} placeholder="Movie ID" required />
        <input name="screenID" value={form.screenID} onChange={handleChange} placeholder="Screen ID" required />
        <input name="showDate" type="date" value={form.showDate} onChange={handleChange} required />
        <input name="showStartTime" type="time" value={form.showStartTime} onChange={handleChange} required />
        <input name="showEndTime" type="time" value={form.showEndTime} onChange={handleChange} required />
        <input name="availableSeats" type="number" value={form.availableSeats} onChange={handleChange} required />
        <button type="submit" style={{ marginTop: '1rem' }}>{editingId ? 'Update Showtime' : 'Add Showtime'}</button>
      </form>

      <ul>
        {showtimes.map((show) => (
          <li key={show.showtimeID} className="flex-row" style={{ background: '#fdfdfd', padding: '1rem', borderRadius: '6px', marginTop: '1rem', boxShadow: '0 0 6px rgba(0,0,0,0.05)', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong>{getMovieName(show.movieID)}</strong> (Showtime ID: {show.showtimeID})<br />
              {formatDate(show.showDate)} at {formatTime(show.showStartTime)} - {formatTime(show.showEndTime)}<br />
              (Theatre: {getTheatreScreenInfo(show.screenID)}, Seats: {show.availableSeats})
            </div>
            <div className="flex-column" style={{ gap: '0.5rem' }}>
              <button onClick={() => handleEdit(show)} style={{ background: '#9b59b6', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px' }}>Edit</button>
              <button onClick={() => handleDelete(show.showtimeID)} style={{ background: '#e74c3c', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px' }}>Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ManageShowtimes;