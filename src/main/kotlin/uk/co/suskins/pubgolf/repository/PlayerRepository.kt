package uk.co.suskins.pubgolf.repository

import uk.co.suskins.pubgolf.model.Game
import uk.co.suskins.pubgolf.model.Player
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface PlayerRepository : JpaRepository<Player, Long> {
    fun findByGame(game: Game): List<Player>
    fun findByGameAndName(game: Game, name: String): Player?
}
