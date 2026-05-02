package com.decathlon.play_arenas_backend.model;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "arenas")
public class Arena {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    private String name;
    private String location;
    private String sportType;
    private Double pricePerHour;
    private String imageUrl;

    @Column(nullable = false)
    private Boolean active = Boolean.TRUE;

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    public String getSportType() { return sportType; }
    public void setSportType(String sportType) { this.sportType = sportType; }
    public Double getPricePerHour() { return pricePerHour; }
    public void setPricePerHour(Double pricePerHour) { this.pricePerHour = pricePerHour; }
    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }
}
