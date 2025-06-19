// Analytics.jsx – full version
import React, { useEffect, useState } from 'react';
import axios from '../../services/axiosInstance';
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

/* ───────────────────────────────────────── */

const Analytics = () => {
  /* base dashboards */
  const [roleData,      setRoleData]   = useState({ users: 0, admins: 0 });
  const [bookingDetails,setBooking]    = useState([]);

  /* new insights */
  const [underPerf,     setUnderPerf]  = useState([]);
  const [popShow,       setPopShow]    = useState(null);
  const [showByThea,    setShowByThea] = useState([]);
  const [rev,           setRev]        = useState(null);
  const [avgSpend,      setAvgSpend]   = useState(null);
  const [range,         setRange]      = useState({ start: '', end: '' });

  const colors = ['#7c4dff', '#ab47bc', '#26a69a', '#ff7043', '#66bb6a'];

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [
        roles, bookings,
        under, popular, showT
      ] = await Promise.all([
        axios.get('/roleCounts'),
        axios.get('/allBookingDetails'),
        axios.get('/underperformingMovies'),
        axios.get('/mostPopularMovieByShowimes'),
        axios.get('/showtimesPerTheatre'),
      ]);

      if (roles.data?.length)
        setRoleData({
          users: roles.data[0].TotalUsers || 0,
          admins: roles.data[0].TotalAdmins || 0,
        });

      setBooking(bookings.data || []);
      setUnderPerf(under.data || []);
      setPopShow(popular.data?.[0] || null);
      setShowByThea(showT.data || []);
    } catch (err) { console.error('🔥 analytics fetch error', err); }
  };

  /* toggle payment status (works exactly as before) */
  const togglePaymentStatus = async (paymentID) => {
    if (!paymentID) return alert('No payment ID for this booking.');
    try {
      await axios.post('/togglePaymentStatus', { paymentID });
      const { data } = await axios.get('/allBookingDetails');   // refresh table
      setBooking(data);
    } catch (err) {
      console.error(err);
      alert('Failed to toggle payment status');
    }
  };

  /* revenue + avg spend */
  const fetchRevenue = async (e) => {
    e.preventDefault();
    if (!range.start || !range.end) return alert('Select both dates');
    try {
      const [{ data: total }, { data: avg }] = await Promise.all([
        axios.get('/totalRevenue',      { params: range }),
        axios.get('/avgSpentPerUser'),
      ]);
      setRev(total?.TotalRevenue ?? 0);
      setAvgSpend(avg?.AvgAmount ?? 0);
    } catch (err) { console.error(err); alert('Revenue fetch failed'); }
  };

  const barOpt = { responsive:true, maintainAspectRatio:false,
                   plugins:{ legend:{display:false}, tooltip:{enabled:true} } };

  /* ───────────────────────────────────────── render */
  return (
    <div style={ctn}>
      {/* ROLE DISTRIBUTION */}
      <Section title="👥 User Roles Distribution">
        <ChartBox h={300}>
          <Bar
            data={{
              labels:['Users','Admins'],
              datasets:[{ data:[roleData.users,roleData.admins],
                          backgroundColor:['#7c4dff','#ab47bc'] }]
            }}
            options={barOpt}
          />
        </ChartBox>
      </Section>

      {/* UNDER‑PERFORMING MOVIES */}
      {underPerf.length>0 && (
        <Section title="📉 Under‑performing Movies (bookings < 5 ‑ rating < 3)">
          <ul style={list}>
            {underPerf.map((m,i)=>(
              <li key={i} style={item}>
                🎬 {m.title} — {m.totalBookings} bookings, ⭐ {Number(m.avgRating).toFixed(1)}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* POPULAR MOVIE BY UPCOMING SHOWTIMES */}
      {popShow && (
        <Section title="🔥 Most‑Scheduled Movie (upcoming showtimes)">
          <p style={{fontSize:'1.1rem'}}>
            {popShow.title} → <strong>{popShow.TotalShowtimes}</strong> showtimes scheduled
          </p>
        </Section>
      )}

      {/* SHOWTIMES PER THEATRE */}
      {showByThea.length>0 && (
        <Section title="⌛ Showtimes per Theatre (upcoming)">
          <ChartBox h={350}>
            <Bar
              data={{
                labels:showByThea.map(t=>t.theatreName),
                datasets:[{ data:showByThea.map(t=>t.TotalShowtimes),
                            backgroundColor:showByThea.map((_,i)=>colors[i%colors.length]) }]
              }}
              options={barOpt}
            />
          </ChartBox>
        </Section>
      )}

      {/* REVENUE & AVG SPEND */}
      <Section title="💰 Revenue">
        <form onSubmit={fetchRevenue} style={revForm}>
          <input type="date" value={range.start}
            onChange={e=>setRange({...range,start:e.target.value})}/>
          <span style={{margin:'0 .5rem'}}>to</span>
          <input type="date" value={range.end}
            onChange={e=>setRange({...range,end:e.target.value})}/>
          <button style={btn}>Fetch</button>
        </form>
        {rev!==null && (
          <p style={{marginTop:'1rem',fontSize:'1.1rem'}}>
            Total revenue: <strong>Rs {Number(rev).toFixed(2)}</strong><br/>
            Avg spent per user: <strong>Rs {Number(avgSpend).toFixed(2)}</strong>
          </p>
        )}
      </Section>

      {/* BOOKING TABLE WITH TOGGLE */}
      <Section title="📋 Booking Details">
        <div style={tblWrap}>
          <table style={tbl}>
            <thead>
              <tr>
                {['User','Movie','Date','Seats','Payment','Status']
                  .map(h=><th key={h} style={th}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {bookingDetails.map((b,i)=>(
                <tr key={i} style={i%2?rowOdd:rowEven}>
                  <td style={td}>{b.userName}</td>
                  <td style={td}>{b.movieTitle}</td>
                  <td style={td}>{b.bookingDate}</td>
                  <td style={td}>{b.seatsBooked}</td>
                  <td style={td}>
                    {b.paymentMethod}
                    {b.paymentMethod==='manual' && (
                      <span style={{fontSize:'.75rem',color:'#777',marginLeft:6}}>(manual)</span>
                    )}
                  </td>
                  <td style={td}>
                    <span
                      style={{
                        ...getStatusStyle(b.paymentStatus),
                        cursor: b.paymentID ? 'pointer' : 'not-allowed',
                        opacity: b.paymentID ? 1 : .6,
                      }}
                      onClick={() => b.paymentID && togglePaymentStatus(b.paymentID)}
                    >
                      {b.paymentStatus || 'Unknown'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
};

/* ───────── small helpers ───────── */
const Section = ({title,children})=>(
  <>
    <h2 style={h2}>{title}</h2>
    {children}
  </>
);
const ChartBox = ({h,children})=>(
  <div style={{height:h,padding:'1rem'}}>{children}</div>
);

/* ───────── styles ───────── */
const ctn  ={padding:'2rem',fontFamily:'Segoe UI, sans-serif',background:'#fff',minHeight:'100vh'};
const h2   ={color:'#5e35b1',fontSize:'1.5rem',marginTop:'3rem',marginBottom:'1rem'};
const list ={margin:'1rem 0 2rem',paddingLeft:0,listStyle:'none'};
const item ={background:'#f8f8f8',border:'1px solid #ddd',borderRadius:8,padding:'10px 15px',
             marginBottom:10,boxShadow:'0 1px 3px rgba(0,0,0,.08)'};
const revForm={display:'flex',alignItems:'center',gap:'.5rem',flexWrap:'wrap'};
const btn  ={background:'#5e35b1',color:'#fff',border:'none',padding:'6px 14px',borderRadius:6,cursor:'pointer'};
const tblWrap={overflowX:'auto',marginTop:'1rem'};
const tbl  ={width:'100%',borderCollapse:'collapse',fontSize:14};
const th   ={padding:12,background:'#5e35b1',color:'#fff',textAlign:'left'};
const td   ={padding:'10px',borderBottom:'1px solid #ccc'};
const rowEven={background:'#fff'}; const rowOdd={background:'#f3f3f3'};
const getStatusStyle = (status) => {
  const base={padding:'4px 10px',borderRadius:15,fontWeight:600,fontSize:'.8rem',
              display:'inline-block',textTransform:'capitalize'};
  switch((status||'').toLowerCase()){
    case 'paid':    return {...base,background:'#43a047',color:'#fff'};
    case 'pending': return {...base,background:'#ffb300',color:'#000'};
    case 'failed':  return {...base,background:'#e53935',color:'#fff'};
    default:        return {...base,background:'#9e9e9e',color:'#fff'};
  }
};

export default Analytics;
