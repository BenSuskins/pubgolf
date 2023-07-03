package uk.co.suskins.pubgolf.score.service

import org.springframework.stereotype.Service
import uk.co.suskins.pubgolf.common.models.exception.PubGolfException
import uk.co.suskins.pubgolf.score.models.entity.Score
import uk.co.suskins.pubgolf.score.repository.ScoreRepository
import java.util.*

@Service
class ScoreService(val scoreRepository: ScoreRepository) {

    fun getAll() = scoreRepository.findAll()

    fun save(id: UUID, score: Score) {
        if (scoreRepository.existsById(id)) {
            scoreRepository.save(score)
        } else {
            throw PubGolfException("Resource not found")

        }
    }

    fun reset() = scoreRepository.deleteAll()

    fun join(score: Score): UUID {
        if (!scoreRepository.existsByName(score.name)) {
            return scoreRepository.save(score).id
        }else{
            throw PubGolfException("Name already exists")
        }
    }

}

