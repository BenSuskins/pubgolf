package uk.co.suskins.pubgolf.controller

import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RestController

@RestController
class GameController {

    @PostMapping("/api/v1/games")
    fun createGame() {
        return
    }
}