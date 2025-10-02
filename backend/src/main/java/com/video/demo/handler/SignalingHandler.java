package com.video.demo.handler;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Component
public class SignalingHandler extends TextWebSocketHandler {
    
    private final Map<String, Map<String, WebSocketSession>> rooms = new ConcurrentHashMap<>();
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        log.info("WebSocket connection established: {}", session.getId());
    }
    
    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String payload = message.getPayload();
        log.info("Received message: {}", payload);
        
        try {
            Map<String, Object> data = objectMapper.readValue(payload, new TypeReference<Map<String, Object>>() {});
            String type = (String) data.get("type");
            String roomCode = (String) data.get("roomCode");
            String username = (String) data.get("username");
            
            switch (type) {
                case "join":
                    handleJoin(session, roomCode, username);
                    break;
                case "offer":
                case "answer":
                case "ice-candidate":
                    handleSignaling(session, data, roomCode);
                    break;
                case "leave":
                    handleLeave(session, roomCode, username);
                    break;
                default:
                    log.warn("Unknown message type: {}", type);
            }
        } catch (Exception e) {
            log.error("Error handling message: {}", e.getMessage());
        }
    }
    
    private void handleJoin(WebSocketSession session, String roomCode, String username) throws IOException {
        rooms.computeIfAbsent(roomCode, k -> new ConcurrentHashMap<>())
              .put(username, session);
        
        // Notify other participants
        Map<String, Object> joinMessage = Map.of(
            "type", "user-joined",
            "username", username
        );
        
        broadcastToRoom(roomCode, joinMessage, username);
        
        // Send existing participants list to new user
        Map<String, Object> participantsMessage = Map.of(
            "type", "participants",
            "users", rooms.get(roomCode).keySet()
        );
        
        session.sendMessage(new TextMessage(objectMapper.writeValueAsString(participantsMessage)));
        
        log.info("User {} joined room {}", username, roomCode);
    }
    
    private void handleSignaling(WebSocketSession session, Map<String, Object> data, String roomCode) throws IOException {
        String targetUser = (String) data.get("target");
        
        if (rooms.containsKey(roomCode) && rooms.get(roomCode).containsKey(targetUser)) {
            WebSocketSession targetSession = rooms.get(roomCode).get(targetUser);
            targetSession.sendMessage(new TextMessage(objectMapper.writeValueAsString(data)));
        }
    }
    
    private void handleLeave(WebSocketSession session, String roomCode, String username) throws IOException {
        if (rooms.containsKey(roomCode)) {
            rooms.get(roomCode).remove(username);
            
            // Notify other participants
            Map<String, Object> leaveMessage = Map.of(
                "type", "user-left",
                "username", username
            );
            
            broadcastToRoom(roomCode, leaveMessage, null);
            
            // Remove room if empty
            if (rooms.get(roomCode).isEmpty()) {
                rooms.remove(roomCode);
            }
            
            log.info("User {} left room {}", username, roomCode);
        }
    }
    
    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        log.info("WebSocket connection closed: {}", session.getId());
        
        // Remove session from all rooms
        rooms.forEach((roomCode, participants) -> {
            participants.entrySet().removeIf(entry -> {
                if (entry.getValue().getId().equals(session.getId())) {
                    try {
                        Map<String, Object> leaveMessage = Map.of(
                            "type", "user-left",
                            "username", entry.getKey()
                        );
                        broadcastToRoom(roomCode, leaveMessage, null);
                    } catch (IOException e) {
                        log.error("Error broadcasting leave message", e);
                    }
                    return true;
                }
                return false;
            });
        });
        
        // Clean up empty rooms
        rooms.entrySet().removeIf(entry -> entry.getValue().isEmpty());
    }
    
    private void broadcastToRoom(String roomCode, Map<String, Object> message, String excludeUser) throws IOException {
        if (!rooms.containsKey(roomCode)) {
            return;
        }
        
        String messageJson = objectMapper.writeValueAsString(message);
        
        for (Map.Entry<String, WebSocketSession> entry : rooms.get(roomCode).entrySet()) {
            if (excludeUser == null || !entry.getKey().equals(excludeUser)) {
                try {
                    entry.getValue().sendMessage(new TextMessage(messageJson));
                } catch (Exception e) {
                    log.error("Error sending message to user {}: {}", entry.getKey(), e.getMessage());
                }
            }
        }
    }
}
