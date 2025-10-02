import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Home.css';

// Use environment variables for deployment
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/rooms';

function Home() {
  const [mode, setMode] = useState('join'); // 'join' or 'create'
  const [formData, setFormData] = useState({
    roomCode: '',
    password: '',
    roomName: '',
    username: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomCode: formData.roomCode || undefined,
          password: formData.password,
          roomName: formData.roomName || 'Meeting Room',
          creator: formData.username
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store room info and navigate
        sessionStorage.setItem('roomCode', data.roomCode);
        sessionStorage.setItem('password', formData.password);
        sessionStorage.setItem('username', formData.username);
        navigate(`/room/${data.roomCode}`);
      } else {
        console.error('Create room error:', data);
        setError(data.error || data.message || 'Failed to create room');
      }
    } catch (err) {
      console.error('Network error:', err);
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomCode: formData.roomCode,
          password: formData.password,
          username: formData.username
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store room info and navigate
        sessionStorage.setItem('roomCode', data.roomCode);
        sessionStorage.setItem('password', formData.password);
        sessionStorage.setItem('username', formData.username);
        navigate(`/room/${data.roomCode}`);
      } else {
        console.error('Join room error:', data);
        setError(data.error || data.message || 'Failed to join room');
      }
    } catch (err) {
      console.error('Network error:', err);
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home-container">
      <div className="home-content">
        <h1 className="app-title">Video Call App</h1>
        <p className="app-subtitle">Connect with anyone, anywhere</p>

        <div className="mode-switch">
          <button
            className={`mode-btn ${mode === 'join' ? 'active' : ''}`}
            onClick={() => setMode('join')}
          >
            Join Room
          </button>
          <button
            className={`mode-btn ${mode === 'create' ? 'active' : ''}`}
            onClick={() => setMode('create')}
          >
            Create Room
          </button>
        </div>

        <form onSubmit={mode === 'create' ? handleCreateRoom : handleJoinRoom} className="room-form">
          {error && <div className="error-message">{error}</div>}

          {mode === 'create' ? (
            <>
              <div className="form-group">
                <label>Room Name (Optional)</label>
                <input
                  type="text"
                  name="roomName"
                  placeholder="My Meeting Room"
                  value={formData.roomName}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Room Code (Optional)</label>
                <input
                  type="text"
                  name="roomCode"
                  placeholder="Leave empty to auto-generate"
                  value={formData.roomCode}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Password *</label>
                <input
                  type="password"
                  name="password"
                  placeholder="Enter room password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Your Name *</label>
                <input
                  type="text"
                  name="username"
                  placeholder="Enter your name"
                  value={formData.username}
                  onChange={handleChange}
                  required
                />
              </div>
            </>
          ) : (
            <>
              <div className="form-group">
                <label>Room Code *</label>
                <input
                  type="text"
                  name="roomCode"
                  placeholder="Enter room code"
                  value={formData.roomCode}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Password *</label>
                <input
                  type="password"
                  name="password"
                  placeholder="Enter room password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Your Name *</label>
                <input
                  type="text"
                  name="username"
                  placeholder="Enter your name"
                  value={formData.username}
                  onChange={handleChange}
                  required
                />
              </div>
            </>
          )}

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Loading...' : mode === 'create' ? 'Create Room' : 'Join Room'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Home;
