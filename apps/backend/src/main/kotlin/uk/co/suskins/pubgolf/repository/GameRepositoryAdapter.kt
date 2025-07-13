package uk.co.suskins.pubgolf.repository

import dev.forkhandles.result4k.Failure
import dev.forkhandles.result4k.Result
import dev.forkhandles.result4k.Success
import dev.forkhandles.result4k.mapFailure
import dev.forkhandles.result4k.peekFailure
import dev.forkhandles.result4k.resultFrom
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Repository
import uk.co.suskins.pubgolf.models.Game
import uk.co.suskins.pubgolf.models.GameCode
import uk.co.suskins.pubgolf.models.GameNotFoundFailure
import uk.co.suskins.pubgolf.models.PersistenceFailure
import uk.co.suskins.pubgolf.models.PubGolfFailure
import uk.co.suskins.pubgolf.models.toDomain
import uk.co.suskins.pubgolf.models.toJpa

@Repository
class GameRepositoryAdapter(
    private val store: GameJpaRepository,
) : GameRepository {
    private val logger = LoggerFactory.getLogger(GameRepositoryAdapter::class.java)

    override fun save(game: Game): Result<Game, PubGolfFailure> =
        resultFrom {
            val entity = game.toJpa()
            val saved = store.save(entity)
            saved.toDomain()
        }.peekFailure {
            logger.error("Error saving game `${game.code.value}.", it)
        }.mapFailure {
            PersistenceFailure(it.message ?: "Save failed")
        }

    override fun findByCodeIgnoreCase(code: GameCode): Result<Game, PubGolfFailure> =
        store.findByCodeIgnoreCase(code.value)?.toDomain()?.let { Success(it) }
            ?: Failure(GameNotFoundFailure("Game `${code.value}` not found."))
}
