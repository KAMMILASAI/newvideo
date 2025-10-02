package com.video.demo.service;

import com.video.demo.dto.JoinRoomRequest;
import com.video.demo.dto.RoomRequest;
import com.video.demo.dto.RoomResponse;
import com.video.demo.model.Room;
import com.video.demo.repository.RoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RoomService {
    
    private final RoomRepository roomRepository;
    
    public RoomResponse createRoom(RoomRequest request) {
        // Generate unique room code if not provided
        String roomCode = request.getRoomCode();
        if (roomCode == null || roomCode.isEmpty()) {
            roomCode = generateRoomCode();
        }
        
        // Check if room code already exists
        if (roomRepository.existsByRoomCode(roomCode)) {
            throw new RuntimeException("Room code already exists");
        }
        
        Room room = new Room(
            roomCode,
            request.getPassword(),
            request.getRoomName() != null ? request.getRoomName() : "Meeting Room",
            request.getCreator() // Add creator
        );
        
        // Add creator as first participant
        room.getParticipants().add(request.getCreator());
        
        Room savedRoom = roomRepository.save(room);
        System.out.println("🏠 Room created: " + roomCode + " by " + request.getCreator());
        return mapToResponse(savedRoom);
    }
    
    public RoomResponse joinRoom(JoinRoomRequest request) {
        Room room = roomRepository.findByRoomCode(request.getRoomCode())
            .orElseThrow(() -> new RuntimeException("Room not found"));
        
        if (!room.getPassword().equals(request.getPassword())) {
            throw new RuntimeException("Invalid password");
        }
        
        // Check if room is active (only creator can reactivate)
        if (!room.isActive()) {
            throw new RuntimeException("Room is not active. Only the creator can reactivate it.");
        }
        
        // Add participant
        room.getParticipants().add(request.getUsername());
        roomRepository.save(room);
        
        return mapToResponse(room);
    }
    
    public void leaveRoom(String roomCode, String username) {
        Room room = roomRepository.findByRoomCode(roomCode)
            .orElseThrow(() -> new RuntimeException("Room not found"));
        
        System.out.println("👤 User " + username + " leaving room: " + roomCode);
        room.getParticipants().remove(username);
        
        // Only deactivate room if the creator leaves
        if (room.getCreator().equals(username)) {
            room.setActive(false);
            System.out.println("🔒 Deactivating room (creator left): " + roomCode);
        }
        
        roomRepository.save(room);
    }
    
    private String generateRoomCode() {
        return UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }
    
    public void reactivateRoom(String roomCode, String username) {
        Room room = roomRepository.findByRoomCode(roomCode)
            .orElseThrow(() -> new RuntimeException("Room not found"));
        
        // Only allow creator to reactivate the room
        if (!room.getCreator().equals(username)) {
            throw new RuntimeException("Only the room creator can reactivate this room");
        }
        
        if (!room.isActive()) {
            room.setActive(true);
            roomRepository.save(room);
            System.out.println("🔄 Room reactivated by creator " + username + ": " + roomCode);
        }
    }
    
    public void deleteRoom(String roomCode, String username) {
        Room room = roomRepository.findByRoomCode(roomCode)
            .orElseThrow(() -> new RuntimeException("Room not found"));
        
        // Only allow creator to delete the room
        if (!room.getCreator().equals(username)) {
            throw new RuntimeException("Only the room creator can delete this room");
        }
        
        System.out.println("🗑️ Deleting room and all data: " + roomCode + " by " + username);
        roomRepository.delete(room);
    }
    
    private RoomResponse mapToResponse(Room room) {
        RoomResponse response = new RoomResponse();
        response.setId(room.getId());
        response.setRoomCode(room.getRoomCode());
        response.setRoomName(room.getRoomName());
        response.setCreatedAt(room.getCreatedAt());
        response.setParticipants(room.getParticipants());
        response.setActive(room.isActive());
        return response;
    }
}
