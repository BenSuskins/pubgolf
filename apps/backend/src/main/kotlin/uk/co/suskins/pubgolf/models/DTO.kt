package uk.co.suskins.pubgolf.models

data class GameRequest(val host: String)
data class GameJoinRequest(val name: String)
data class ScoreRequest(val hole: Int, val score: Int)

data class CreateGameResponse(val gameId: String, val gameCode: String, val playerId: String, val playerName: String)
data class GameStateResponse(val gameId: String, val gameCode: String, val playerResponses: List<PlayerResponse>)
data class PlayerResponse(val id: String, val name: String, val scores: List<Int>)
