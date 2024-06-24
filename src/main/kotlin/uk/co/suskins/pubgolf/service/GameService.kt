package uk.co.suskins.pubgolf.service

import uk.co.suskins.pubgolf.model.Game
import org.springframework.stereotype.Service
import uk.co.suskins.pubgolf.api.GameDto
import uk.co.suskins.pubgolf.api.PlayerDto
import uk.co.suskins.pubgolf.api.ScoreSubmissionDto
import uk.co.suskins.pubgolf.model.Player
import uk.co.suskins.pubgolf.repository.GameRepository
import uk.co.suskins.pubgolf.repository.PlayerRepository
import uk.co.suskins.pubgolf.util.toDto

@Service
class GameService(
    private val gameRepository: GameRepository,
    private val playerRepository: PlayerRepository
) {

    fun createGame(): GameDto {
        val game = Game()
        return gameRepository.save(game).toDto()
    }

    fun joinGame(identifier: String, name: String): PlayerDto {
        val game = findGame(identifier)
        validatePlayerInGame(game, name)
        val player = Player(name = name, game = game)
        return playerRepository.save(player).toDto()
    }


    fun getAllPlayers(identifier: String): List<PlayerDto> {
        val game = findGame(identifier)
        return playerRepository.findByGame(game).map { it.toDto() }.sortedBy { it.totalScore }
    }

    fun updateScore(identifier: String, playerName: String, scoreSubmission: ScoreSubmissionDto) {
        val player = findPlayer(identifier, playerName)
        val scores = player.getScoresList()
        scores[scoreSubmission.hole - 1] = scoreSubmission.score
        player.setScoresList(scores)
        playerRepository.save(player)
    }

    fun deletePlayer(
        identifier: String,
        playerName: String
    ) {
        val player = findPlayer(identifier, playerName)
        playerRepository.delete(player)
    }

    fun deleteGame(identifier: String) {
        val game = findGame(identifier)
        gameRepository.delete(game)
    }

    private fun findPlayer(identifier: String, playerName: String): Player {
        val game = findGame(identifier)
        val player = playerRepository.findByGameAndName(game, playerName)
            ?: throw IllegalArgumentException("Player not found in the specified game")
        return player
    }

    private fun validatePlayerInGame(game: Game, name: String) {
        playerRepository.findByGameAndName(game, name)?.let {
            throw IllegalStateException("Player with name $name already exists in this game")
        }
    }

    private fun findGame(identifier: String) =
        gameRepository.findByIdentifier(identifier) ?: throw IllegalArgumentException("Game not found")
}
