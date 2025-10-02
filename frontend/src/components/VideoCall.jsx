import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaMicrophone, FaMicrophoneSlash, FaVideo, FaVideoSlash, FaPhoneSlash } from 'react-icons/fa';
import Chat from './Chat';
import '../styles/VideoCall.css';

// Use environment variables for deployment
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws/signaling';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/rooms';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    // Add free TURN servers for better NAT traversal
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    // Add public TURN servers (these are free but may have limitations)
    {
      urls: 'turn:openrelay.metered.ca:80',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    },
    {
      urls: 'turn:openrelay.metered.ca:443',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    },
    {
      urls: 'turn:openrelay.metered.ca:443?transport=tcp',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    }
  ],
  iceCandidatePoolSize: 10
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
  const [isRoomInactive, setIsRoomInactive] = useState(false);
  
  const localVideoRef = useRef(null);
  const wsRef = useRef(null);
  const peerConnectionsRef = useRef(new Map());
  const streamRef = useRef(null); // Add stream ref for immediate access
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

  // Add this useEffect to handle peer connections when localStream is ready
  useEffect(() => {
    if (localStream && participants.length > 0) {
      console.log(`🔄 Local stream updated, recreating connections with ${participants.length} participants`);
      
      // Recreate peer connections for existing participants now that we have the stream
      participants.forEach(async (participant) => {
        if (username > participant) {
          // Remove existing connection if any
          const existingPc = peerConnectionsRef.current.get(participant);
          if (existingPc) {
            existingPc.close();
            peerConnectionsRef.current.delete(participant);
          }
          
          // Create new connection with stream
          await createPeerConnection(participant, true);
        }
      });
    }
  }, [localStream, participants]);

  const initializeCall = async () => {
    try {
      console.log('Requesting camera and microphone permissions...');
      // Get local media stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      console.log('✅ Camera and microphone access granted');
      
      // Set video source immediately
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      // Set stream in state
      setLocalStream(stream);
      
      // Use the actual stream variable for checking, not state
      if (stream && stream.getTracks().length > 0) {
        console.log(`📹 Stream ready with ${stream.getTracks().length} tracks`);
        // Store stream in a ref for immediate access
        streamRef.current = stream;
        connectWebSocket();
      } else {
        console.warn('⚠️ Stream not properly initialized');
        setError('Stream initialization failed');
      }
      
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

      // Handle error messages from server
      if (message.type === 'error') {
        if (message.message.includes('Room is not active')) {
          setIsRoomInactive(true);
          setError('Room is inactive. Only the creator can reactivate it.');
        } else {
          setError(message.message || 'Connection error');
        }
        return;
      }

      // Handle regular messages
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

    ws.onclose = (event) => {
      console.log('WebSocket disconnected:', event.code, event.reason);
      if (event.code === 1008) { // Policy violation - room might be inactive
        setIsRoomInactive(true);
        setError('Room is inactive. Only the creator can reactivate it.');
      }
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

    console.log(`🔗 Creating peer connection with ${remoteUser}, createOffer: ${createOffer}`);
    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionsRef.current.set(remoteUser, pc);

    // Log connection state changes
    pc.onconnectionstatechange = () => {
      console.log(`📡 Connection state with ${remoteUser}:`, pc.connectionState);
      if (pc.connectionState === 'failed') {
        console.error(`❌ Connection failed with ${remoteUser}, attempting to restart...`);
        // Optionally restart ICE connection
      }
    };

    // Log ICE connection state changes
    pc.oniceconnectionstatechange = () => {
      console.log(`🧊 ICE connection state with ${remoteUser}:`, pc.iceConnectionState);
    };

    // Log signaling state changes
    pc.onsignalingstatechange = () => {
      console.log(`📶 Signaling state with ${remoteUser}:`, pc.signalingState);
    };

    // Add local tracks with detailed logging
    const currentStream = streamRef.current || localStream;
    if (currentStream) {
      const tracks = currentStream.getTracks();
      console.log(`📹 Found ${tracks.length} local tracks for ${remoteUser}:`, tracks.map(t => `${t.kind} (${t.enabled ? 'enabled' : 'disabled'})`));
      
      tracks.forEach(track => {
        console.log(`➕ Adding ${track.kind} track to peer connection with ${remoteUser}`);
        pc.addTrack(track, currentStream);
      });
    } else {
      console.warn(`⚠️ No local stream available when creating connection with ${remoteUser}`);
    }

    // Handle remote stream with detailed logging
    pc.ontrack = (event) => {
      console.log(`📺 Received remote track from ${remoteUser}:`, {
        kind: event.track.kind,
        enabled: event.track.enabled,
        streams: event.streams.length,
        streamId: event.streams[0]?.id
      });
      
      setRemoteStreams(prev => {
        const newMap = new Map(prev);
        newMap.set(remoteUser, event.streams[0]);
        console.log(`📊 Updated remote streams, now tracking ${newMap.size} users`);
        return newMap;
      });
    };

    // Handle ICE candidates with detailed logging
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log(`🧊 Generated ICE candidate for ${remoteUser}:`, {
          candidate: event.candidate.candidate.substring(0, 50) + '...',
          type: event.candidate.type,
          protocol: event.candidate.protocol,
          address: event.candidate.address,
          port: event.candidate.port
        });
        
        if (wsRef.current) {
          wsRef.current.send(JSON.stringify({
            type: 'ice-candidate',
            candidate: event.candidate,
            target: remoteUser,
            sender: username,
            roomCode: roomCode
          }));
        }
      } else {
        console.log(`🧊 ICE gathering complete for ${remoteUser}`);
      }
    };

    if (createOffer) {
      try {
        console.log(`📤 Creating offer for ${remoteUser}`);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        
        console.log(`📤 Sending offer to ${remoteUser}:`, {
          type: offer.type,
          sdp: offer.sdp.substring(0, 100) + '...'
        });
        
        wsRef.current.send(JSON.stringify({
          type: 'offer',
          offer: offer,
          target: remoteUser,
          sender: username,
          roomCode: roomCode
        }));
      } catch (err) {
        console.error('❌ Error creating offer:', err);
      }
    }

    return pc;
  };

  const handleOffer = async (message) => {
    console.log(`📥 Received offer from ${message.sender}:`, {
      type: message.offer.type,
      sdp: message.offer.sdp.substring(0, 100) + '...'
    });
    
    const pc = await createPeerConnection(message.sender, false);
    
    try {
      console.log(`📝 Setting remote description for offer from ${message.sender}`);
      await pc.setRemoteDescription(new RTCSessionDescription(message.offer));
      
      console.log(`📤 Creating answer for ${message.sender}`);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      console.log(`📤 Sending answer to ${message.sender}:`, {
        type: answer.type,
        sdp: answer.sdp.substring(0, 100) + '...'
      });
      
      wsRef.current.send(JSON.stringify({
        type: 'answer',
        answer: answer,
        target: message.sender,
        sender: username,
        roomCode: roomCode
      }));
    } catch (err) {
      console.error('❌ Error handling offer:', err);
    }
  };

  const handleAnswer = async (message) => {
    console.log(`📥 Received answer from ${message.sender}:`, {
      type: message.answer.type,
      sdp: message.answer.sdp.substring(0, 100) + '...'
    });
    
    const pc = peerConnectionsRef.current.get(message.sender);
    if (pc) {
      try {
        console.log(`📝 Current signaling state with ${message.sender}:`, pc.signalingState);
        
        // Check if we're in the right state to receive an answer
        if (pc.signalingState !== 'have-local-offer') {
          console.warn(`⚠️ Cannot process answer from ${message.sender}. Current state: ${pc.signalingState}`);
          return;
        }
        
        console.log(`📝 Setting remote description for answer from ${message.sender}`);
        await pc.setRemoteDescription(new RTCSessionDescription(message.answer));
        console.log(`✅ Answer processed for ${message.sender}`);
      } catch (err) {
        console.error('❌ Error handling answer:', err);
        // If state is wrong, recreate the connection
        if (err.message.includes('wrong state')) {
          console.log(`🔄 Recreating connection with ${message.sender} due to state conflict`);
          peerConnectionsRef.current.delete(message.sender);
          await createPeerConnection(message.sender, false);
        }
      }
    } else {
      console.warn(`⚠️ No peer connection found for ${message.sender}`);
    }
  };

  const handleIceCandidate = async (message) => {
    console.log(`🧊 Received ICE candidate from ${message.sender}:`, {
      candidate: message.candidate.candidate.substring(0, 50) + '...',
      type: message.candidate.type,
      protocol: message.candidate.protocol,
      address: message.candidate.address,
      port: message.candidate.port
    });
    
    const pc = peerConnectionsRef.current.get(message.sender);
    if (pc && message.candidate) {
      try {
        console.log(`➕ Adding ICE candidate from ${message.sender}`);
        await pc.addIceCandidate(new RTCIceCandidate(message.candidate));
        console.log(`✅ ICE candidate added from ${message.sender}`);
      } catch (err) {
        console.error(`❌ Error adding ICE candidate from ${message.sender}:`, err);
      }
    } else {
      console.warn(`⚠️ No peer connection found for ${message.sender} or no candidate provided`);
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

  const reactivateRoom = async () => {
    try {
      const response = await fetch(`${API_URL}/reactivate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomCode: roomCode,
          username: username
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsRoomInactive(false);
        setError('');
        // Reconnect WebSocket
        connectWebSocket();
      } else {
        setError(data.error || 'Failed to reactivate room');
      }
    } catch (err) {
      console.error('Error reactivating room:', err);
      setError('Failed to reactivate room');
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
          <strong>⚠️ {isRoomInactive ? 'Room Inactive' : 'Camera/Microphone Issue'}:</strong> {error}
          <div className="error-help">
            {isRoomInactive ? (
              <div>
                <p>🔄 This room is inactive because everyone left.</p>
                <p>Only the person who created this room can reactivate it.</p>
                <button 
                  className="reactivate-btn" 
                  onClick={reactivateRoom}
                  style={{
                    marginTop: '10px',
                    padding: '10px 20px',
                    background: '#667eea',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  🔄 Reactivate Room
                </button>
              </div>
            ) : (
              <div>
                <p>💡 To fix this:</p>
                <ol>
                  <li>Click the 🔒 lock icon in your browser address bar</li>
                  <li>Allow Camera and Microphone access</li>
                  <li>Refresh this page</li>
                </ol>
              </div>
            )}
          </div>
        </div>
      )}

      <div className={`video-grid ${participants.length >= 5 ? 'has-5-or-more' : participants.length >= 3 ? 'has-3' : participants.length === 2 ? 'has-2' : ''}`}>
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
        
        {/* Show placeholder for participants who haven't sent video yet */}
        {participants.filter(p => !remoteStreams.has(p)).map(user => (
          <div key={user} className="video-wrapper waiting">
            <div className="video-off-overlay">
              <div>📹</div>
              <div>{user}</div>
              <div style={{ fontSize: '12px', marginTop: '5px' }}>Connecting...</div>
            </div>
          </div>
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
      
      {/* Chat Component */}
      <Chat 
        roomCode={roomCode} 
        username={username} 
        ws={wsRef.current} 
      />
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
