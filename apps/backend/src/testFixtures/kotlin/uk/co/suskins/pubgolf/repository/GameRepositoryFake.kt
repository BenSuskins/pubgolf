package uk.co.suskins.pubgolf.repository

import dev.forkhandles.result4k.Failure
import dev.forkhandles.result4k.Result
import dev.forkhandles.result4k.Success
import uk.co.suskins.pubgolf.models.ConcurrentModificationFailure
import uk.co.suskins.pubgolf.models.DuplicateGameCodeFailure
import uk.co.suskins.pubgolf.models.Game
import uk.co.suskins.pubgolf.models.GameCode
import uk.co.suskins.pubgolf.models.GameNotFoundFailure
import uk.co.suskins.pubgolf.models.PubGolfFailure

class GameRepositoryFake : GameRepository {
    private val store = mutableMapOf<GameCode, Game>()

    override fun save(game: Game): Result<Game, PubGolfFailure> {
        val existing = store.values.find { it.id == game.id }
        if (existing == null) {
            if (store.keys.any { it.value.equals(game.code.value, ignoreCase = true) }) {
                return Failure(DuplicateGameCodeFailure("Game code `${game.code.value}` already exists."))
            }
            store[game.code] = game
            return Success(game)
        }
        if ((existing.version ?: 0) != (game.version ?: 0)) {
            return Failure(ConcurrentModificationFailure("Game `${game.code.value}` was modified concurrently."))
        }
        val saved = game.copy(version = (game.version ?: 0) + 1)
        store[game.code] = saved
        return Success(saved)
    }

    override fun findByCodeIgnoreCase(code: GameCode): Result<Game, PubGolfFailure> {
        val game =
            store.entries
                .find { entry ->
                    entry.key.value.equals(code.value, ignoreCase = true)
                }?.value

        return game?.let { Success(it) }
            ?: Failure(GameNotFoundFailure("Game `${code.value}` not found."))
    }
}
