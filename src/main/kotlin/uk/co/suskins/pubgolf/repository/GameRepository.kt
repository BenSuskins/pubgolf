package uk.co.suskins.pubgolf.repository

import uk.co.suskins.pubgolf.model.Game
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface GameRepository : JpaRepository<Game, Long> {
    fun findByIdentifier(identifier: String): Game?
}
