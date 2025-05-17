package uk.co.suskins.pubgolf.service

import dev.forkhandles.result4k.Result
import dev.forkhandles.result4k.map
import uk.co.suskins.pubgolf.models.CreateGameResponse
import uk.co.suskins.pubgolf.models.Game
import uk.co.suskins.pubgolf.models.Player
import java.util.*
import kotlin.random.Random

class GameService(private val gameRepository: GameRepository) {
    private val golfTerms = listOf(
        "PAR", "BIRDIE", "BOGEY", "EAGLE", "ALBATROSS", "ACE", "FORE", "HOOK", "SLICE"
    )

    fun createGame(name: String): Result<CreateGameResponse, PubGolfFailure> {
        val host = Player(UUID.randomUUID(), name)
        val game = Game(
            id = UUID.randomUUID(),
            code = generateGameCode(),
            players = listOf(host)
        )

        return gameRepository.save(game).map {
            CreateGameResponse(it.id.toString(), it.code, host.id.toString(), host.name)
        }
    }

    private fun generateGameCode() =
        "${golfTerms.random()}${Random.nextInt(0, 1000).toString().padStart(3, '0')}".uppercase()
}

interface PubGolfFailure
data class NotFoundFailure(val message: String) : PubGolfFailure

interface GameRepository {
    fun save(game: Game): Result<Game, PubGolfFailure>
    fun findByCode(code: String): Result<Game, PubGolfFailure>
}