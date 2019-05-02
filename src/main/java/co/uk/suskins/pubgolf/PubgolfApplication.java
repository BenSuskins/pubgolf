package co.uk.suskins.pubgolf;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.oauth2.client.EnableOAuth2Sso;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.boot.web.servlet.support.SpringBootServletInitializer;
import org.springframework.context.annotation.Import;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.util.Map;

@SpringBootApplication
@EnableOAuth2Sso
@RestController
@Import({Config.class})
public class PubgolfApplication extends SpringBootServletInitializer {

    @Override
    protected SpringApplicationBuilder configure(SpringApplicationBuilder application) {
        return application.sources(PubgolfApplication.class);
    }

    @GetMapping("/user")
    public Principal user(Principal principal) {
        return principal;
    }

    @PostMapping("/submitscore")
    public void submit(@RequestParam("name") String name,
                       @RequestParam("hole") String hole,
                       @RequestParam("par") String par) {
        System.out.println(name + hole + par);
    }

    public static void main(String[] args) {
        SpringApplication.run(PubgolfApplication.class, args);
    }

}
