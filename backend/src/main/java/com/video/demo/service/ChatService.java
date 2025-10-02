package com.video.demo.service;

import com.video.demo.model.ChatMessage;
import com.video.demo.dto.ChatMessageRequest;
import com.video.demo.dto.ChatMessageResponse;
import com.video.demo.repository.ChatMessageRepository;
import com.video.demo.repository.RoomRepository;
import com.video.demo.model.Room;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChatService {
    
    private final ChatMessageRepository chatMessageRepository;
    private final RoomRepository roomRepository;
    
    public ChatMessageResponse sendMessage(ChatMessageRequest request) {
        // Verify room exists and user is participant
        Room room = roomRepository.findByRoomCode(request.getRoomCode())
            .orElseThrow(() -> new RuntimeException("Room not found"));
        
        if (!room.getParticipants().contains(request.getUsername())) {
            throw new RuntimeException("User is not a participant in this room");
        }
        
        ChatMessage chatMessage = new ChatMessage(
            request.getRoomCode(),
            request.getUsername(),
            request.getMessage()
        );
        
        chatMessage = chatMessageRepository.save(chatMessage);
        
        return mapToResponse(chatMessage);
    }
    
    public List<ChatMessageResponse> getChatHistory(String roomCode) {
        // Verify room exists
        roomRepository.findByRoomCode(roomCode)
            .orElseThrow(() -> new RuntimeException("Room not found"));
        
        List<ChatMessage> messages = chatMessageRepository.findByRoomCodeOrderByTimestampAsc(roomCode);
        
        return messages.stream()
            .map(this::mapToResponse)
            .collect(Collectors.toList());
    }
    
    public void deleteChatHistory(String roomCode) {
        // Verify room exists
        roomRepository.findByRoomCode(roomCode)
            .orElseThrow(() -> new RuntimeException("Room not found"));
        
        chatMessageRepository.deleteByRoomCode(roomCode);
    }
    
    private ChatMessageResponse mapToResponse(ChatMessage chatMessage) {
        return new ChatMessageResponse(
            chatMessage.getId(),
            chatMessage.getRoomCode(),
            chatMessage.getUsername(),
            chatMessage.getMessage(),
            chatMessage.getTimestamp()
        );
    }
}
