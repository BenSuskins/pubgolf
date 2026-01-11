package uk.co.suskins.pubgolf.controller

import dev.forkhandles.result4k.get
import dev.forkhandles.result4k.map
import dev.forkhandles.result4k.mapFailure
import io.swagger.v3.oas.annotations.media.Content
import io.swagger.v3.oas.annotations.media.Schema
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import jakarta.validation.Valid
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus.BAD_REQUEST
import org.springframework.http.HttpStatus.CONFLICT
import org.springframework.http.HttpStatus.FORBIDDEN
import org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR
import org.springframework.http.HttpStatus.NOT_FOUND
import org.springframework.http.HttpStatus.OK
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import uk.co.suskins.pubgolf.models.ActiveEventResponse
import uk.co.suskins.pubgolf.models.EndEventRequest
import uk.co.suskins.pubgolf.models.ErrorResponse
import uk.co.suskins.pubgolf.models.EventAlreadyActiveFailure
import uk.co.suskins.pubgolf.models.EventId
import uk.co.suskins.pubgolf.models.EventNotFoundFailure
import uk.co.suskins.pubgolf.models.EventResponse
import uk.co.suskins.pubgolf.models.EventsResponse
import uk.co.suskins.pubgolf.models.GameAlreadyCompletedFailure
import uk.co.suskins.pubgolf.models.GameCode
import uk.co.suskins.pubgolf.models.GameNotFoundFailure
import uk.co.suskins.pubgolf.models.NoActiveEventFailure
import uk.co.suskins.pubgolf.models.NotHostPlayerFailure
import uk.co.suskins.pubgolf.models.PubGolfFailure
import uk.co.suskins.pubgolf.models.StartEventRequest
import uk.co.suskins.pubgolf.service.EventService

@RestController
@RequestMapping("/api/v1")
class EventController(
    private val eventService: EventService,
) {
    private val logger = LoggerFactory.getLogger(EventController::class.java)

    @GetMapping("/events")
    @ApiResponses(
        value = [
            ApiResponse(
                responseCode = "200",
                description = "List of available events",
                content = [
                    Content(
                        mediaType = "application/json",
                        schema = Schema(implementation = EventsResponse::class),
                    ),
                ],
            ),
        ],
    )
    fun getEvents(): ResponseEntity<EventsResponse> =
        ResponseEntity
            .status(OK)
            .body(
                EventsResponse(
                    events =
                        eventService.getAvailableEvents().map {
                            EventResponse(it.id.value, it.name, it.description)
                        },
                ),
            )

    @GetMapping("/games/{gameCode}/events/current")
    @ApiResponses(
        value = [
            ApiResponse(
                responseCode = "200",
                description = "Active event for the game",
                content = [
                    Content(
                        mediaType = "application/json",
                        schema = Schema(implementation = ActiveEventResponse::class),
                    ),
                ],
            ),
            ApiResponse(
                responseCode = "404",
                description = "No active event",
                content = [
                    Content(
                        mediaType = "application/json",
                        schema = Schema(implementation = ErrorResponse::class),
                    ),
                ],
            ),
        ],
    )
    fun getActiveEvent(
        @PathVariable("gameCode") gameCode: GameCode,
    ): ResponseEntity<*> {
        val event = eventService.getActiveEvent(gameCode)
        return if (event != null) {
            ResponseEntity
                .status(OK)
                .body(ActiveEventResponse(event.id.value, event.name, event.description))
        } else {
            ResponseEntity
                .status(NOT_FOUND)
                .body(ErrorResponse("No active event"))
        }
    }

    @PostMapping("/games/{gameCode}/events")
    @ApiResponses(
        value = [
            ApiResponse(
                responseCode = "200",
                description = "Event started",
                content = [
                    Content(
                        mediaType = "application/json",
                        schema = Schema(implementation = EventResponse::class),
                    ),
                ],
            ),
            ApiResponse(
                responseCode = "403",
                description = "Not the host",
                content = [
                    Content(
                        mediaType = "application/json",
                        schema = Schema(implementation = ErrorResponse::class),
                    ),
                ],
            ),
            ApiResponse(
                responseCode = "404",
                description = "Game or event not found",
                content = [
                    Content(
                        mediaType = "application/json",
                        schema = Schema(implementation = ErrorResponse::class),
                    ),
                ],
            ),
            ApiResponse(
                responseCode = "409",
                description = "Event already active",
                content = [
                    Content(
                        mediaType = "application/json",
                        schema = Schema(implementation = ErrorResponse::class),
                    ),
                ],
            ),
        ],
    )
    fun startEvent(
        @PathVariable("gameCode") gameCode: GameCode,
        @Valid @RequestBody request: StartEventRequest,
    ): ResponseEntity<*> =
        eventService
            .startEvent(gameCode, request.playerId, EventId(request.eventId))
            .map { event ->
                EventResponse(event.id.value, event.name, event.description)
            }.map {
                ResponseEntity.status(OK).body(it)
            }.mapFailure {
                resolveFailure(it)
            }.get()

    @DeleteMapping("/games/{gameCode}/events/current")
    @ApiResponses(
        value = [
            ApiResponse(
                responseCode = "200",
                description = "Event ended",
                content = [
                    Content(
                        mediaType = "application/json",
                        schema = Schema(implementation = EventResponse::class),
                    ),
                ],
            ),
            ApiResponse(
                responseCode = "403",
                description = "Not the host",
                content = [
                    Content(
                        mediaType = "application/json",
                        schema = Schema(implementation = ErrorResponse::class),
                    ),
                ],
            ),
            ApiResponse(
                responseCode = "404",
                description = "Game not found or no active event",
                content = [
                    Content(
                        mediaType = "application/json",
                        schema = Schema(implementation = ErrorResponse::class),
                    ),
                ],
            ),
        ],
    )
    fun endCurrentEvent(
        @PathVariable("gameCode") gameCode: GameCode,
        @Valid @RequestBody request: EndEventRequest,
    ): ResponseEntity<*> =
        eventService
            .endCurrentEvent(gameCode, request.playerId)
            .map { event ->
                EventResponse(event.id.value, event.name, event.description)
            }.map {
                ResponseEntity.status(OK).body(it)
            }.mapFailure {
                resolveFailure(it)
            }.get()

    private fun resolveFailure(failure: PubGolfFailure): ResponseEntity<ErrorResponse> {
        logger.error("Failure `${failure.message}` occurred.")
        return when (failure) {
            is GameNotFoundFailure -> ResponseEntity.status(NOT_FOUND).body(failure.asErrorResponse())
            is EventNotFoundFailure -> ResponseEntity.status(NOT_FOUND).body(failure.asErrorResponse())
            is NoActiveEventFailure -> ResponseEntity.status(NOT_FOUND).body(failure.asErrorResponse())
            is NotHostPlayerFailure -> ResponseEntity.status(FORBIDDEN).body(failure.asErrorResponse())
            is EventAlreadyActiveFailure -> ResponseEntity.status(CONFLICT).body(failure.asErrorResponse())
            is GameAlreadyCompletedFailure -> ResponseEntity.status(BAD_REQUEST).body(failure.asErrorResponse())
            else -> ResponseEntity.status(INTERNAL_SERVER_ERROR).body(failure.asErrorResponse())
        }
    }
}
