import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaMicrophone, FaMicrophoneSlash, FaVideo, FaVideoSlash, FaPhoneSlash } from 'react-icons/fa';
import '../styles/VideoCall.css';

// Use environment variables for deployment
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws/signaling';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/rooms';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

function VideoCall() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState(new Map());
  const [participants, setParticipants] = useState([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [error, setError] = useState('');
  
  const localVideoRef = useRef(null);
  const wsRef = useRef(null);
  const peerConnectionsRef = useRef(new Map());
  const username = sessionStorage.getItem('username');

  useEffect(() => {
    if (!username || !roomCode) {
      navigate('/');
      return;
    }

    initializeCall();

    return () => {
      cleanup();
    };
  }, []);

  const initializeCall = async () => {
    try {
      console.log('Requesting camera and microphone permissions...');
      // Get local media stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      console.log('✅ Camera and microphone access granted');
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Connect to WebSocket
      connectWebSocket();
    } catch (err) {
      console.error('❌ Error accessing media devices:', err);
      
      // Show user-friendly error message
      if (err.name === 'NotAllowedError') {
        setError('Camera/Microphone permission denied. Please allow access and refresh the page.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera or microphone found. Please connect devices and refresh.');
      } else {
        setError('Failed to access camera/microphone: ' + err.message);
      }
      
      // Set default states when no media
      setIsVideoOff(true);
      setIsMuted(true);
      
      // Still connect to WebSocket even without media
      connectWebSocket();
    }
  };

  const connectWebSocket = () => {
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected');
      // Join room
      ws.send(JSON.stringify({
        type: 'join',
        roomCode: roomCode,
        username: username
      }));
    };

    ws.onmessage = async (event) => {
      const message = JSON.parse(event.data);
      console.log('Received message:', message);

      switch (message.type) {
        case 'participants':
          handleParticipants(message.users);
          break;
        case 'user-joined':
          handleUserJoined(message.username);
          break;
        case 'offer':
          handleOffer(message);
          break;
        case 'answer':
          handleAnswer(message);
          break;
        case 'ice-candidate':
          handleIceCandidate(message);
          break;
        case 'user-left':
          handleUserLeft(message.username);
          break;
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setError('Connection error');
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
    };
  };

  const handleParticipants = async (users) => {
    const otherUsers = Array.from(users).filter(u => u !== username);
    setParticipants(otherUsers);

    // Only create offers for users who joined before us (alphabetically)
    for (const user of otherUsers) {
      if (username > user) {
        await createPeerConnection(user, true);
      }
    }
  };

  const handleUserJoined = async (newUser) => {
    if (newUser !== username) {
      setParticipants(prev => [...prev, newUser]);
      // Only the user who joined later should create the offer
      // This prevents both users from creating offers simultaneously
      if (username > newUser) {
        // Alphabetical comparison to determine who creates offer
        await createPeerConnection(newUser, true);
      }
    }
  };

  const createPeerConnection = async (remoteUser, createOffer) => {
    if (peerConnectionsRef.current.has(remoteUser)) {
      return peerConnectionsRef.current.get(remoteUser);
    }

    console.log(`Creating peer connection with ${remoteUser}, createOffer: ${createOffer}`);
    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionsRef.current.set(remoteUser, pc);

    // Add local tracks
    if (localStream) {
      localStream.getTracks().forEach(track => {
        console.log(`Adding ${track.kind} track to peer connection with ${remoteUser}`);
        pc.addTrack(track, localStream);
      });
    } else {
      console.warn(`No local stream available when creating connection with ${remoteUser}`);
    }

    // Handle remote stream
    pc.ontrack = (event) => {
      console.log('Received remote track from', remoteUser);
      setRemoteStreams(prev => {
        const newMap = new Map(prev);
        newMap.set(remoteUser, event.streams[0]);
        return newMap;
      });
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && wsRef.current) {
        wsRef.current.send(JSON.stringify({
          type: 'ice-candidate',
          candidate: event.candidate,
          target: remoteUser,
          sender: username,
          roomCode: roomCode
        }));
      }
    };

    // Handle connection state
    pc.onconnectionstatechange = () => {
      console.log(`Connection state with ${remoteUser}:`, pc.connectionState);
    };

    if (createOffer) {
      try {
        console.log(`Creating offer for ${remoteUser}`);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        
        console.log(`Sending offer to ${remoteUser}`);
        wsRef.current.send(JSON.stringify({
          type: 'offer',
          offer: offer,
          target: remoteUser,
          sender: username,
          roomCode: roomCode
        }));
      } catch (err) {
        console.error('Error creating offer:', err);
      }
    }

    return pc;
  };

  const handleOffer = async (message) => {
    console.log(`Received offer from ${message.sender}`);
    const pc = await createPeerConnection(message.sender, false);
    
    try {
      await pc.setRemoteDescription(new RTCSessionDescription(message.offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      console.log(`Sending answer to ${message.sender}`);
      wsRef.current.send(JSON.stringify({
        type: 'answer',
        answer: answer,
        target: message.sender,
        sender: username,
        roomCode: roomCode
      }));
    } catch (err) {
      console.error('Error handling offer:', err);
    }
  };

  const handleAnswer = async (message) => {
    console.log(`Received answer from ${message.sender}`);
    const pc = peerConnectionsRef.current.get(message.sender);
    if (pc) {
      try {
        // Check if we're in the right state to receive an answer
        if (pc.signalingState !== 'have-local-offer') {
          console.warn(`Cannot process answer from ${message.sender}. Current state: ${pc.signalingState}`);
          return;
        }
        await pc.setRemoteDescription(new RTCSessionDescription(message.answer));
        console.log(`Answer processed for ${message.sender}`);
      } catch (err) {
        console.error('Error handling answer:', err);
        // If state is wrong, recreate the connection
        if (err.message.includes('wrong state')) {
          console.log(`Recreating connection with ${message.sender} due to state conflict`);
          peerConnectionsRef.current.delete(message.sender);
          await createPeerConnection(message.sender, false);
        }
      }
    } else {
      console.warn(`No peer connection found for ${message.sender}`);
    }
  };

  const handleIceCandidate = async (message) => {
    const pc = peerConnectionsRef.current.get(message.sender);
    if (pc && message.candidate) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(message.candidate));
      } catch (err) {
        console.error(`Error adding ICE candidate from ${message.sender}:`, err);
      }
    }
  };

  const handleUserLeft = (user) => {
    setParticipants(prev => prev.filter(u => u !== user));
    setRemoteStreams(prev => {
      const newMap = new Map(prev);
      newMap.delete(user);
      return newMap;
    });

    const pc = peerConnectionsRef.current.get(user);
    if (pc) {
      pc.close();
      peerConnectionsRef.current.delete(user);
    }
  };

  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  const leaveCall = async () => {
    // Notify server
    try {
      await fetch(`${API_URL}/leave`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomCode: roomCode,
          username: username
        }),
      });
    } catch (err) {
      console.error('Error leaving room:', err);
    }

    // Notify other participants
    if (wsRef.current) {
      wsRef.current.send(JSON.stringify({
        type: 'leave',
        roomCode: roomCode,
        username: username
      }));
    }

    cleanup();
    navigate('/');
  };

  const cleanup = () => {
    // Stop local stream
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }

    // Close all peer connections
    peerConnectionsRef.current.forEach(pc => pc.close());
    peerConnectionsRef.current.clear();

    // Close WebSocket
    if (wsRef.current) {
      wsRef.current.close();
    }
  };

  return (
    <div className="video-call-container">
      <div className="video-header">
        <h2>Room: {roomCode}</h2>
        <span className="participant-count">
          {participants.length + 1} participant{participants.length !== 0 ? 's' : ''}
        </span>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-message">
          <strong>⚠️ Camera/Microphone Issue:</strong> {error}
          <div className="error-help">
            <p>💡 To fix this:</p>
            <ol>
              <li>Click the 🔒 lock icon in your browser address bar</li>
              <li>Allow Camera and Microphone access</li>
              <li>Refresh this page</li>
            </ol>
          </div>
        </div>
      )}

      <div className="video-grid">
        {/* Local Video */}
        <div className="video-wrapper local">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="video-element"
          />
          <div className="video-label">You ({username})</div>
          {isVideoOff && <div className="video-off-overlay">Video Off</div>}
        </div>

        {/* Remote Videos */}
        {Array.from(remoteStreams.entries()).map(([user, stream]) => (
          <RemoteVideo key={user} username={user} stream={stream} />
        ))}
      </div>

      <div className="controls-bar">
        <button
          className={`control-btn ${isMuted ? 'active' : ''}`}
          onClick={toggleMute}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <FaMicrophoneSlash size={24} /> : <FaMicrophone size={24} />}
        </button>

        <button
          className={`control-btn ${isVideoOff ? 'active' : ''}`}
          onClick={toggleVideo}
          title={isVideoOff ? 'Turn On Video' : 'Turn Off Video'}
        >
          {isVideoOff ? <FaVideoSlash size={24} /> : <FaVideo size={24} />}
        </button>

        <button
          className="control-btn leave-btn"
          onClick={leaveCall}
          title="Leave Call"
        >
          <FaPhoneSlash size={24} />
        </button>
      </div>
    </div>
  );
}

function RemoteVideo({ username, stream }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="video-wrapper">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="video-element"
      />
      <div className="video-label">{username}</div>
    </div>
  );
}

export default VideoCall;
