import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { getComplaints, addResponse, sendAutoReply, sendToDean } from '../api.js';

function ComplaintDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [complaint, setComplaint] = useState(null);
  const [content, setContent] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchComplaint();
  }, [id]);

  const fetchComplaint = async () => {
    try {
      const res = await getComplaints();
      const found = res.data.data.find(c => c._id === id);
      setComplaint(found);
    } catch (err) {
      setError('Failed to load complaint');
    }
  };

  const handleResponse = async () => {
    try {
      await addResponse({ complaintId: id, content });
      fetchComplaint();
      setContent('');
    } catch (err) {
      setError('Failed to add response');
    }
  };

  const handleAutoReply = async () => {
    try {
      await sendAutoReply({ complaintId: id });
      fetchComplaint();
    } catch (err) {
      setError('Failed to send auto-reply');
    }
  };

  const handleSendToDean = async () => {
    try {
      await sendToDean({ title: complaint.title, description: complaint.description });
      alert('Sent to Dean');
    } catch (err) {
      setError('Failed to send to Dean');
    }
  };

  if (!complaint) return <p>Loading...</p>;

  return (
    <div className="page-container">
      <div className="card">
        <h2>{complaint.title}</h2>
        <p>{complaint.description}</p>
        {complaint.image && <img src={`${complaint.image}`} alt="Complaint" style={{ maxWidth: '100%', marginTop: '1rem' }} />}
      </div>
      <h3>Messages:</h3>
      <div className="messages-card">
        <ul>
          {complaint.messages.map((msg, idx) => (
            <li key={idx}>{msg.content} - {new Date(msg.createdAt).toLocaleString()}</li>
          ))}
        </ul>
      </div>
      {error && <p className="alert">{error}</p>}
      {user.role === 'warden' ? (
        <div className="response-form">
          <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Add response" />
          <div className="response-buttons">
            <button onClick={handleResponse}>Add Response</button>
            <button onClick={handleAutoReply}>Auto-Reply</button>
            <button onClick={handleSendToDean}>Send to Dean</button>
          </div>
        </div>
      ) : (
        <p><em>Only wardens may reply to complaints.</em></p>
      )}
    </div>
  );
}

export default ComplaintDetail;