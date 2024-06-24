package uk.co.suskins.pubgolf.service

import uk.co.suskins.pubgolf.model.Game
import org.springframework.stereotype.Service
import uk.co.suskins.pubgolf.api.GameDto
import uk.co.suskins.pubgolf.api.PlayerDto
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
        val game = gameRepository.findByIdentifier(identifier) ?: throw IllegalArgumentException("Game not found")
        val player = Player(name = name, game = game)
        return playerRepository.save(player).toDto()
    }

    fun getAllPlayers(identifier: String): List<PlayerDto> {
        val game = gameRepository.findByIdentifier(identifier) ?: throw IllegalArgumentException("Game not found")
        return playerRepository.findByGame(game).map { it.toDto() }.sortedBy { it.totalScore }
    }

    fun updateScore(identifier: String, playerName: String, hole: Int, score: Int) {
        val game = gameRepository.findByIdentifier(identifier) ?: throw IllegalArgumentException("Game not found")
        val player = playerRepository.findByGameAndName(game, playerName)
            ?: throw IllegalArgumentException("Player not found in the specified game")

        val scores = player.getScoresList()
        scores[hole - 1] = score
        player.setScoresList(scores)
        playerRepository.save(player)
    }

    fun deletePlayer(playerId: Long) {
        playerRepository.deleteById(playerId)
    }

    fun deleteAllPlayers(gameId: Long) {
        val game = gameRepository.findById(gameId).orElseThrow { IllegalArgumentException("Game not found") }
        playerRepository.findByGame(game).forEach { playerRepository.delete(it) }
    }
}
