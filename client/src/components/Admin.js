import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import "./Admin.css";
import axios from 'axios';

const Admin = () => {
  const [candidates, setCandidates] = useState([]);
  const [newCandidate, setNewCandidate] = useState('');
  const [editCandidate, setEditCandidate] = useState({ id: '', name: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = sessionStorage.getItem('token'); // Use sessionStorage
    if (!token) {
      navigate('/login');
      return;
    }

    let decoded;
    try {
      decoded = jwtDecode(token);
    } catch (error) {
      sessionStorage.removeItem('token'); // Clear invalid token
      navigate('/login');
      return;
    }

    if (decoded.user.role !== 'admin') {
      navigate('/dashboard');
      return;
    }

    fetchCandidates();
  }, [navigate]);

  const fetchCandidates = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/candidates', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCandidates(res.data);
    } catch (err) {
      setError('Error fetching candidates');
    }
  };

  const handleAddCandidate = async (e) => {
    e.preventDefault();
    try {
      const token = sessionStorage.getItem('token');
      const res = await axios.post(
        'http://localhost:5000/api/candidates',
        { name: newCandidate },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCandidates([...candidates, res.data]);
      setNewCandidate('');
      setError('');
    } catch (err) {
      setError(err.response?.data.msg || 'Error adding candidate');
    }
  };

  const handleUpdateCandidate = async (e) => {
    e.preventDefault();
    try {
      const token = sessionStorage.getItem('token');
      const res = await axios.put(
        `http://localhost:5000/api/candidates/${editCandidate.id}`,
        { name: editCandidate.name },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCandidates(
        candidates.map((c) => (c._id === editCandidate.id ? res.data : c))
      );
      setEditCandidate({ id: '', name: '' });
      setError('');
    } catch (err) {
      setError(err.response?.data.msg || 'Error updating candidate');
    }
  };

  const handleDeleteCandidate = async (id) => {
    try {
      const token = sessionStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/candidates/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCandidates(candidates.filter((c) => c._id !== id));
      setError('');
    } catch (err) {
      setError(err.response?.data.msg || 'Error deleting candidate');
    }
  };

  const handlePublishResult = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const res = await axios.post(
        'http://localhost:5000/api/result',
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setError('');
      alert(`Result published: ${res.data.winner}`);
    } catch (err) {
      setError(err.response?.data.msg || 'Error publishing result');
    }
  };

  const handleResetElection = async () => {
    if (window.confirm('Are you sure you want to reset the election? This will clear all candidates, votes, and results.')) {
      try {
        const token = sessionStorage.getItem('token');
        await axios.post(
          'http://localhost:5000/api/reset',
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setCandidates([]);
        setError('');
        alert('Election reset successfully. You can now add new candidates.');
      } catch (err) {
        setError(err.response?.data.msg || 'Error resetting election');
      }
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('token'); // Use sessionStorage
    navigate('/login');
  };

  return (
    <div className="admin-container">
      <h1>Admin Dashboard</h1>
      {error && <p className="error">{error}</p>}
      <h2>Manage Candidates</h2>
      <form onSubmit={handleAddCandidate}>
        <input
          type="text"
          placeholder="Candidate Name"
          value={newCandidate}
          onChange={(e) => setNewCandidate(e.target.value)}
          required
        />
        <button type="submit">Add Candidate</button>
      </form>
      {editCandidate.id && (
        <form onSubmit={handleUpdateCandidate}>
          <input
            type="text"
            value={editCandidate.name}
            onChange={(e) => setEditCandidate({ ...editCandidate, name: e.target.value })}
            required
          />
          <button type="submit">Update Candidate</button>
          <button type="button" onClick={() => setEditCandidate({ id: '', name: '' })}>
            Cancel
          </button>
        </form>
      )}
      {/*  */}
      <ul>
        {candidates.map((candidate) => (
          <li key={candidate._id}>
            {candidate.name} ({candidate.votes} votes)
            <button onClick={() => setEditCandidate({ id: candidate._id, name: candidate.name })}>
              Edit
            </button>
            <button onClick={() => handleDeleteCandidate(candidate._id)}>Delete</button>
          </li>
        ))}
      </ul>
      <button onClick={handlePublishResult}>Publish Result</button>
      <button className="reset" onClick={handleResetElection}>Reset Election</button>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
};

export default Admin;
// 