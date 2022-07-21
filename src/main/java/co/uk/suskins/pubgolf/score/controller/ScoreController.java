package co.uk.suskins.pubgolf.score.controller;

import co.uk.suskins.pubgolf.score.entity.PubGolf;
import co.uk.suskins.pubgolf.score.repository.PubgolfRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import javax.validation.Valid;
import javax.validation.constraints.Max;
import javax.validation.constraints.Min;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Pattern;
import javax.validation.constraints.Size;
import java.util.Collections;
import java.util.List;
import java.util.Objects;

@Slf4j
@RestController
@Validated
@RequestMapping("/api/v1/score")
public class ScoreController {
    private final PubgolfRepository pubgolfRepository;

    public ScoreController(PubgolfRepository pubgolfRepository) {
        this.pubgolfRepository = pubgolfRepository;
    }

    @GetMapping
    public List<PubGolf> getScore() {
        List<PubGolf> all = pubgolfRepository.findAll();
        Collections.sort(all);
        return all;
    }

    @PostMapping
    public void postScore(@RequestParam("name") @Valid @Size(min = 2, max = 20) @NotNull @NotBlank @Pattern(regexp = "^[a-zA-Z]*$") String name,
                          @RequestParam("hole") @Valid @Min(1) @Max(9) @NotNull Integer hole,
                          @RequestParam("par") @Valid @Min(-10) @Max(10) @NotNull Integer score) {
        PubGolf pubGolf = pubgolfRepository.findByName(name);

        // Create DB Entity if none
        if (Objects.isNull(pubGolf)) {
            pubGolf = pubgolfRepository.save(PubGolf.builder()
                                                    .name(name)
                                                    .build());
        }

        // Update score
        switch (hole) {
            case 1:
                pubGolf.setHoleOne(score);
                break;
            case 2:
                pubGolf.setHoleTwo(score);
                break;
            case 3:
                pubGolf.setHoleThree(score);
                break;
            case 4:
                pubGolf.setHoleFour(score);
                break;
            case 5:
                pubGolf.setHoleFive(score);
                break;
            case 6:
                pubGolf.setHoleSix(score);
                break;
            case 7:
                pubGolf.setHoleSeven(score);
                break;
            case 8:
                pubGolf.setHoleEight(score);
                break;
            case 9:
                pubGolf.setHoleNine(score);
                break;
        }
        pubGolf.updateScore();

        pubgolfRepository.save(pubGolf);
    }

    @DeleteMapping
    public void deleteScore(@RequestParam("name") @Valid @Size(min = 2, max = 20) @NotNull @NotBlank String name) {
        if (pubgolfRepository.existsById(name)) {
            pubgolfRepository.deleteById(name);
        }
    }

    @GetMapping("/reset")
    public void reset() {
        pubgolfRepository.deleteAll();
    }
}
