package uk.co.suskins.pubgolf.service

import dev.forkhandles.result4k.Failure
import dev.forkhandles.result4k.Result
import dev.forkhandles.result4k.flatMap
import dev.forkhandles.result4k.map
import uk.co.suskins.pubgolf.models.*
import uk.co.suskins.pubgolf.repository.GameRepository
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

        return gameRepository.save(game).map { it }
    }

    fun joinGame(gameCode: String, name: String): Result<Game, PubGolfFailure> =
        gameRepository.find(gameCode).flatMap { game ->
            if (game.players.any { it.name.equals(name, ignoreCase = true) }) {
                Failure(PlayerAlreadyExistsFailure("Player `$name` already exists for game `$gameCode`."))
            } else {
                val player = Player(UUID.randomUUID(), name)
                val updated = game.copy(players = game.players + player)
                gameRepository.save(updated).map { it }
            }
        }

    private fun generateGameCode() =
        "${golfTerms.random()}${Random.nextInt(0, 1000).toString().padStart(3, '0')}".uppercase()

    fun gameState(gameCode: String): Result<Game, PubGolfFailure> = gameRepository.find(gameCode)

    fun submitScore(gameCode: String, playerId: UUID, hole: Int, score: Int): Result<Unit, PubGolfFailure> =
        gameRepository.find(gameCode).flatMap { game ->
            if (game.players.none { it.matches(playerId) }) {
                Failure(PlayerNotFoundFailure("Player `$playerId` not found for game `$gameCode`."))
            } else {
                val updatedPlayers = game.players.map {
                    if (it.matches(playerId)) {
                        it.updateScore(hole, score)
                    } else {
                        it
                    }
                }
                gameRepository.save(game.copy(players = updatedPlayers)).map { Unit }
            }
        }
}


