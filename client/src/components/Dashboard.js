import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import "./Dashboard.css";
import axios from 'axios';

const Dashboard = () => {
  const [candidates, setCandidates] = useState([]);
  const [myVote, setMyVote] = useState(null);
  const [result, setResult] = useState(null);
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

    if (decoded.user.role === 'admin') {
      navigate('/admin');
      return;
    }

    const fetchCandidates = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/candidates');
        setCandidates(res.data);
      } catch (err) {
        setError('Error fetching candidates');
      }
    };

    const fetchMyVote = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/votes/my-vote', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMyVote(res.data);
      } catch (err) {
        setError('Error fetching vote');
      }
    };

    const fetchResult = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/result');
        setResult(res.data);
      } catch (err) {
        setError('Error fetching result');
      }
    };

    fetchCandidates();
    fetchMyVote();
    fetchResult();
  }, [navigate]);

  const handleVote = async (candidateId) => {
    try {
      const token = sessionStorage.getItem('token');
      await axios.post(
        'http://localhost:5000/api/votes',
        { candidateId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMyVote(candidates.find((c) => c._id === candidateId));
      setError('');
    } catch (err) {
      setError(err.response?.data.msg || 'Error casting vote');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('token'); // Use sessionStorage
    navigate('/login');
  };

  return (
    <div className="dashboard-container">
      <h1>User Dashboard</h1>
      {error && <p className="error">{error}</p>}
      {result && result.published ? (
        <div className="result">
          <h2>Election Result</h2>
          <p>Winner: {result.winner}</p>
        </div>
      ) : (
        <>
          <h2>Candidates</h2>
          {myVote ? (
            <p>You voted for: {myVote.name}</p>
          ) : (
            <ul>
              {candidates.map((candidate) => (
                <li key={candidate._id}>
                <a
                  href="/manifesto.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className='candidate-link'
                >
                  {candidate.name}
                </a>
                  <button onClick={() => handleVote(candidate._id)} disabled={!!myVote}>
                    Vote
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
      <button className="logout" onClick={handleLogout}>Logout</button>
    </div>
  );
};

export default Dashboard;