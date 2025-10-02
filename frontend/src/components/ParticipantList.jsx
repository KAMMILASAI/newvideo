import React, { useState, useEffect, useRef } from 'react';
import '../styles/ParticipantList.css';

const ParticipantList = ({ participants, username, isOpen, setIsOpen }) => {
  const participantContainerRef = useRef(null);
  const totalParticipants = participants.length + 1; // +1 for current user

  // Handle click outside to close participant list
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (participantContainerRef.current && !participantContainerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, setIsOpen]);

  return (
    <div 
      ref={participantContainerRef}
      className={`participant-container ${isOpen ? 'open' : ''}`}
    >
      {/* Participant Panel */}
      {isOpen && (
        <div className="participant-panel">
          <div className="participant-header">
            <button 
              className="mobile-back-btn" 
              onClick={() => setIsOpen(false)}
              title="Close Participants"
            >
              ✕
            </button>
            <h3>Participants</h3>
          </div>
          <div className="participant-list">
            {/* Current User */}
            <div className="participant-item current-user">
              <div className="participant-avatar">
                {username.charAt(0).toUpperCase()}
              </div>
              <div className="participant-info">
                <div className="participant-name">{username}</div>
                <div className="participant-status">You</div>
              </div>
            </div>

            {/* Other Participants */}
            {participants.map((participant, index) => (
              <div key={index} className="participant-item">
                <div className="participant-avatar">
                  {participant.charAt(0).toUpperCase()}
                </div>
                <div className="participant-info">
                  <div className="participant-name">{participant}</div>
                  <div className="participant-status">In call</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ParticipantList;
