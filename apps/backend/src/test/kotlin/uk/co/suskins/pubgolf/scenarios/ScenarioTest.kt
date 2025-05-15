package uk.co.suskins.pubgolf.scenarios

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.databind.SerializationFeature
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.http.ResponseEntity
import org.springframework.web.client.RestTemplate

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.DEFINED_PORT)
abstract class ScenarioTest {
    private val restTemplate = RestTemplate()

    fun createGame(): ResponseEntity<String> {
        return restTemplate.postForEntity("http://localhost:8080/api/v1/games", null, String::class.java)
    }
}

fun String?.asPrettyJson(): String {
    val mapper = ObjectMapper().enable(SerializationFeature.INDENT_OUTPUT)
    return mapper.writeValueAsString(mapper.readTree(this))
}