package uk.co.suskins.pubgolf

import dev.forkhandles.result4k.Failure
import dev.forkhandles.result4k.Result
import dev.forkhandles.result4k.Success
import uk.co.suskins.pubgolf.models.Game
import uk.co.suskins.pubgolf.models.GameNotFoundFailure
import uk.co.suskins.pubgolf.models.PubGolfFailure
import uk.co.suskins.pubgolf.repository.GameRepository

class GameRepositoryFake : GameRepository {
    private val store = mutableMapOf<String, Game>()

    override fun save(game: Game): Result<Game, PubGolfFailure> {
        store[game.code.uppercase()] = game
        return Success(game)
    }

    override fun findByCodeIgnoreCase(code: String): Result<Game, PubGolfFailure> {
        return store[code.uppercase()]?.let { Success(it) } ?: Failure(GameNotFoundFailure("Game `$code` not found."))
    }
}