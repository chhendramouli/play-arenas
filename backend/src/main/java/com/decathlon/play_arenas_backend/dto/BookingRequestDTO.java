package com.decathlon.play_arenas_backend.dto;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;

public class BookingRequestDTO {
    @NotNull(message = "arenaId is required")
    private UUID arenaId;

    private String startTime;
    private String endTime;

    public UUID getArenaId() { return arenaId; }
    public void setArenaId(UUID arenaId) { this.arenaId = arenaId; }
    public String getStartTime() { return startTime; }
    public void setStartTime(String startTime) { this.startTime = startTime; }
    public String getEndTime() { return endTime; }
    public void setEndTime(String endTime) { this.endTime = endTime; }
}
