package uk.co.suskins.pubgolf.score.controller

import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Min
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.*
import uk.co.suskins.pubgolf.score.models.enums.Hole
import uk.co.suskins.pubgolf.score.models.mapper.ScoreMapper
import uk.co.suskins.pubgolf.score.service.ScoreService
import java.util.*

@Validated
@RestController
@RequestMapping("/api/v1/scores")
class ScoreController(val scoreService: ScoreService, val scoreMapper: ScoreMapper) {

    @GetMapping
    fun getAll() = scoreMapper.toDtos(scoreService.getAll())

    @PostMapping("/join/{name}")
    fun join(@PathVariable name: String) = scoreService.join(scoreMapper.toEntity(name))


    @PutMapping("/{id}/{hole}/{score}")
    fun putScore(@PathVariable id: UUID, @PathVariable hole: Hole, @PathVariable @Min(-10) @Max(10) score: Int) =
        scoreService.updateScore(id, hole, score);


    @GetMapping("/reset")
    fun reset() = scoreService.reset()
}
