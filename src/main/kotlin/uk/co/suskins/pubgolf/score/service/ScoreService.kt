package uk.co.suskins.pubgolf.score.service

import org.springframework.stereotype.Service
import uk.co.suskins.pubgolf.score.repository.ScoreRepository

@Service
class ScoreService(val scoreRepository: ScoreRepository) {

    fun getAll() = scoreRepository.findAll()
}

