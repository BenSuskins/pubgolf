package uk.co.suskins.pubgolf.controller

import io.swagger.v3.oas.annotations.media.Content
import io.swagger.v3.oas.annotations.media.Schema
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import uk.co.suskins.pubgolf.models.ErrorResponse

/**
 * The standard error contract shared by every game endpoint. Applied as a
 * composed annotation so each endpoint only declares its success response.
 */
@Target(AnnotationTarget.FUNCTION)
@Retention(AnnotationRetention.RUNTIME)
@ApiResponses(
    value = [
        ApiResponse(
            responseCode = "400",
            description = "Invalid argument",
            content = [Content(mediaType = "application/json", schema = Schema(implementation = ErrorResponse::class))],
        ),
        ApiResponse(
            responseCode = "401",
            description = "Unauthorized - Missing or invalid player ID header",
            content = [Content(mediaType = "application/json", schema = Schema(implementation = ErrorResponse::class))],
        ),
        ApiResponse(
            responseCode = "403",
            description = "Forbidden - Not the host or not in this game",
            content = [Content(mediaType = "application/json", schema = Schema(implementation = ErrorResponse::class))],
        ),
        ApiResponse(
            responseCode = "404",
            description = "Game, player or event not found",
            content = [Content(mediaType = "application/json", schema = Schema(implementation = ErrorResponse::class))],
        ),
        ApiResponse(
            responseCode = "409",
            description = "Conflict with the game's current state",
            content = [Content(mediaType = "application/json", schema = Schema(implementation = ErrorResponse::class))],
        ),
        ApiResponse(
            responseCode = "500",
            description = "Unexpected error",
            content = [Content(mediaType = "application/json", schema = Schema(implementation = ErrorResponse::class))],
        ),
    ],
)
annotation class StandardErrorResponses
