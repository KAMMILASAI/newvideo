package com.video.demo.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "rooms")
public class Room {
    
    @Id
    private String id;
    
    private String roomCode;
    private String password;
    private String roomName;
    private String creator; // Track who created the room
    private LocalDateTime createdAt;
    private Set<String> participants = new HashSet<>();
    private boolean active;
    
    public Room(String roomCode, String password, String roomName, String creator) {
        this.roomCode = roomCode;
        this.password = password;
        this.roomName = roomName;
        this.creator = creator;
        this.createdAt = LocalDateTime.now();
        this.active = true;
        this.participants = new HashSet<>();
    }
}
