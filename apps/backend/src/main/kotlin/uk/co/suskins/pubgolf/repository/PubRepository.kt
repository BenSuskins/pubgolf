package uk.co.suskins.pubgolf.repository

import dev.forkhandles.result4k.Result
import uk.co.suskins.pubgolf.models.GameId
import uk.co.suskins.pubgolf.models.Pub
import uk.co.suskins.pubgolf.models.PubGolfFailure

interface PubRepository {
    fun saveAll(pubs: List<Pub>): Result<List<Pub>, PubGolfFailure>

    fun findByGameId(gameId: GameId): Result<List<Pub>, PubGolfFailure>
}
