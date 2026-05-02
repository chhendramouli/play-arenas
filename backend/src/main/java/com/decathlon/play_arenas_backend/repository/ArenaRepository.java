package com.decathlon.play_arenas_backend.repository;

import com.decathlon.play_arenas_backend.model.Arena;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.UUID;

public interface ArenaRepository extends JpaRepository<Arena, UUID> {

    @Query("SELECT a FROM Arena a WHERE " +
           "(:sport IS NULL OR LOWER(a.sportType) = LOWER(:sport)) AND " +
           "(:search IS NULL OR LOWER(a.name) LIKE LOWER(CONCAT('%',:search,'%')) " +
           "   OR LOWER(a.location) LIKE LOWER(CONCAT('%',:search,'%')))")
    List<Arena> search(@Param("sport") String sport, @Param("search") String search);
}
