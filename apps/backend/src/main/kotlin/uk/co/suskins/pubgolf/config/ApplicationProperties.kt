package uk.co.suskins.pubgolf.config

import org.springframework.boot.context.properties.ConfigurationProperties
import org.springframework.stereotype.Component

@Component
@ConfigurationProperties(prefix = "application")
class ApplicationProperties {
    var origins: List<String> = emptyList()
}
