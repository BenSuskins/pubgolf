package uk.co.suskins.pubgolf.score.repository

import org.springframework.data.repository.CrudRepository
import uk.co.suskins.pubgolf.score.models.entity.Score
import java.util.*

interface ScoreRepository : CrudRepository<Score, UUID>
