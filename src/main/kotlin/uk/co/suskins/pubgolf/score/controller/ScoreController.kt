package uk.co.suskins.pubgolf.score.controller

import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RestController
import uk.co.suskins.pubgolf.score.models.api.ScoreDto
import uk.co.suskins.pubgolf.score.models.mapper.ScoreMapper
import uk.co.suskins.pubgolf.score.service.ScoreService

@RestController("/api/v1/scores")
class ScoreController(val scoreService: ScoreService, val scoreMapper: ScoreMapper) {

    @GetMapping
    fun getAll(): List<ScoreDto> {
        return scoreMapper.toDtos(scoreService.getAll())
    }

}
