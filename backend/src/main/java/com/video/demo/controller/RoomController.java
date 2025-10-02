package com.video.demo.controller;

import com.video.demo.dto.JoinRoomRequest;
import com.video.demo.dto.RoomRequest;
import com.video.demo.dto.RoomResponse;
import com.video.demo.service.RoomService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/rooms")
@RequiredArgsConstructor
public class RoomController {
    
    private final RoomService roomService;
    
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
}
