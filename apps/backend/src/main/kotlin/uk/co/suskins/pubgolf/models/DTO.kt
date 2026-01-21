package uk.co.suskins.pubgolf.models

import jakarta.validation.Valid
import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Min
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size

data class GameRequest(
    @field:NotBlank(message = "Host name must not be blank")
    val host: PlayerName,
)

data class GameJoinRequest(
    @field:NotBlank(message = "Name must not be blank")
    val name: PlayerName,
)

data class ScoreRequest(
    @field:Max(value = 9)
    @field:Min(value = 1)
    val hole: Hole,
    @field:Max(value = 10)
    @field:Min(value = -10)
    val score: Score,
    val penaltyType: PenaltyType? = null,
)

data class CreateGameResponse(
    val gameId: GameId,
    val gameCode: GameCode,
    val playerId: PlayerId,
    val playerName: PlayerName,
)

data class JoinGameResponse(
    val gameId: GameId,
    val gameCode: GameCode,
    val playerId: PlayerId,
    val playerName: PlayerName,
)

data class GameStateResponse(
    val gameId: GameId,
    val gameCode: GameCode,
    val status: GameStatus,
    val hostPlayerId: PlayerId?,
    val players: List<PlayerResponse>,
    val activeEvent: ActiveEventResponse?,
)

data class RandomiseResponse(
    val result: String,
    val hole: Hole,
)

data class OutcomesResponse(
    val options: List<OutcomeResponse>,
)

data class OutcomeResponse(
    val option: String,
    val optionSize: Int,
)

data class PenaltyOptionsResponse(
    val penalties: List<PenaltyOptionResponse>,
)

data class PenaltyOptionResponse(
    val type: String,
    val name: String,
    val points: Int,
)

data class RoutesResponse(
    val holes: List<HoleResponse>,
)

data class HoleResponse(
    val hole: Int,
    val par: Int,
    val drinks: Map<String, String>,
)

data class PlayerResponse(
    val id: PlayerId,
    val name: PlayerName,
    val scores: List<Score>,
    val totalScore: Int,
    val randomise: RandomiseOutcomeResponse?,
    val penalties: List<PenaltyResponse>,
)

data class PenaltyResponse(
    val hole: Hole,
    val type: String,
    val points: Int,
)

data class RandomiseOutcomeResponse(
    val hole: Hole,
    val result: String,
)

data class ErrorResponse(
    val message: String,
)

data class EventResponse(
    val id: String,
    val title: String,
    val description: String,
)

data class EventsResponse(
    val events: List<EventResponse>,
)

data class ActiveEventResponse(
    val id: String,
    val title: String,
    val description: String,
    val activatedAt: java.time.Instant,
)

data class ActiveEventStateResponse(
    val activeEvent: ActiveEventResponse?,
)

data class PlaceSearchResult(
    val name: String,
    val latitude: Double,
    val longitude: Double,
)

data class PubDto(
    @field:NotBlank(message = "Pub name must not be blank")
    val name: String,
    @field:Min(value = -90, message = "Latitude must be between -90 and 90")
    @field:Max(value = 90, message = "Latitude must be between -90 and 90")
    val latitude: Double,
    @field:Min(value = -180, message = "Longitude must be between -180 and 180")
    @field:Max(value = 180, message = "Longitude must be between -180 and 180")
    val longitude: Double,
)

data class SetPubsRequest(
    @field:Size(min = 9, max = 9, message = "Exactly 9 pubs are required")
    @field:Valid
    val pubs: List<PubDto>,
)

data class PubLocationResponse(
    val hole: Int,
    val name: String,
    val latitude: Double,
    val longitude: Double,
)

data class RouteGeometryResponse(
    val type: String,
    val coordinates: List<List<Double>>,
)

data class RouteResponse(
    val pubs: List<PubLocationResponse>,
    val route: RouteGeometryResponse?,
)

data class UpdateGameStatusRequest(
    val status: GameStatus,
)

data class SetActiveEventRequest(
    @field:NotBlank(message = "Event ID must not be blank")
    val eventId: String,
)
