package uk.co.suskins.pubgolf.score.models.mapper

import org.springframework.stereotype.Component
import uk.co.suskins.pubgolf.score.models.api.ScoreDto
import uk.co.suskins.pubgolf.score.models.entity.Score

@Component
class ScoreMapper {

    fun toDtos(entities: MutableIterable<Score>): List<ScoreDto> {
        return entities.map { entity -> toDto(entity) }
    }

    fun toDto(entity: Score): ScoreDto {
        return ScoreDto(
            entity.id, entity.name, entity.holeOne, entity.holeTwo, entity.holeThree, entity.holeFour,
            entity.holeFive, entity.holeSix, entity.holeSeven, entity.holeEight, entity.holeNine, getTotal(entity)
        )
    }

    private fun getTotal(entity: Score): Int {
        return entity.holeOne + entity.holeTwo + entity.holeThree + entity.holeFour +
                entity.holeFive + entity.holeSix + entity.holeSeven + entity.holeEight + entity.holeNine
    }

    fun toEntity(dto: ScoreDto): Score {
        return Score(
            dto.id, dto.name, dto.holeOne, dto.holeTwo, dto.holeThree, dto.holeFour,
            dto.holeFive, dto.holeSix, dto.holeSeven, dto.holeEight, dto.holeNine
        )
    }

    fun toEntity(name: String): Score {
        val score = Score()
        score.name = name
        return score
    }
}
