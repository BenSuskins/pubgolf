package co.uk.suskins.pubgolf.controllers;

import co.uk.suskins.pubgolf.models.Pubgolf;
import co.uk.suskins.pubgolf.repository.PubgolfRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.security.Principal;
import java.util.List;
import java.util.Objects;

@Controller
public class ScoreController {
    @Autowired
    private PubgolfRepository pubgolfRepository;


    @RequestMapping("/score")
    public String score(Model model,
                        @RequestParam(value = "name", required = false, defaultValue = "Score") String name) {
        model.addAttribute("name", name);
        return "score";
    }

    @RequestMapping("/")
    public String score(Model model) {
        model.addAttribute("users", pubgolfRepository.findAll());
        return "index";
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
}
