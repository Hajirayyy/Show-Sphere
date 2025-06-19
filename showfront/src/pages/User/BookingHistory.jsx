import React, { useEffect, useState } from 'react';
import api from '../../services/axiosInstance';

/* ───────────────────────────────────────────── */

const BookingHistory = () => {
  const [bookings, setBookings] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  /* fetch user bookings once */
  useEffect(() => {
    (async () => {
      try {
        const { data: me } = await api.get('/me');
        const uid          = me.userID ?? me.id;
        const { data }     = await api.get(`/users/${uid}/bookings`);

        setBookings(
          [...data].sort((a, b) => new Date(b.bookingTime) - new Date(a.bookingTime))
        );
      } catch {
        setError('Could not load your booking history.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* helpers */
  const payNow = async (paymentID) => {
    try {
      await api.post('/togglePaymentStatus', { paymentID });
      setBookings(bs =>
        bs.map(b =>
          b.paymentID === paymentID ? { ...b, paymentStatus: 'Paid' } : b
        )
      );
    } catch {
      alert('Payment failed.');
    }
  };

  const refund = async (paymentID) => {
    if (!window.confirm('Confirm refund?')) return;
    try {
      await api.post('/refundPayment', { paymentID });
      setBookings(bs =>
        bs.map(b =>
          b.paymentID === paymentID ? { ...b, paymentStatus: 'Refunded' } : b
        )
      );
    } catch {
      alert('Refund failed.');
    }
  };

  /* UI states */
  if (loading)        return <p style={styles.msg}>Loading…</p>;
  if (error)          return <p style={{ ...styles.msg, color: '#d32f2f' }}>{error}</p>;
  if (!bookings.length) return <p style={styles.msg}>No bookings yet.</p>;

  /* render */
  return (
    <div style={styles.grid}>
      {bookings.map(b => {
        const isOnlinePending =
          b.paymentStatus?.toLowerCase() === 'pending' &&
          b.paymentMethod?.toLowerCase() !== 'cash';

        return (
          <article key={b.bookingID} style={styles.card}>
            {/* header */}
            <header style={styles.head}>
              <h3 style={styles.title}>{b.movieTitle}</h3>
              <span style={badgeStyle(b.bookingStatus)}>{b.bookingStatus}</span>
            </header>

            {/* body */}
            <section style={styles.body}>
              <InfoRow label="Date"     value={new Date(b.bookingTime).toLocaleString()} />
              <InfoRow label="Seats"    value={b.seatsBooked} />
              <InfoRow label="Theatre"  value={b.theatreName} />
              <InfoRow label="Screen"   value={b.screenName} />
            </section>

            {/* payment box */}
            <section style={styles.payBox}>
              <InfoRow
                label="Payment"
                value={
                  <span style={payColor(b.paymentStatus)}>
                    {b.paymentStatus}
                    {b.paymentMethod ? ` via ${b.paymentMethod}` : ''}
                  </span>
                }
              />
              <InfoRow
                label="Total"
                value={`Rs ${b.amount?.toFixed(2) ?? '—'}`}
              />
            </section>

            {/* action buttons */}
            {isOnlinePending && (
              <button style={styles.btn} onClick={() => payNow(b.paymentID)}>
                Complete Payment
              </button>
            )}

            {b.bookingStatus === 'Cancelled' && b.paymentStatus === 'Paid' && (
              <button
                style={{ ...styles.btn, background: '#d32f2f' }}
                onClick={() => refund(b.paymentID)}
              >
                Refund
              </button>
            )}
          </article>
        );
      })}
    </div>
  );
};

/* ───── sub‑component to keep JSX tidy ───── */
const InfoRow = ({ label, value }) => (
  <p style={{ margin: '.25rem 0' }}>
    <strong>{label}:</strong> {value}
  </p>
);

/* ───────────────────────── styles ───────────────────────── */
const styles = {
  msg:  { textAlign: 'center', padding: '2rem', fontSize: '1.1rem' },

  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
    gap: '1.5rem',
  },

  card: {
    background: '#fff',
    borderRadius: 12,
    boxShadow: '0 4px 12px rgba(0,0,0,.08)',
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    minHeight: 300,
  },

  head: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #eee',
    marginBottom: '1rem',
    paddingBottom: '.8rem',
  },

  title: { margin: 0 },

  body: { flex: 1 },

  payBox: {
    background: '#f9f9f9',
    padding: '.8rem',
    borderRadius: 8,
    marginBottom: '1rem',
    fontSize: '.95rem',
  },

  btn: {
    background: '#6a1b9a',
    color: '#fff',
    border: 'none',
    padding: '.7rem 1rem',
    borderRadius: 8,
    fontWeight: 'bold',
    cursor: 'pointer',
  },
};

/* dynamic style helpers */
const badgeStyle = (status) => ({
  padding: '.3rem .9rem',
  borderRadius: 20,
  fontSize: '.8rem',
  fontWeight: 600,
  textTransform: 'capitalize',
  ...(status === 'Booked'    && { background: '#e3f2fd', color: '#1976d2' }),
  ...(status === 'Cancelled' && { background: '#ffebee', color: '#d32f2f' }),
  ...(status === 'Completed' && { background: '#e8f5e9', color: '#388e3c' }),
  ...(status !== 'Booked' &&
    status !== 'Cancelled' &&
    status !== 'Completed' && { background: '#f3e5f5', color: '#8e24aa' }),
});

const payColor = (status) => ({
  fontWeight: 'bold',
  ...(status === 'Paid'     && { color: '#388e3c' }),
  ...(status === 'Pending'  && { color: '#f57c00' }),
  ...(status === 'Failed'   && { color: '#d32f2f' }),
  ...(status === 'Refunded' && { color: '#1976d2' }),
  ...(status !== 'Paid' &&
    status !== 'Pending' &&
    status !== 'Failed' &&
    status !== 'Refunded' && { color: '#757575' }),
});

export default BookingHistory;
