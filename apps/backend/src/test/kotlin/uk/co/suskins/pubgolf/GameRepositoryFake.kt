package uk.co.suskins.pubgolf

import dev.forkhandles.result4k.Failure
import dev.forkhandles.result4k.Result
import dev.forkhandles.result4k.Success
import uk.co.suskins.pubgolf.models.Game
import uk.co.suskins.pubgolf.models.GameNotFoundFailure
import uk.co.suskins.pubgolf.models.PubGolfFailure
import uk.co.suskins.pubgolf.service.GameRepository

class GameRepositoryFake : GameRepository {
    private val store = mutableMapOf<String, Game>()

    override fun save(game: Game): Result<Game, PubGolfFailure> {
        store[game.code] = game
        return Success(game)
    }

    override fun find(code: String): Result<Game, PubGolfFailure> {
        return store[code]?.let { Success(it) } ?: Failure(GameNotFoundFailure("Game $code not found"))
    }
}