package uk.co.suskins.pubgolf.repository

import dev.forkhandles.result4k.Result
import uk.co.suskins.pubgolf.models.Game
import uk.co.suskins.pubgolf.models.GameCode
import uk.co.suskins.pubgolf.models.PubGolfFailure

interface GameRepository {
    fun save(game: Game): Result<Game, PubGolfFailure>

    fun findByCodeIgnoreCase(code: GameCode): Result<Game, PubGolfFailure>
}
