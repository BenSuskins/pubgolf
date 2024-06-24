package uk.co.suskins.pubgolf.controller

import org.springframework.http.HttpStatus
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController
import uk.co.suskins.pubgolf.api.GameDto
import uk.co.suskins.pubgolf.api.PlayerDto
import uk.co.suskins.pubgolf.api.ScoreSubmissionDto
import uk.co.suskins.pubgolf.service.GameService

@Validated
@RestController
@RequestMapping("/api/games")
class GameController(private val gameService: GameService) {

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun createGame(): GameDto {
        return gameService.createGame()
    }

    @PostMapping("/{identifier}/join")
    @ResponseStatus(HttpStatus.CREATED)
    fun joinGame(
        @PathVariable identifier: String,
        @RequestParam name: String
    ): PlayerDto {
        return gameService.joinGame(identifier, name)
    }

    @GetMapping("/{identifier}/players")
    fun getScores(@PathVariable identifier: String): List<PlayerDto> {
        return gameService.getAllPlayers(identifier)
    }

    @PostMapping("/{identifier}/players/{playerName}/score")
    @ResponseStatus(HttpStatus.ACCEPTED)
    fun submitScore(
        @PathVariable identifier: String,
        @PathVariable playerName: String,
        @RequestBody scoreSubmission: ScoreSubmissionDto
    ) {
        gameService.updateScore(identifier, playerName, scoreSubmission)
    }

    // ADMIN Functions
    @DeleteMapping("/{identifier}/players/{playerName}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun deletePlayer(
        @PathVariable identifier: String,
        @PathVariable playerName: String
    ) {
        gameService.deletePlayer(identifier, playerName)
    }

    @DeleteMapping("/{identifier}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun deleteGame(@PathVariable identifier: String) {
        gameService.deleteGame(identifier)
    }
}
