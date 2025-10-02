package com.video.demo.controller;

import com.video.demo.dto.JoinRoomRequest;
import com.video.demo.dto.RoomRequest;
import com.video.demo.dto.RoomResponse;
import com.video.demo.dto.ChatMessageRequest;
import com.video.demo.dto.ChatMessageResponse;
import com.video.demo.service.RoomService;
import com.video.demo.service.ChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.List;

@RestController
@RequestMapping("/api/rooms")
@RequiredArgsConstructor
public class RoomController {
    
    private final RoomService roomService;
    private final ChatService chatService;
    
    @PostMapping("/create")
    public ResponseEntity<?> createRoom(@Valid @RequestBody RoomRequest request) {
        try {
            RoomResponse room = roomService.createRoom(request);
            return ResponseEntity.ok(room);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", e.getMessage()));
        }
    }
    
    @PostMapping("/join")
    public ResponseEntity<?> joinRoom(@Valid @RequestBody JoinRoomRequest request) {
        try {
            RoomResponse room = roomService.joinRoom(request);
            return ResponseEntity.ok(room);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", e.getMessage()));
        }
    }
    
    @PostMapping("/leave")
    public ResponseEntity<?> leaveRoom(@RequestBody Map<String, String> request) {
        try {
            String roomCode = request.get("roomCode");
            String username = request.get("username");
            roomService.leaveRoom(roomCode, username);
            return ResponseEntity.ok(Map.of("message", "Left room successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", e.getMessage()));
        }
    }
    
    @PostMapping("/reactivate")
    public ResponseEntity<?> reactivateRoom(@RequestBody Map<String, String> request) {
        try {
            String roomCode = request.get("roomCode");
            String username = request.get("username");
            roomService.reactivateRoom(roomCode, username);
            return ResponseEntity.ok(Map.of("message", "Room reactivated successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", e.getMessage()));
        }
    }
    
    // Chat endpoints
    @PostMapping("/chat/send")
    public ResponseEntity<?> sendChatMessage(@RequestBody @Valid ChatMessageRequest request) {
        try {
            ChatMessageResponse response = chatService.sendMessage(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", e.getMessage()));
        }
    }
    
    @GetMapping("/chat/history/{roomCode}")
    public ResponseEntity<?> getChatHistory(@PathVariable String roomCode) {
        try {
            List<ChatMessageResponse> messages = chatService.getChatHistory(roomCode);
            return ResponseEntity.ok(messages);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", e.getMessage()));
        }
    }
    
    @DeleteMapping("/chat/history/{roomCode}")
    public ResponseEntity<?> deleteChatHistory(@PathVariable String roomCode) {
        try {
            chatService.deleteChatHistory(roomCode);
            return ResponseEntity.ok(Map.of("message", "Chat history deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", e.getMessage()));
        }
    }
    
    @PostMapping("/end-meeting")
    public ResponseEntity<?> endMeeting(@RequestBody Map<String, String> request) {
        try {
            String roomCode = request.get("roomCode");
            String username = request.get("username");
            
            // Delete chat history first
            chatService.deleteChatHistory(roomCode);
            
            // Delete the room
            roomService.deleteRoom(roomCode, username);
            
            return ResponseEntity.ok(Map.of("message", "Meeting ended successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", e.getMessage()));
        }
    }
}
