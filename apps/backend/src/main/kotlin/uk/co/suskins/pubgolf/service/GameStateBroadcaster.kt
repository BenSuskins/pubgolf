package uk.co.suskins.pubgolf.service

import uk.co.suskins.pubgolf.models.Game

interface GameStateBroadcaster {
    fun broadcast(game: Game)
}
