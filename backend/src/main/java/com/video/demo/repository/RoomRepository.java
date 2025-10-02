package com.video.demo.repository;

import com.video.demo.model.Room;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RoomRepository extends MongoRepository<Room, String> {
    Optional<Room> findByRoomCode(String roomCode);
    boolean existsByRoomCode(String roomCode);
}
