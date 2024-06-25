package uk.co.suskins.pubgolf.model

import jakarta.persistence.CascadeType
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.OneToMany
import jakarta.persistence.Table
import kotlin.random.Random

@Entity
@Table(name = "game")
data class Game(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    val id: Long = 0,

    @Column(name = "identifier", unique = true, nullable = false)
    val identifier: String = generateRandomPhrase(),

    @OneToMany(mappedBy = "game", cascade = [CascadeType.ALL], fetch = FetchType.LAZY)
    val players: List<Player> = emptyList()
) {
    companion object {
        fun generateRandomPhrase(): String {
            val words = listOf("Eagle", "Birdie", "Par", "Bogey", "Ace")
            return words[Random.nextInt(words.size)] + Random.nextInt(10, 99)
        }
    }
}
