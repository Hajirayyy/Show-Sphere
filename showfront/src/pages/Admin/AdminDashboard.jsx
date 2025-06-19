import React, { useEffect, useState } from 'react';
import { Link, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import ManageMovies    from './ManageMovies';
import ManageTheatres  from './ManageTheatres';
import ManageScreens    from './ManageScreens';
import ManageShowtimes  from './ManageShowtimes';
import ManageTickets    from './ManageTickets';
import ViewReviews      from './ViewReviews';
import Analytics        from './Analytics';
import UserManager      from './UserManager';
import DeleteAdminAccount from './DeleteAdminAccount';
import api from '../../services/axiosInstance';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

/* nav map */
const navLinks = [
  { to: '/admin',               label: '🏠 Dashboard Home' },
  { to: '/admin/movies',        label: '🏢 Manage Movies' },
  { to: '/admin/theatres',      label: '🏢 Manage Theatres' },
  { to: '/admin/screens',       label: '🖥️ Manage Screens' },
  { to: '/admin/showtimes',     label: '⏰ Manage Showtimes' },
  { to: '/admin/tickets',       label: '🎟️ Manage Tickets' },
  { to: '/admin/analytics',     label: '📊 Analytics' },
  { to: '/admin/users',         label: '👥 User Management' },
  { to: '/admin/reviews',       label: '💬 View Reviews' },
  { to: '/admin/delete',        label: '🗑️ Delete Account' },
];

const AdminDashboard = () => {
  const [adminName, setAdminName] = useState('');
  const [open, setOpen]           = useState(true);
  const [topBooked, setTopBooked] = useState([]);
  const nav       = useNavigate();
  const location  = useLocation();

  useEffect(() => {
    api.get('/me')
      .then(r => setAdminName(r.data.userName))
      .catch(() => nav('/'));

    api.get('/mostPopularMovieByBookings')
      .then(r => setTopBooked(r.data))
      .catch(err => console.error('Failed to fetch top bookings', err));
  }, [nav]);

  const logout = () => api.post('/logout').then(() => {
    localStorage.clear();
    nav('/');
  });

  const barData = {
    labels: topBooked.map(m => m.title),
    datasets: [{
      label: 'Total Bookings',
      data: topBooked.map(m => m.TotalBookings),
      backgroundColor: ['#7c4dff', '#ab47bc', '#26a69a', '#ff7043', '#66bb6a']
    }]
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true },
    },
    scales: {
      y: { beginAtZero: true, ticks: { stepSize: 1 } }
    }
  };

  return (
    <div style={st.shell}>
      {/* top bar */}
      <div style={st.topBar}>
        <button style={st.burger} onClick={() => setOpen(!open)}>☰</button>
        <button style={st.logout} onClick={logout}>Logout</button>
      </div>

      {/* sidebar */}
      {open && (
        <aside style={st.sidebar}>
          <h2 style={st.logo}>ShowSphere</h2>
          <nav style={st.nav}>
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                style={{
                  ...st.link,
                  ...(location.pathname === link.to && st.linkActive),
                }}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </aside>
      )}

      {/* main content */}
      <main style={{ ...st.main, marginLeft: open ? 260 : 0 }}>
        <Routes>
          <Route
            path=""
            element={
              <div style={st.box}>
                <h1 style={st.heading}>Welcome, {adminName}! 👋</h1>
                <p style={{ fontSize: '1.1rem', color: '#444', marginBottom: '2rem' }}>
                  Here's a quick snapshot of your most popular movies by booking volume:
                </p>

                {/* Most Booked Movies Bar Chart */}
                {topBooked.length > 0 ? (
                  <div style={st.chartWrap}>
                    <Bar data={barData} options={barOptions} />
                  </div>
                ) : (
                  <p style={{ fontStyle: 'italic', color: '#888' }}>Loading booking stats...</p>
                )}
              </div>
            }
          />
          <Route path="movies"      element={<ManageMovies />} />
          <Route path="analytics"    element={<Analytics key={location.pathname} />} />
          <Route path="users"        element={<UserManager key={location.pathname} />} />
          <Route path="theatres"     element={<ManageTheatres />} />
          <Route path="screens"      element={<ManageScreens />} />
          <Route path="showtimes"    element={<ManageShowtimes />} />
          <Route path="tickets"      element={<ManageTickets />} />
          <Route path="reviews"      element={<ViewReviews />} />
          <Route path="delete"       element={<DeleteAdminAccount />} />
        </Routes>
      </main>
    </div>
  );
};

/* ───────────── styles ───────────── */
const purple     = '#8E4585';
const purpleDark = '#5e35b1';

const st = {
  shell: { minHeight: '100vh', background: 'linear-gradient(to right,#f3e7e9,#e3eeff)' },

  topBar: {
    height: 56,
    background: 'linear-gradient(to right,#f3e7e9,#e3eeff)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 .8rem',
    boxShadow: '0 2px 6px rgba(0,0,0,.08)',
    position: 'sticky',
    top: 0,
    zIndex: 1000,
  },
  burger: { fontSize: '1.6rem', background: 'none', color: '#5e35b1', border: 'none', cursor: 'pointer' },
  logout: {
    background: purpleDark,
    color: '#fff',
    border: 'none',
    padding: '.45rem 1.1rem',
    borderRadius: 8,
    fontWeight: 600,
    cursor: 'pointer',
  },

  sidebar: {
    position: 'fixed',
    top: 56,
    left: 0,
    width: 260,
    height: 'calc(100vh - 56px)',
    background: purple,
    color: '#fff',
    padding: '1.5rem 1rem 2rem',
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
    boxShadow: '2px 0 8px rgba(0,0,0,.12)',
  },
  logo: { textAlign: 'center', fontSize: '1.7rem', fontWeight: 700, color: '#fff', marginBottom: '1.5rem' },

  nav: { display: 'flex', flexDirection: 'column', gap: '.7rem' },
  link: {
    background: purpleDark,
    color: '#fff',
    padding: '.85rem 1rem',
    borderRadius: 8,
    textDecoration: 'none',
    fontSize: '1rem',
    fontWeight: 500,
  },
  linkActive: { background: '#C884BF', color: '#fff', fontWeight: 700 },

  main: {
    padding: '2rem',
    transition: 'margin-left .3s',
  },
  box: {
    background: '#fff',
    borderRadius: 12,
    padding: '2rem',
    boxShadow: '0 4px 12px rgba(0,0,0,.1)',
    textAlign: 'center',
  },
  heading: { color: purpleDark },

  chartWrap: {
    height: 350,
    maxWidth: 700,
    margin: '0 auto',
    padding: '1rem',
  },
};

export default AdminDashboard;
