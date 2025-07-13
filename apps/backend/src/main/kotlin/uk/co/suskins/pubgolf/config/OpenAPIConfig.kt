package uk.co.suskins.pubgolf.config

import io.swagger.v3.oas.models.OpenAPI
import io.swagger.v3.oas.models.info.Contact
import io.swagger.v3.oas.models.info.Info
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration
class OpenAPIConfig {
    @Bean
    fun configureSwagger(): OpenAPI =
        OpenAPI()
            .info(
                Info()
                    .title("Pub Golf")
                    .version("1.0.0")
                    .contact(Contact().name("Ben Suskins").email("development@suskins.co.uk"))
                    .description("API's to power Pub Golf Application"),
            )
}
