package uk.co.suskins.pubgolf

import dev.forkhandles.result4k.Failure
import dev.forkhandles.result4k.Result
import dev.forkhandles.result4k.Success
import uk.co.suskins.pubgolf.models.Game
import uk.co.suskins.pubgolf.service.GameRepository
import uk.co.suskins.pubgolf.service.NotFoundFailure
import uk.co.suskins.pubgolf.service.PubGolfFailure

class GameRepositoryFake : GameRepository {
    private val store = mutableMapOf<String, Game>()

    override fun save(game: Game): Result<Game, PubGolfFailure> {
        store[game.code] = game
        return Success(game)
    }

    override fun findByCode(code: String): Result<Game, PubGolfFailure> {
        return store[code]?.let { Success(it) } ?: Failure(NotFoundFailure("Game $code not found"))
    }
}