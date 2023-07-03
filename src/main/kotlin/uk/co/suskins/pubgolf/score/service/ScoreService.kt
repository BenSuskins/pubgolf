package uk.co.suskins.pubgolf.score.service

import org.springframework.stereotype.Service
import uk.co.suskins.pubgolf.common.models.exception.PubGolfException
import uk.co.suskins.pubgolf.score.models.entity.Score
import uk.co.suskins.pubgolf.score.models.enums.Hole
import uk.co.suskins.pubgolf.score.repository.ScoreRepository
import java.util.*

@Service
class ScoreService(val scoreRepository: ScoreRepository) {

    fun getAll() = scoreRepository.findAll()

    fun updateScore(id: UUID, hole: Hole, score: Int) {
        val scoreEntity = scoreRepository.findById(id)
            .orElseThrow { PubGolfException("Resource Not Found") }

        when (hole) {
            Hole.ONE -> scoreEntity.holeOne = score
            Hole.TWO -> scoreEntity.holeTwo = score
            Hole.THREE -> scoreEntity.holeThree = score
            Hole.FOUR -> scoreEntity.holeFour = score
            Hole.FIVE -> scoreEntity.holeFive = score
            Hole.SIX -> scoreEntity.holeSix = score
            Hole.SEVEN -> scoreEntity.holeSeven = score
            Hole.EIGHT -> scoreEntity.holeEight = score
            Hole.NINE -> scoreEntity.holeNine = score
        }

        scoreRepository.save(scoreEntity)
    }

    fun reset() = scoreRepository.deleteAll()

    fun join(score: Score): UUID {
        return if (!scoreRepository.existsByName(score.name)) {
            scoreRepository.save(score).id
        } else {
            throw PubGolfException("Name already exists")
        }
    }
}

