package uk.co.suskins.pubgolf.score.controller

import jakarta.validation.Valid
import org.springframework.web.bind.annotation.*
import uk.co.suskins.pubgolf.score.models.api.ScoreDto
import uk.co.suskins.pubgolf.score.models.mapper.ScoreMapper
import uk.co.suskins.pubgolf.score.service.ScoreService
import java.util.*

@RestController
@RequestMapping("/api/v1/scores")
class ScoreController(val scoreService: ScoreService, val scoreMapper: ScoreMapper) {

    @GetMapping
    fun getAll() = scoreMapper.toDtos(scoreService.getAll())

    @PostMapping("/join/{name}")
    fun join(@PathVariable name: String) = scoreService.join(scoreMapper.toEntity(name))


    @PutMapping("/{id}")
    fun postScore(@PathVariable id: UUID, @RequestBody @Valid scoreDto: ScoreDto) {
        val entity = scoreMapper.toEntity(scoreDto);
        scoreService.update(id, entity);
    }

    @GetMapping("/reset")
    fun reset() {
        scoreService.reset()
    }
}
