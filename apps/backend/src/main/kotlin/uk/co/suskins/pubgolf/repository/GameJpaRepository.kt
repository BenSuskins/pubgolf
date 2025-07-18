package uk.co.suskins.pubgolf.repository

import org.springframework.data.jpa.repository.JpaRepository
import uk.co.suskins.pubgolf.models.GameEntity
import java.util.UUID

interface GameJpaRepository : JpaRepository<GameEntity, UUID> {
    fun findByCodeIgnoreCase(code: String): GameEntity?
}
