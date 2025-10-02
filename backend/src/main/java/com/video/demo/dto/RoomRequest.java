package com.video.demo.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RoomRequest {
    
    private String roomCode; // Optional - auto-generated if empty
    
    @NotBlank(message = "Password is required")
    private String password;
    
    private String roomName;
    
    @NotBlank(message = "Creator username is required")
    private String creator;
}
