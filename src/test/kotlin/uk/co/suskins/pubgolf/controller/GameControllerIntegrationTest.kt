package uk.co.suskins.pubgolf.controller

import com.fasterxml.jackson.databind.ObjectMapper
import com.jayway.jsonpath.JsonPath
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import uk.co.suskins.pubgolf.api.ScoreSubmissionDto

@SpringBootTest
@AutoConfigureMockMvc
class GameControllerIntegrationTests {

    @Autowired
    private lateinit var jsonMapper: ObjectMapper

    @Autowired
    private lateinit var mockMvc: MockMvc

    val playerName = "Test Player"

    @Test
    fun `Create Game Test`() {
        mockMvc.perform(post("/api/games"))
            .andExpect(status().isCreated)
            .andExpect(jsonPath("$.identifier").exists())
    }

    @Test
    fun `Join Game Test`() {
        val identifier = createGameAndGetIdentifier()
        mockMvc.perform(post("/api/games/$identifier/join").param("name", playerName))
            .andExpect(status().isCreated)
            .andExpect(jsonPath("$.name").value(playerName))
    }

    @Test
    fun `Submit Score Test`() {
        val identifier = createGameAndGetIdentifier()
        joinGame(identifier, playerName)
        mockMvc.perform(
            post("/api/games/$identifier/players/$playerName/score")
                .contentType(MediaType.APPLICATION_JSON)
                .content(jsonMapper.writeValueAsString(ScoreSubmissionDto(3, 5)))
        ).andExpect(status().isAccepted)
        mockMvc.perform(get("/api/games/$identifier/players"))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$[0].totalScore").value(5))
    }

    @Test
    fun `Get Scores Test`() {
        val identifier = createGameAndGetIdentifier()
        joinGame(identifier, playerName)
        submitScore(identifier, playerName, 1, 5)
        mockMvc.perform(get("/api/games/$identifier/players"))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$[0].totalScore").value(5))
    }

    private fun createGameAndGetIdentifier(): String {
        val result = mockMvc.perform(post("/api/games"))
            .andReturn()
        return JsonPath.read(result.response.contentAsString, "$.identifier")
    }

    private fun joinGame(identifier: String, playerName: String) {
        mockMvc.perform(post("/api/games/$identifier/join").param("name", playerName))
            .andReturn()
    }

    private fun submitScore(identifier: String, playerName: String, hole: Int, score: Int) {
        mockMvc.perform(
            post("/api/games/$identifier/players/$playerName/score")
                .contentType(MediaType.APPLICATION_JSON)
                .content(jsonMapper.writeValueAsString(ScoreSubmissionDto(3, 5)))
        )
            .andReturn()
    }
}
