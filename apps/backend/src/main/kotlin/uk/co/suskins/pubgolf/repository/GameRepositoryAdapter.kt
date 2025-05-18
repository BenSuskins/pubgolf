package uk.co.suskins.pubgolf.repository

import dev.forkhandles.result4k.*
import org.springframework.stereotype.Repository
import uk.co.suskins.pubgolf.models.*

@Repository
class GameRepositoryAdapter(private val store: GameJpaRepository) : GameRepository {
    override fun save(game: Game): Result<Game, PubGolfFailure> {
        return resultFrom {
            val entity = game.toJpa()
            val saved = store.save(entity)
            saved.toDomain()
        }.mapFailure {
            PersistenceFailure(it.message ?: "Save failed")
        }
    }

    override fun find(code: String): Result<Game, PubGolfFailure> {
        return store.findByCode(code)?.toDomain()?.let { Success(it) }
            ?: Failure(GameNotFoundFailure("Game `$code` not found."))
    }
}