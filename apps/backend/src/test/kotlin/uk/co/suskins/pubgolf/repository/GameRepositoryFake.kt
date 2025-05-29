package uk.co.suskins.pubgolf.repository

import dev.forkhandles.result4k.Failure
import dev.forkhandles.result4k.Result
import dev.forkhandles.result4k.Success
import uk.co.suskins.pubgolf.models.Game
import uk.co.suskins.pubgolf.models.GameCode
import uk.co.suskins.pubgolf.models.GameNotFoundFailure
import uk.co.suskins.pubgolf.models.PubGolfFailure

class GameRepositoryFake : GameRepository {
    private val store = mutableMapOf<GameCode, Game>()

    override fun save(game: Game): Result<Game, PubGolfFailure> {
        store[game.code] = game
        return Success(game)
    }

    override fun findByCodeIgnoreCase(code: GameCode): Result<Game, PubGolfFailure> {
        return store[code]?.let { Success(it) } ?: Failure(GameNotFoundFailure("Game `${code.value}` not found."))
    }
}