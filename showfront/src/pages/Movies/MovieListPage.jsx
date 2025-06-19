import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/axiosInstance';

const MovieListPage = ({ selectedTheatreID }) => {
  const [movies, setMovies] = useState([]);
  const navigate            = useNavigate();

  /* ─────────────────── fetch movies for this theatre ─────────────────── */
  useEffect(() => {
    if (!selectedTheatreID) { setMovies([]); return; }

    (async () => {
      try {
        const { data } = await api.get(`/movies/by-theatre/${selectedTheatreID}`);
        setMovies(data);
      } catch (err) {
        console.error('Error fetching movies:', err);
      }
    })();
  }, [selectedTheatreID]);

  if (!selectedTheatreID)
    return <p style={hintStyle}>Please select a theatre to view available movies.</p>;

  return (
    <div style={{ padding:'2rem' }}>
      <h2 style={heading}>Now Showing</h2>

      <div style={grid}>
        {movies.map(m => (
          <div
            key={m.movieID}
            style={card}
            onClick={() => navigate(`/movies/${m.movieID}?theatreID=${selectedTheatreID}`)}
          >
            <img
              src={m.imageURL}
              alt={m.title}
              style={poster}
              onError={e => { e.target.src='/default-poster.jpg'; }}
            />
            <h3 style={title}>{m.title}</h3>
            <p style={genre}>{m.genre}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ──────────── inline styles ──────────── */
const heading   = { color:'#5e35b1', marginBottom:'1rem' };
const hintStyle = { padding:'2rem', fontStyle:'italic' };

const grid      = { display:'flex', flexWrap:'wrap', gap:'1.2rem' };
const cardBase  = {
  width:'200px', background:'#fff', borderRadius:'12px',
  boxShadow:'0 4px 12px rgba(0,0,0,.08)', cursor:'pointer',
  transition:'transform .25s, box-shadow .25s', overflow:'hidden'
};
const cardHover = { transform:'translateY(-4px)', boxShadow:'0 6px 18px rgba(0,0,0,.12)' };
const card = {
  ...cardBase,
  onMouseEnter(){ Object.assign(this.style, cardHover); },
  onMouseLeave(){ Object.assign(this.style, cardBase); }
};
const poster    = { width:'100%', height:'280px', objectFit:'cover' };
const title     = { color:'#5e35b1', margin:'0.5rem' };
const genre     = { color:'#555', margin:'0 0 1rem 0', fontSize:'.9rem' };

export default MovieListPage;
