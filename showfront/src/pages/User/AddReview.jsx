import React, { useEffect, useState } from 'react';
import api from '../../services/axiosInstance';

const AddReview = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMovie, setSelectedMovie] = useState('');
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    const fetchMovies = async () => {
      try {
       
        const moviesResponse = await api.get('/availableMovies');
        setMovies(moviesResponse.data);
      } catch (err) {
        console.error('Error fetching data:', err);
        setMessage({ text: 'Failed to load movies. Please try again later.', type: 'error' });
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedMovie) {
      setMessage({ text: 'Please select a movie to review.', type: 'error' });
      return;
    }

    if (!reviewText.trim()) {
      setMessage({ text: 'Please add your review text.', type: 'error' });
      return;
    }

    try {
      setSubmitting(true);
      
      await api.post('/reviews', {
        movieID: selectedMovie,
        rating,
        reviewText
      });
      

      setMessage({ text: 'Your review was submitted successfully!', type: 'success' });
      
      // Reset form
      setSelectedMovie('');
      setRating(5);
      setReviewText('');
      
    } catch (err) {
      console.error('Error submitting review:', err);
      setMessage({ text: 'Failed to submit your review. Please try again.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={loadingStyle}>Loading movies to review...</div>;

  return (
    <div style={formContainerStyle}>
      {message.text && (
        <div style={message.type === 'error' ? errorMsgStyle : successMsgStyle}>
          {message.text}
        </div>
      )}
      
      <form onSubmit={handleSubmit} style={formStyle}>
        <div style={formGroupStyle}>
          <label htmlFor="movie" style={labelStyle}>Select Movie</label>
          <select 
            id="movie"
            value={selectedMovie}
            onChange={(e) => setSelectedMovie(e.target.value)}
            style={selectStyle}
            required
          >
            <option value="">-- Select a movie --</option>
            {movies.map(movie => (
              <option key={movie.movieID} value={movie.movieID}>
                {movie.title}
              </option>
            ))}
          </select>
        </div>
        
        <div style={formGroupStyle}>
          <label htmlFor="rating" style={labelStyle}>Your Rating</label>
          <div style={ratingContainerStyle}>
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                style={{
                  ...starStyle,
                  color: star <= rating ? '#ffb400' : '#ccc'
                }}
              >
                ★
              </button>
            ))}
            <span style={ratingTextStyle}>{rating}/5</span>
          </div>
        </div>
        
        <div style={formGroupStyle}>
          <label htmlFor="reviewText" style={labelStyle}>Your Review</label>
          <textarea
            id="reviewText"
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            style={textareaStyle}
            rows={5}
            placeholder="Share your thoughts about this movie..."
            required
          />
        </div>
        
        <button 
          type="submit" 
          style={submitButtonStyle}
          disabled={submitting}
        >
          {submitting ? 'Submitting...' : 'Submit Review'}
        </button>
      </form>
    </div>
  );
};

// Styles
const loadingStyle = {
  textAlign: 'center',
  padding: '2rem',
  fontSize: '1.1rem',
  color: '#666',
};

const formContainerStyle = {
  maxWidth: '700px',
  margin: '0 auto',
};

const formStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1.5rem',
};

const formGroupStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
};

const labelStyle = {
  fontWeight: '500',
  color: '#444',
  fontSize: '1rem',
};

const selectStyle = {
  padding: '0.8rem',
  borderRadius: '8px',
  border: '1px solid #ddd',
  fontSize: '1rem',
};

const textareaStyle = {
  padding: '0.8rem',
  borderRadius: '8px',
  border: '1px solid #ddd',
  fontSize: '1rem',
  fontFamily: 'inherit',
  resize: 'vertical',
};

const ratingContainerStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.3rem',
};

const starStyle = {
  background: 'none',
  border: 'none',
  fontSize: '1.8rem',
  cursor: 'pointer',
  padding: '0.2rem',
};

const ratingTextStyle = {
  marginLeft: '0.5rem',
  fontWeight: 'bold',
  color: '#555',
};

const submitButtonStyle = {
  backgroundColor: '#6a1b9a',
  color: 'white',
  border: 'none',
  padding: '0.8rem',
  borderRadius: '8px',
  fontSize: '1rem',
  fontWeight: 'bold',
  cursor: 'pointer',
  transition: 'background-color 0.2s ease',
  marginTop: '1rem',
};

const errorMsgStyle = {
  backgroundColor: '#ffebee',
  color: '#d32f2f',
  padding: '0.8rem',
  borderRadius: '8px',
  marginBottom: '1.5rem',
  fontWeight: '500',
};

const successMsgStyle = {
  backgroundColor: '#e8f5e9',
  color: '#388e3c',
  padding: '0.8rem',
  borderRadius: '8px',
  marginBottom: '1.5rem',
  fontWeight: '500',
};

export default AddReview;