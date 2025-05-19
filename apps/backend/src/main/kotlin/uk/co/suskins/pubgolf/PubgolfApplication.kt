package uk.co.suskins.pubgolf

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication

@SpringBootApplication
class PubgolfApplication

fun main(args: Array<String>) {
	runApplication<PubgolfApplication>(*args)
}
