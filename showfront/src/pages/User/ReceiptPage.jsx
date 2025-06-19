import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/axiosInstance';

const ReceiptPage = () => {
  const { id } = useParams(); // bookingID
  const nav = useNavigate();
  const [data, setData] = useState(null);

  // Fetch booking details once on mount
  useEffect(() => {
    const fetchBookingDetails = async () => {
      try {
        const response = await api.get(`/bookingDetails/${id}`);
        setData(response.data);
      } catch (error) {
        console.error('Could not load receipt:', error);
        alert('Could not load receipt');
        nav('/user');
      }
    };
    fetchBookingDetails();
  }, [id, nav]);

  if (!data) return <p style={msg}>Loading…</p>;

  return (
    <div style={page}>
      <div style={card}>
        <h2 style={{ color: '#5e35b1' }}>🎫 Receipt</h2>
        <p><strong>Movie:</strong> {data.movieTitle}</p>
        <p><strong>Theatre:</strong> {data.theatreName}</p>
        <p><strong>Screen:</strong> {data.screenName}</p>
        <p><strong>Seats:</strong> {data.seatsBooked}</p>
        <p><strong>Payment:</strong> {data.paymentStatus} via {data.paymentMethod}</p>
        <p><strong>Amount:</strong> Rs {Number(data.amount).toFixed(2)}</p>

        {/* No Pay‑Now button here anymore. Online payments are handled from Booking History, and cash payments are updated by admin. */}

        <button
          style={{ ...btn, marginTop: '1rem', background: '#8E4585' }}
          onClick={() => nav('/user')}
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};

/* styles */
const page = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '100vh',
  background: 'linear-gradient(to right,#f3e7e9,#e3eeff)',
};
const card = {
  background: '#fff',
  padding: '2rem 3rem',
  borderRadius: '12px',
  boxShadow: '0 4px 12px rgba(0,0,0,.1)',
  minWidth: '320px',
};
const btn = {
  background: '#6a1b9a',
  color: '#fff',
  border: 'none',
  padding: '.7rem 1.4rem',
  borderRadius: '8px',
  fontWeight: 'bold',
  cursor: 'pointer',
  width: '100%',
  marginTop: '1.2rem',
};
const msg = { padding: '3rem', textAlign: 'center' };

export default ReceiptPage;
