import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';   
import api from '../../services/axiosInstance';
import '../../styles/MovieDetail.css';

const MovieDetailPage = () => {
  const { id } = useParams();
  const { search } = useLocation();
  const nav = useNavigate();
  const theatreID = Number(new URLSearchParams(search).get('theatreID'));

  const [movie, setMovie] = useState({});
  const [showtimes, setTimes] = useState([]);
  const [screens, setScreens] = useState([]);
  const [selectedShow, setShow] = useState('');
  const [seatList, setSeatList] = useState([]);
  const [chosen, setChosen] = useState([]);
  const [payMethod, setPay] = useState('Cash');
  const [openForm, setOpen] = useState(false);

  useEffect(() => {
    api.get(`/movieDetails/${id}`).then(r => setMovie(r.data));
  }, [id]);

  useEffect(() => {
    const loadShowtimes = async () => {
      try {
        const { data: allShowtimes } = await api.get('/showtimesForBooking');
        const { data: allScreens } = await api.get('/screens');
        const { data: allTickets } = await api.get('/tickets/prices');

        const filtered = allShowtimes
          .filter(s => s.movieID === Number(id) && s.theatreID === theatreID)
          .map(st => {
            const screen = allScreens.find(scr => scr.screenID === st.screenID);
            const ticket = allTickets.find(t => t.showtimeID === st.showtimeID);
            return {
              ...st,
              screenName: screen?.screenName || screen?.name || screen?.label || 'Screen',
              price: ticket?.price || 'N/A'
            };
          });

        setScreens(allScreens);
        setTimes(filtered);
      } catch (err) {
        console.error("Error loading showtimes/screens/tickets:", err);
      }
    };

    loadShowtimes();
  }, [id, theatreID]);

  useEffect(() => {
    if (!selectedShow) return;
    (async () => {
      const { data: layout } = await api.get('/seatLayout');
      const { data: all } = await api.get('/showtimes');
      const st = all.find(s => s.showtimeID === Number(selectedShow));
      if (st) setSeatList(layout.filter(seat => seat.screenID === st.screenID));
    })();
  }, [selectedShow]);

  const formatTime = (timeStr) => {
  if (!timeStr || typeof timeStr !== 'string') return 'Invalid Time';
  try {
    const [hourStr, minuteStr] = timeStr.split(':');
    const hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);
    if (isNaN(hour) || isNaN(minute)) return 'Invalid Time';
    const date = new Date();
    date.setHours(hour);
    date.setMinutes(minute);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  } catch (err) {
    return 'Invalid Time';
  }
};

  const toggleSeat = seatID =>
    setChosen(c => c.includes(seatID) ? c.filter(x => x !== seatID) : [...c, seatID]);

  const confirmBooking = async () => {
    const userID = localStorage.getItem('userID');
    if (!userID) return alert('Login first');
    if (!selectedShow || !chosen.length) return alert('Select showtime & seats');

    try {
      const res = await api.post('/book', {
        userID,
        showtimeID: selectedShow,
        seatIDs: chosen,
        paymentMethod: payMethod
      });

      if (res.data.success) {
        nav(`/receipt/${res.data.bookingID}`);
      }
    } catch (err) {
      console.error(err);
      alert('Booking failed');
    }
  };

  return (
    <div style={page}>
      <h2 style={header}>{movie.title}</h2>

      <div style={box}>
        <img
          src={movie.imageURL || '/default-poster.jpg'}
          alt={movie.title}
          style={poster}
          onError={e => { e.target.src = '/default-poster.jpg'; }}
        />

        <div style={{ flex: 1, minWidth: '260px' }}>
          <p><strong>Genre:</strong> {movie.genre}</p>
          <p><strong>Release:</strong> {movie.releaseDate && new Date(movie.releaseDate).toLocaleDateString()}</p>
          <p><strong>Duration:</strong> {movie.duration} mins</p>
          <p>{movie.description || 'No description available.'}</p>

          <button style={btn} onClick={() => setOpen(!openForm)}>
            {openForm ? 'Close' : 'Book Now'}
          </button>

          {openForm && (
            <div style={form}>
              <h4 style={{ marginBottom: '1rem', color: '#5e35b1' }}>🎟️ Book Tickets</h4>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontWeight: 'bold', color: '#5e35b1' }}>Showtime:</label>
                <select value={selectedShow} onChange={e => setShow(e.target.value)} style={sel}>
                  <option value="">-- Select Showtime --</option>
                  {showtimes.map(s => (
                    <option key={s.showtimeID} value={s.showtimeID}>
                      {new Date(s.showDate).toLocaleDateString()} @ {formatTime(s.showStartTime)} – {formatTime(s.showEndTime)} | {s.screenName} — Rs {s.price}
                    </option>
                  ))}
                </select>
              </div>

              {seatList.length > 0 && (
                <>
                  <label style={{ fontWeight: 'bold', color: '#5e35b1' }}>Seats:</label>
                  <div className="seat-grid">
                    {seatList
                    .sort((a, b) =>
                        a.seatRow === b.seatRow
                          ? a.seatNumber - b.seatNumber
                          : a.seatRow.localeCompare(b.seatRow))
                      .map(st => (
                        <div
                          key={st.seatID}
                          className={`seat-box ${chosen.includes(st.seatID) ? 'selected' : ''}`}
                          onClick={() => toggleSeat(st.seatID)}
                        >
                          {st.seatRow}{st.seatNumber}
                        </div>
                      ))}
                  </div>
                </>
              )}

              <div style={{ marginTop: '1.2rem', marginBottom: '1rem' }}>
                <label style={{ fontWeight: 'bold', color: '#5e35b1' }}>Payment:</label>
                <select value={payMethod} onChange={e => setPay(e.target.value)} style={sel}>
                  <option value="Cash">Cash</option>
                  <option value="Online">Online</option>
                </select>
              </div>

              <button style={{ ...btn, marginTop: '1rem' }} onClick={confirmBooking}>
                Confirm Booking
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const page   = { padding: '2rem', background: 'linear-gradient(to right,#f3e7e9,#e3eeff)', minHeight: '100vh' };
const header = { color: '#5e35b1', marginBottom: '1.5rem' };
const box    = { display: 'flex', gap: '2rem', background: '#fff', borderRadius: '12px',
                 padding: '2rem', boxShadow: '0 4px 12px rgba(0,0,0,.1)', flexWrap: 'wrap' };
const poster = { width: '260px', height: '380px', objectFit: 'cover', borderRadius: '10px',
                 boxShadow: '0 3px 8px rgba(0,0,0,.12)' };
const btn    = { background: '#8E4585', color: '#fff', border: 'none', padding: '.7rem 1.4rem',
                 borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginTop: '1rem' };
const form   = { marginTop: '1.5rem', background: '#fafafa', borderRadius: '12px', padding: '1.5rem' };
const sel = {
  padding: '0.8rem',
  borderRadius: '8px',
  border: '1px solid #bbb',
  fontSize: '1rem',
  margin: '.7rem 0',
  width: '100%',
  background: '#fff',
  boxShadow: '0 2px 4px rgba(0,0,0,.05)',
  appearance: 'none',
  cursor: 'pointer',
  minWidth: '100%',
  maxWidth: '100%'
};;

export default MovieDetailPage;
