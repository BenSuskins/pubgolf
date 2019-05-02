package co.uk.suskins.pubgolf;

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
    @Autowired
    private PubgolfRepository pubgolfRepository;

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
        Pubgolf pubgolf = pubgolfRepository.findByName(name);
        if (Objects.nonNull(pubgolf)) {
            switch (hole) {
                case "1":
                    pubgolf.setHole_1(Integer.parseInt(par));
                    break;
                case "2":
                    pubgolf.setHole_2(Integer.parseInt(par));
                    break;
                case "3":
                    pubgolf.setHole_3(Integer.parseInt(par));
                    break;
                case "4":
                    pubgolf.setHole_4(Integer.parseInt(par));
                    break;
                case "5":
                    pubgolf.setHole_5(Integer.parseInt(par));
                    break;
                case "6":
                    pubgolf.setHole_6(Integer.parseInt(par));
                    break;
                case "7":
                    pubgolf.setHole_7(Integer.parseInt(par));
                    break;
                case "8":
                    pubgolf.setHole_8(Integer.parseInt(par));
                    break;
                case "9":
                    pubgolf.setHole_9(Integer.parseInt(par));
                    break;
            }
            pubgolf.updateScore();
            pubgolfRepository.save(pubgolf);

        } else {
            switch (hole) {
                case "1":
                    pubgolfRepository.save(new Pubgolf(name, Integer.parseInt(par), 0, 0, 0, 0, 0, 0, 0, 0));
                    break;
                case "2":
                    pubgolfRepository.save(new Pubgolf(name, 0, Integer.parseInt(par), 0, 0, 0, 0, 0, 0, 0));
                    break;
                case "3":
                    pubgolfRepository.save(new Pubgolf(name, 0, 0, Integer.parseInt(par), 0, 0, 0, 0, 0, 0));
                    break;
                case "4":
                    pubgolfRepository.save(new Pubgolf(name, 0, 0, 0, Integer.parseInt(par), 0, 0, 0, 0, 0));
                    break;
                case "5":
                    pubgolfRepository.save(new Pubgolf(name, 0, 0, 0, 0, Integer.parseInt(par), 0, 0, 0, 0));
                    break;
                case "6":
                    pubgolfRepository.save(new Pubgolf(name, 0, 0, 0, 0, 0, Integer.parseInt(par), 0, 0, 0));
                    break;
                case "7":
                    pubgolfRepository.save(new Pubgolf(name, 0, 0, 0, 0, 0, 0, Integer.parseInt(par), 0, 0));
                    break;
                case "8":
                    pubgolfRepository.save(new Pubgolf(name, 0, 0, 0, 0, 0, 0, 0, Integer.parseInt(par), 0));
                    break;
                case "9":
                    pubgolfRepository.save(new Pubgolf(name, 0, 0, 0, 0, 0, 0, 0, 0, Integer.parseInt(par)));
                    break;
            }
        }
    }

    @GetMapping("/all")
    public List<Pubgolf> getAll() {
        return (List<Pubgolf>) pubgolfRepository.findAll();
    }

    public static void main(String[] args) {
        SpringApplication.run(PubgolfApplication.class, args);
    }

}
