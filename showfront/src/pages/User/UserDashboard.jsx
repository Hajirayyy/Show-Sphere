import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/axiosInstance';
import MovieListPage from '../Movies/MovieListPage';
import BookingHistory from './BookingHistory';
import AddReview from './AddReview';
import UserReviews from './UserReviews';

const UserDashboard = () => {
  const [userName, setUserName] = useState('');
  const [active, setActive] = useState('home');
  const [open, setOpen] = useState(true);
  const [theatres, setTheatres] = useState([]);
  const [selID, setSelID] = useState('');
  const [top, setTop] = useState([]);

  const nav = useNavigate();

  useEffect(() => {
    api.get('/me').then(r => setUserName(r.data.userName)).catch(() => nav('/'));
    api.get('/theatres').then(r => setTheatres(r.data));
    api.get('/topRatedMovies').then(r => setTop(r.data));
  }, [nav]);

  const logout = () => api.post('/logout').then(() => {
    localStorage.clear();
    nav('/');
  });

  const goDelete = () => nav('/delete-account');

  const N = ({ onClick, icon, label, isActive }) => (
    <button onClick={onClick} style={{ ...st.link, ...(isActive && st.linkActive) }}>
      {icon} {label}
    </button>
  );

  return (
    <div style={st.wrapper}>
      <div style={st.topBar}>
        <button style={st.burger} onClick={() => setOpen(!open)}>☰</button>
        <button style={st.logout} onClick={logout}>Logout</button>
      </div>

      {open && (
        <aside style={st.sidebar}>
          <h2 style={st.logo}>ShowSphere</h2>
          <nav style={st.nav}>
            <N onClick={() => setActive('home')} icon="🏠" label="Dashboard" isActive={active === 'home'} />
            <N onClick={() => setActive('book')} icon="🎟️" label="Book Tickets" isActive={active === 'book'} />
            <N onClick={() => setActive('history')} icon="📜" label="Booking History" isActive={active === 'history'} />
            <N onClick={() => setActive('review')} icon="💬" label="Add Review" isActive={active === 'review'} />
            <N onClick={() => setActive('myreviews')} icon="📝" label="My Reviews" isActive={active === 'myreviews'} />
            <N onClick={goDelete} icon="🗑️" label="Delete Account" isActive={false} />
          </nav>
        </aside>
      )}

      <main style={{ ...st.main, marginLeft: open ? 260 : 0 }}>
        {active === 'home' && (
          <section style={st.box}>
            <h1 style={st.heading}>Welcome, {userName} 👋</h1>
            <p style={{ fontSize: '1.05rem', color: '#444' }}>
              Check out the highest‑rated movies right now!
            </p>
            <h2 style={{ margin: '2rem 0 1rem' }}>Your Must Watches</h2>
            <div style={st.movieGrid}>
              {top.map(m => (
                <div key={m.movieID} style={st.movieCard}>
                  <img
                    src={m.imageURL || '/default-poster.jpg'}
                    alt={m.title}
                    style={st.movieImg}
                    onError={e => (e.target.src = '/default-poster.jpg')}
                  />
                  <p style={{ fontWeight: 'bold', margin: '.5rem 0 0' }}>{m.title}</p>
                  <p style={{ fontSize: '.85rem', color: '#666' }}>⭐ {Number(m.AvgRating).toFixed(1)}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {active === 'book' && (
          <section style={st.box}>
            <h2 style={st.heading}>Select a Theatre</h2>
            <select value={selID} onChange={e => setSelID(e.target.value)} style={st.select}>
              <option value="">-- Choose a Theatre --</option>
              {theatres.map(t => (
                <option key={t.theatreID} value={t.theatreID}>
                  {t.theatreName} — {t.theatreLocation}
                </option>
              ))}
            </select>
            {selID && <MovieListPage selectedTheatreID={selID} />}
          </section>
        )}

        {active === 'history' && (
          <section style={st.box}>
            <h2 style={st.heading}>Your Booking History</h2>
            <BookingHistory />
          </section>
        )}

        {active === 'review' && (
          <section style={st.box}>
            <h2 style={st.heading}>Add Your Review</h2>
            <AddReview />
          </section>
        )}

        {active === 'myreviews' && (
          <section style={st.box}>
            <h2 style={st.heading}>Your Reviews</h2>
            <UserReviews />
          </section>
        )}
      </main>
    </div>
  );
};

const purple = '#8E4585';
const purpleDark = '#5e35b1';

const st = {
  wrapper: { minHeight: '100vh', display: 'flex', flexDirection: 'column' },
  topBar: {
    height: 56,
    background: 'linear-gradient(to right,#f3e7e9,#e3eeff)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 1rem',
    boxShadow: '0 2px 6px rgba(0,0,0,.08)',
    position: 'sticky',
    top: 0,
    zIndex: 1000
  },
  burger: { fontSize: '1.5rem', color: purpleDark, background: 'none', border: 'none', cursor: 'pointer' },
  logout: { background: purpleDark, color: '#fff', border: 'none', padding: '.45rem 1.1rem', borderRadius: 8, fontWeight: 600, cursor: 'pointer' },
  sidebar: {
    position: 'fixed', top: 56, left: 0, width: 220,
    height: 'calc(100vh - 56px)', background: purple,
    color: '#fff', display: 'flex', flexDirection: 'column',
    padding: '1.5rem 1rem', overflowY: 'auto',
    boxShadow: '2px 0 8px rgba(0,0,0,.12)'
  },
  logo: { textAlign: 'center', fontSize: '1.7rem', fontWeight: 700, marginBottom: '1.5rem', color: '#fff' },
  nav: { display: 'flex', flexDirection: 'column', gap: '.75rem' },
  link: { background: purpleDark, border: 'none', color: '#fff', padding: '.8rem 1rem', borderRadius: 8, textAlign: 'left', fontSize: '1rem', fontWeight: 500, cursor: 'pointer' },
  linkActive: { background: '#C884BF', color: '#fff', fontWeight: 700 },
  main: {
    flex: 1,
    padding: '2rem',
    background: 'linear-gradient(to right,#f3e7e9,#e3eeff)',
    minHeight: 'calc(100vh - 56px)',
    transition: 'margin-left .3s'
  },
  box: { background: '#fff', borderRadius: 12, padding: '2rem', boxShadow: '0 4px 12px rgba(0,0,0,.1)' },
  heading: { color: purpleDark },
  movieGrid: { display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center' },
  movieCard: { width: 180, textAlign: 'center', background: '#fff', borderRadius: 10, boxShadow: '0 4px 8px rgba(0,0,0,.1)', padding: '.8rem', cursor: 'pointer' },
  movieImg: { width: '100%', height: 200, objectFit: 'cover', borderRadius: 8 },
  select: { padding: '.7rem', borderRadius: 8, border: '1px solid #ccc', fontSize: '1rem', marginBottom: '1.5rem', width: '100%', maxWidth: 500 }
};

export default UserDashboard;
