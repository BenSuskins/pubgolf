package uk.co.suskins.pubgolf.score.service

import org.springframework.stereotype.Service
import uk.co.suskins.pubgolf.common.models.exception.PubGolfException
import uk.co.suskins.pubgolf.score.models.entity.Score
import uk.co.suskins.pubgolf.score.repository.ScoreRepository
import java.util.*

@Service
class ScoreService(val scoreRepository: ScoreRepository) {

    fun getAll() = scoreRepository.findAll()

    fun update(id: UUID, updatedScore: Score) {
        val score = scoreRepository.findById(id)
            .orElseThrow { PubGolfException("Resource Not Found") }

        score.holeOne = updatedScore.holeOne
        score.holeTwo = updatedScore.holeTwo
        score.holeThree = updatedScore.holeThree
        score.holeFour = updatedScore.holeFour
        score.holeFive = updatedScore.holeFive
        score.holeSix = updatedScore.holeSix
        score.holeSeven = updatedScore.holeSeven
        score.holeEight = updatedScore.holeEight
        score.holeNine = updatedScore.holeNine

        scoreRepository.save(score)
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

