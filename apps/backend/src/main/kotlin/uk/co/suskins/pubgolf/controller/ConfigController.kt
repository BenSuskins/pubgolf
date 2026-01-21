package uk.co.suskins.pubgolf.controller

import io.swagger.v3.oas.annotations.media.Content
import io.swagger.v3.oas.annotations.media.Schema
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import org.springframework.http.HttpStatus.OK
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import uk.co.suskins.pubgolf.models.HoleResponse
import uk.co.suskins.pubgolf.models.OutcomeResponse
import uk.co.suskins.pubgolf.models.Outcomes
import uk.co.suskins.pubgolf.models.OutcomesResponse
import uk.co.suskins.pubgolf.models.PenaltyOptionResponse
import uk.co.suskins.pubgolf.models.PenaltyOptionsResponse
import uk.co.suskins.pubgolf.models.PenaltyType
import uk.co.suskins.pubgolf.models.Routes
import uk.co.suskins.pubgolf.models.RoutesResponse

@RestController
@RequestMapping("/api/v1/config")
class ConfigController {
    @GetMapping("/randomise-options")
    @ApiResponses(
        value = [
            ApiResponse(
                responseCode = "200",
                description = "Wheel options",
                content = [
                    Content(
                        mediaType = "application/json",
                        schema = Schema(implementation = OutcomesResponse::class),
                    ),
                ],
            ),
        ],
    )
    fun randomiseOptions(): ResponseEntity<*> =
        ResponseEntity
            .status(OK)
            .body(OutcomesResponse(Outcomes.entries.map { OutcomeResponse(it.label, it.weight) }))

    @GetMapping("/penalty-options")
    @ApiResponses(
        value = [
            ApiResponse(
                responseCode = "200",
                description = "Penalty options",
                content = [
                    Content(
                        mediaType = "application/json",
                        schema = Schema(implementation = PenaltyOptionsResponse::class),
                    ),
                ],
            ),
        ],
    )
    fun penaltyOptions(): ResponseEntity<*> =
        ResponseEntity
            .status(OK)
            .body(
                PenaltyOptionsResponse(
                    PenaltyType.entries.map {
                        PenaltyOptionResponse(it.name, it.label, it.points)
                    },
                ),
            )

    @GetMapping("/routes")
    @ApiResponses(
        value = [
            ApiResponse(
                responseCode = "200",
                description = "Drink routes for each hole",
                content = [
                    Content(
                        mediaType = "application/json",
                        schema = Schema(implementation = RoutesResponse::class),
                    ),
                ],
            ),
        ],
    )
    fun routes(): ResponseEntity<*> =
        ResponseEntity
            .status(OK)
            .body(
                RoutesResponse(
                    Routes.holes.map {
                        HoleResponse(it.hole, it.par, it.drinks)
                    },
                ),
            )
}
