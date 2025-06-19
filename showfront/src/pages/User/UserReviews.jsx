import React, { useEffect, useState } from 'react';
import axios from "../../services/axiosInstance";

export default function UserReviews() {
  const [reviews, setReviews] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/my-reviews', { withCredentials: true })
      .then(res => setReviews(res.data))
      .catch(err => {
        console.error(err);
        setError(err?.response?.data?.message || 'Failed to load reviews');
      })
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (reviewID) => {
    if (!window.confirm("Are you sure you want to delete this review?")) return;
    try {
      await axios.delete(`/reviews/${reviewID}`, { withCredentials: true });
      setReviews(prev => prev.filter(r => r.reviewID !== reviewID));
    } catch (err) {
      setError("Failed to delete review");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-[#f3e7e9] to-[#e3eeff] p-6">
      <div className="max-w-6xl mx-auto">
        
        {loading ? (
          <p className="text-center text-gray-600">Loading reviews...</p>
        ) : error ? (
          <p className="text-red-600 text-center">{error}</p>
        ) : reviews.length === 0 ? (
          <p className="text-gray-600 text-center">You haven’t written any reviews yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {reviews.map((review, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl shadow-md p-6 flex flex-col justify-between border border-gray-200 transition hover:shadow-xl"
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-semibold text-purple-700">{review.movieTitle}</h3>
                    <span className="text-yellow-500 font-semibold">⭐ {review.rating}/5</span>
                  </div>
                  <p className="text-gray-800 mb-3">{review.reviewText}</p>
                  <p className="text-sm text-gray-500">
                    Reviewed on {new Date(review.reviewDate).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(review.reviewID)}
                  className="self-end mt-4 px-4 py-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-md transition"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
