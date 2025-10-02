package com.video.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RoomResponse {
    private String id;
    private String roomCode;
    private String roomName;
    private LocalDateTime createdAt;
    private Set<String> participants;
    private boolean active;
}
