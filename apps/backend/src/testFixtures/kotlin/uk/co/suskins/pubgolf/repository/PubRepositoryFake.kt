package uk.co.suskins.pubgolf.repository

import dev.forkhandles.result4k.Result
import dev.forkhandles.result4k.Success
import uk.co.suskins.pubgolf.models.GameId
import uk.co.suskins.pubgolf.models.Pub
import uk.co.suskins.pubgolf.models.PubGolfFailure

class PubRepositoryFake : PubRepository {
    private val store = mutableMapOf<GameId, MutableList<Pub>>()

    override fun saveAll(pubs: List<Pub>): Result<List<Pub>, PubGolfFailure> {
        if (pubs.isEmpty()) {
            return Success(emptyList())
        }

        val gameId = pubs.first().gameId
        store[gameId] = pubs.sortedBy { it.hole.value }.toMutableList()
        return Success(pubs)
    }

    override fun findByGameId(gameId: GameId): Result<List<Pub>, PubGolfFailure> {
        val pubs = store[gameId] ?: emptyList()
        return Success(pubs.sortedBy { it.hole.value })
    }
}
