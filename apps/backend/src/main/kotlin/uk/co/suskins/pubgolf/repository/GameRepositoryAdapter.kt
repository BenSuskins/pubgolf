package uk.co.suskins.pubgolf.repository

import dev.forkhandles.result4k.*
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Repository
import uk.co.suskins.pubgolf.models.*

@Repository
class GameRepositoryAdapter(private val store: GameJpaRepository) : GameRepository {
    private val logger = LoggerFactory.getLogger(GameRepositoryAdapter::class.java)
    override fun save(game: Game): Result<Game, PubGolfFailure> {
        return resultFrom {
            val entity = game.toJpa()
            val saved = store.save(entity)
            saved.toDomain()
        }.peekFailure {
            logger.error("Error saving game `${game.code.value}.", it)
        }.mapFailure {
            PersistenceFailure(it.message ?: "Save failed")
        }
    }

    override fun findByCodeIgnoreCase(code: GameCode): Result<Game, PubGolfFailure> {
        return store.findByCodeIgnoreCase(code.value)?.toDomain()?.let { Success(it) }
            ?: Failure(GameNotFoundFailure("Game `${code.value}` not found."))
    }
}