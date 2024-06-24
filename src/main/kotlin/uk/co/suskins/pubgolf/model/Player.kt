package uk.co.suskins.pubgolf.model

import jakarta.persistence.Column
import jakarta.persistence.ElementCollection
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table

@Entity
@Table(name = "player")
data class Player(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    val id: Long = 0,

    @Column(name = "name", nullable = false)
    val name: String,

    @Column(name = "scores", nullable = false)
    var scores: String = "0,0,0,0,0,0,0,0,0",

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "game_id")
    val game: Game
) {
    val totalScore: Int
        get() = scores.split(",").map { it.toInt() }.sum()

    fun getScoresList(): MutableList<Int> {
        return scores.split(",").map { it.toInt() }.toMutableList()
    }

    fun setScoresList(newScores: List<Int>) {
        scores = newScores.joinToString(",")
    }
}
