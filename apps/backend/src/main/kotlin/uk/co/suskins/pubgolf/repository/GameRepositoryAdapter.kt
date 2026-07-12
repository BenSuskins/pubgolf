package uk.co.suskins.pubgolf.repository

import dev.forkhandles.result4k.Failure
import dev.forkhandles.result4k.Result
import dev.forkhandles.result4k.Success
import dev.forkhandles.result4k.flatMap
import dev.forkhandles.result4k.mapFailure
import dev.forkhandles.result4k.peekFailure
import dev.forkhandles.result4k.resultFrom
import org.slf4j.LoggerFactory
import org.springframework.dao.OptimisticLockingFailureException
import org.springframework.stereotype.Repository
import uk.co.suskins.pubgolf.models.ConcurrentModificationFailure
import uk.co.suskins.pubgolf.models.DuplicateGameCodeFailure
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
            val saved = store.saveAndFlush(entity)
            saved.toDomain()
        }.peekFailure {
            logger.error("Error saving game `${game.code.value}`.", it)
        }.mapFailure { error ->
            when {
                error is OptimisticLockingFailureException ->
                    ConcurrentModificationFailure("Game `${game.code.value}` was modified concurrently.")
                error.mentionsGameCodeConstraint() ->
                    DuplicateGameCodeFailure("Game code `${game.code.value}` already exists.")
                // Deliberately generic: raw persistence messages leak schema/SQL details to clients.
                else -> PersistenceFailure("Failed to save game")
            }
        }

    // The SQLite dialect does not reliably translate unique violations to
    // DataIntegrityViolationException, so match on the constraint name instead.
    private fun Throwable.mentionsGameCodeConstraint(): Boolean =
        generateSequence(this) { it.cause }.any { (it.message ?: "").contains("games.code") }

    override fun findByCodeIgnoreCase(code: GameCode): Result<Game, PubGolfFailure> =
        resultFrom {
            store.findByCodeIgnoreCase(code.value)
        }.peekFailure {
            logger.error("Error finding game by code `${code.value}`.", it)
        }.mapFailure {
            PersistenceFailure("Failed to load game")
        }.flatMap { entity ->
            entity?.toDomain()?.let { Success(it) }
                ?: Failure(GameNotFoundFailure("Game `${code.value}` not found."))
        }
}
