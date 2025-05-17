package uk.co.suskins.pubgolf

import dev.forkhandles.result4k.Failure
import dev.forkhandles.result4k.Result
import dev.forkhandles.result4k.Success
import uk.co.suskins.pubgolf.service.GameEntity
import uk.co.suskins.pubgolf.service.GameRepository
import uk.co.suskins.pubgolf.service.NotFoundFailure
import uk.co.suskins.pubgolf.service.PubGolfFailure

class GameRepositoryFake : GameRepository {
    private val store = mutableMapOf<String, GameEntity>()

    override fun save(gameEntity: GameEntity): Result<GameEntity, PubGolfFailure> {
        store[gameEntity.code] = gameEntity
        return Success(gameEntity)
    }

    override fun findByCode(code: String): Result<GameEntity, PubGolfFailure> {
        return store[code]?.let { Success(it) } ?: Failure(NotFoundFailure("Game $code not found"))
    }
}