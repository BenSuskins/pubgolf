package uk.co.suskins.pubgolf.approvals

import com.oneeyedmen.okeydoke.Approver
import com.oneeyedmen.okeydoke.junit5.ApprovalsExtension
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.RegisterExtension
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.ActiveProfiles
import uk.co.suskins.pubgolf.scenarios.ScenarioTest
import uk.co.suskins.pubgolf.scenarios.asPrettyJson
import java.io.File

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.DEFINED_PORT)
@ActiveProfiles("test")
class GameState : ScenarioTest() {
    @RegisterExtension
    var approvals: ApprovalsExtension = ApprovalsExtension(File("./src/test/resources"))

    @Test
    fun `Game State for 10 players`(approver: Approver) {
        val game = gameOfTenPlayers("Ben")

        approver.assertApproved(gameState(game.gameCode()).bodyString().asPrettyJson())
    }
}
