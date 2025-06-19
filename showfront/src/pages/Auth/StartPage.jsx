import React from 'react';
import { useNavigate } from 'react-router-dom';

const StartPage = () => {
  const nav = useNavigate();

  return (
    <div style={wrapper}>
      <div style={film} />

      <div style={card}>
        <img
          src="/showsphere-icon.png"
          alt="ShowSphere logo"
          style={logoImg}
          draggable="false"
        />
        <h1 style={logoText}>ShowSphere</h1>
        <p style={tag}>Book tickets • Leave reviews • Enjoy the show</p>

        <div style={btnRow}>
          <button
            style={{ ...btn, ...btnPrimary }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
            onClick={() => nav('/login')}
          >
            Login
          </button>
          <button
            style={{ ...btn, ...btnSecondary }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
            onClick={() => nav('/signup')}
          >
            Sign Up
          </button>
        </div>

        <footer style={foot}>
          <a href="#" style={link}>Terms</a> •{' '}
          <a href="#" style={link}>Privacy</a>
        </footer>
      </div>
    </div>
  );
};

/* ───── styles ───── */
const wrapper = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'linear-gradient(120deg,#fce1e5 0%,#dfe8ff 100%)',
  overflow: 'hidden',
  fontFamily: 'Inter, Segoe UI, sans-serif',
};

/* floating background element */
const film = {
  position: 'absolute',
  width: 600,
  height: 600,
  background: 'url("/film-strip.svg") center/contain no-repeat',
  opacity: 0.05,
  animation: 'spin 60s linear infinite',
  zIndex: 0,
  pointerEvents: 'none',
};

/* glass card */
const card = {
  position: 'relative',
  zIndex: 1,
  backdropFilter: 'blur(10px)',
  background: 'rgba(255,255,255,.55)',
  border: '1px solid rgba(255,255,255,.3)',
  boxShadow: '0 8px 32px rgba(0,0,0,.15)',
  borderRadius: 24,
  padding: '3.5rem 4.5rem',
  textAlign: 'center',
  maxWidth: 460,
};

const logoImg  = { width: 90, marginBottom: 12, userSelect: 'none' };
const logoText = { margin: 0, fontSize: '2.4rem', color: '#8E4585', fontWeight: 700 };
const tag      = { marginTop: 8, marginBottom: 40, color: '#555', fontSize: '1.05rem' };

const btnRow = { display: 'flex', gap: 20, justifyContent: 'center' };
const btn = {
  flex: 1,
  padding: '0.9rem 1.2rem',
  fontSize: '1rem',
  borderRadius: 12,
  border: 'none',
  cursor: 'pointer',
  fontWeight: 600,
  transition: 'transform .2s, box-shadow .2s',
  boxShadow: '0 4px 12px rgba(0,0,0,.12)',
};
const btnPrimary   = { background: '#6a1b9a', color: '#fff' };
const btnSecondary = { background: '#ab47bc', color: '#fff' };

const foot = { marginTop: 48, fontSize: '.85rem', color: '#666' };
const link = { color: '#666', textDecoration: 'none' };

export default StartPage;
