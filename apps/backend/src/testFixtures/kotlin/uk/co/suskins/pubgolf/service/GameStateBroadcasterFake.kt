package uk.co.suskins.pubgolf.service

import uk.co.suskins.pubgolf.models.Game

class GameStateBroadcasterFake : GameStateBroadcaster {
    val broadcastedGames = mutableListOf<Game>()

    override fun broadcast(game: Game) {
        broadcastedGames.add(game)
    }

    fun clear() {
        broadcastedGames.clear()
    }
}
