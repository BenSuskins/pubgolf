package uk.co.suskins.pubgolf.repository

import org.springframework.data.jpa.repository.JpaRepository
import uk.co.suskins.pubgolf.models.GameEntity
import java.util.*

interface GameJpaRepository : JpaRepository<GameEntity, UUID> {
    fun findByCode(code: String): GameEntity?
}