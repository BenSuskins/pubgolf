package co.uk.suskins.pubgolf;

import co.uk.suskins.pubgolf.config.Config;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.oauth2.client.EnableOAuth2Sso;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.boot.web.servlet.support.SpringBootServletInitializer;
import org.springframework.context.annotation.Import;

@SpringBootApplication
@EnableOAuth2Sso
@Import({Config.class})
public class PubgolfApplication extends SpringBootServletInitializer {
    public static void main(String[] args) {
        SpringApplication.run(PubgolfApplication.class, args);
    }

    @Override
    protected SpringApplicationBuilder configure(SpringApplicationBuilder application) {
        return application.sources(PubgolfApplication.class);
    }

}
