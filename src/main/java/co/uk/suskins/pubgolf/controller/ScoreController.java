package co.uk.suskins.pubgolf.controller;

import co.uk.suskins.pubgolf.entity.PubGolf;
import co.uk.suskins.pubgolf.repository.PubgolfRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.util.Collections;
import java.util.List;
import java.util.Objects;

@Slf4j
@RestController
@RequestMapping("/api/v1/score")
public class ScoreController {
    private final PubgolfRepository pubgolfRepository;

    public ScoreController(PubgolfRepository pubgolfRepository) {
        this.pubgolfRepository = pubgolfRepository;
    }

    @GetMapping
    public List<PubGolf> getScore(){
        List<PubGolf> all = pubgolfRepository.findAll();
        Collections.sort(all);
        return all;
    }

    @PostMapping
    public void postScore(@RequestParam("name") String name,
//            Principal principal,
                            @RequestParam("hole") String hole,
                            @RequestParam("par") Integer score) {
//        String name = principal.getName();
        PubGolf pubGolf = pubgolfRepository.findByName(name);

        // Create DB Entity if none
        if (Objects.isNull(pubGolf)){
            pubGolf = pubgolfRepository.save(PubGolf.builder()
                                                    .name(name)
                                                    .build());
        }

        // Update score
        switch (hole) {
            case "1":
                pubGolf.setHoleOne(score);
                break;
            case "2":
                pubGolf.setHoleTwo(score);
                break;
            case "3":
                pubGolf.setHoleThree(score);
                break;
            case "4":
                pubGolf.setHoleFour(score);
                break;
            case "5":
                pubGolf.setHoleFive(score);
                break;
            case "6":
                pubGolf.setHoleSix(score);
                break;
            case "7":
                pubGolf.setHoleSeven(score);
                break;
            case "8":
                pubGolf.setHoleEight(score);
                break;
            case "9":
                pubGolf.setHoleNine(score);
                break;
        }
        pubGolf.updateScore();

        pubgolfRepository.save(pubGolf);
    }
}
