package uk.co.suskins.pubgolf.service

import dev.forkhandles.result4k.Result
import dev.forkhandles.result4k.map
import uk.co.suskins.pubgolf.models.Game
import uk.co.suskins.pubgolf.models.Player
import uk.co.suskins.pubgolf.models.PubGolfFailure
import java.util.*
import kotlin.random.Random

class GameService(private val gameRepository: GameRepository) {
    private val golfTerms = listOf("PAR", "BIRDIE", "BOGEY", "EAGLE", "ALBATROSS", "ACE", "FORE", "HOOK", "SLICE")

    fun createGame(name: String): Result<Game, PubGolfFailure> {
        val host = Player(UUID.randomUUID(), name)
        val game = Game(
            id = UUID.randomUUID(),
            code = generateGameCode(),
            players = listOf(host)
        )

        return gameRepository.save(game).map {
            it
        }
    }

    private fun generateGameCode() =
        "${golfTerms.random()}${Random.nextInt(0, 1000).toString().padStart(3, '0')}".uppercase()
}

interface GameRepository {
    fun save(game: Game): Result<Game, PubGolfFailure>
    fun findByCode(code: String): Result<Game, PubGolfFailure>
}