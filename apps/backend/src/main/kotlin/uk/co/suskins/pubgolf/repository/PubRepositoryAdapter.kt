package uk.co.suskins.pubgolf.repository

import dev.forkhandles.result4k.Failure
import dev.forkhandles.result4k.Result
import dev.forkhandles.result4k.mapFailure
import dev.forkhandles.result4k.peekFailure
import dev.forkhandles.result4k.resultFrom
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Repository
import uk.co.suskins.pubgolf.models.GameId
import uk.co.suskins.pubgolf.models.GameNotFoundFailure
import uk.co.suskins.pubgolf.models.PersistenceFailure
import uk.co.suskins.pubgolf.models.Pub
import uk.co.suskins.pubgolf.models.PubGolfFailure
import uk.co.suskins.pubgolf.models.toDomain
import uk.co.suskins.pubgolf.models.toJpa

@Repository
class PubRepositoryAdapter(
    private val store: PubJpaRepository,
    private val gameStore: GameJpaRepository,
) : PubRepository {
    private val logger = LoggerFactory.getLogger(PubRepositoryAdapter::class.java)

    override fun saveAll(pubs: List<Pub>): Result<List<Pub>, PubGolfFailure> =
        resultFrom {
            if (pubs.isEmpty()) {
                return@resultFrom emptyList()
            }

            val gameId = pubs.first().gameId
            val gameEntity =
                gameStore.findById(gameId.value).orElse(null)
                    ?: return Failure(GameNotFoundFailure("Game `${gameId.value}` not found during pub save"))

            val entities = pubs.map { it.toJpa(gameEntity) }
            val saved = store.saveAll(entities)
            saved.map { it.toDomain() }
        }.peekFailure {
            logger.error("Error saving pubs", it)
        }.mapFailure {
            PersistenceFailure(it.message ?: "Save pubs failed")
        }

    override fun findByGameId(gameId: GameId): Result<List<Pub>, PubGolfFailure> =
        resultFrom {
            val entities = store.findByGame_IdOrderByIdHoleAsc(gameId.value)
            entities.map { it.toDomain() }
        }.peekFailure {
            logger.error("Error finding pubs for game ${gameId.value}", it)
        }.mapFailure {
            PersistenceFailure(it.message ?: "Find pubs failed")
        }
}
