package uk.co.suskins.pubgolf.approvals

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.databind.SerializationFeature
import com.oneeyedmen.okeydoke.Approver
import com.oneeyedmen.okeydoke.junit5.ApprovalsExtension
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.RegisterExtension
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.web.client.RestTemplate
import java.io.File

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.DEFINED_PORT)
class OpenApiTest {
    @RegisterExtension
    var approvals: ApprovalsExtension = ApprovalsExtension(File("./src/test/resources"))

    @Test
    fun `Can generate an open api spec`(approver: Approver) {
        approver.assertApproved(openApiDocs().asPrettyJson())
    }

    private fun openApiDocs(): String? {
        val restTemplate = RestTemplate()
        return restTemplate.getForObject("http://localhost:8080/v3/api-docs", String::class.java)
    }
}

private fun String?.asPrettyJson(): String {
    val mapper = ObjectMapper().enable(SerializationFeature.INDENT_OUTPUT)
    return mapper.writeValueAsString(mapper.readTree(this))
}