package co.uk.suskins.pubgolf;

import co.uk.suskins.pubgolf.config.Config;
import co.uk.suskins.pubgolf.models.Pubgolf;
import co.uk.suskins.pubgolf.repository.PubgolfRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.oauth2.client.EnableOAuth2Sso;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.boot.web.servlet.support.SpringBootServletInitializer;
import org.springframework.context.annotation.Import;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.util.List;
import java.util.Objects;

@SpringBootApplication
@EnableOAuth2Sso
@RestController
@Import({Config.class})
public class PubgolfApplication extends SpringBootServletInitializer {
    @Override
    protected SpringApplicationBuilder configure(SpringApplicationBuilder application) {
        return application.sources(PubgolfApplication.class);
    }

    public static void main(String[] args) {
        SpringApplication.run(PubgolfApplication.class, args);
    }

}
