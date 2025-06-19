import React, { useEffect, useState } from 'react';
import api from '../../services/axiosInstance';

const ViewReviews = () => {
  const [reviews, setReviews] = useState([]);

  const fetchReviews = async () => {
    try {
      const response = await api.get('/reviews');
      setReviews(response.data);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    }
  };

  const deleteReview = async (id) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found');
        return;
      }
  
      await api.delete(`/reviews/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
  
      setReviews(prev => prev.filter(r => r.reviewID !== id));
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };
  
  useEffect(() => {
    fetchReviews();
  }, []);

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: 'auto' }}>
      <h2 style={{ fontSize: '1.8rem', color: '#6a1b9a', marginBottom: '1.5rem' }}>All User Reviews</h2>
      {reviews.length === 0 ? (
        <p>No reviews found.</p>
      ) : (
        reviews.map(({ reviewID, userID, movieID, rating, reviewText, reviewDate }) => (
          <div
            key={reviewID}
            style={{
              backgroundColor: '#fff',
              border: '1px solid #ddd',
              borderRadius: '8px',
              padding: '1rem',
              marginBottom: '1rem',
              boxShadow: '0 0 6px rgba(0,0,0,0.05)'
            }}
          >
            <p><strong>🆔 Review ID:</strong> {reviewID}</p>
            <p><strong>🎬 Movie ID:</strong> {movieID}</p>
            <p><strong>👤 User ID:</strong> {userID}</p>
            <p><strong>⭐ Rating:</strong> {rating}/5</p>
            <p><strong>💬 Comment:</strong> {reviewText}</p>
            <p><strong>🕒 Reviewed on:</strong> {new Date(reviewDate).toLocaleString()}</p>
            <button
              onClick={() => deleteReview(reviewID)}
              style={{
                marginTop: '0.5rem',
                backgroundColor: '#e53935',
                border: 'none',
                padding: '8px 12px',
                color: '#fff',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Delete Review
            </button>
          </div>
        ))
      )}
    </div>
  );
};

export default ViewReviews;
