package co.uk.suskins.pubgolf.controllers;

import co.uk.suskins.pubgolf.models.Pubgolf;
import co.uk.suskins.pubgolf.repository.PubgolfRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Collections;
import java.util.List;
import java.util.Objects;

/**
 * Controller for submitting scores and accessing the current scores.
 */
@RestController
public class ScoreController {
    @Autowired
    private PubgolfRepository pubgolfRepository;

    @PostMapping("/submitscore")
    public void submit(@RequestParam("name") String name,
                       @RequestParam("hole") String hole,
                       @RequestParam("par") String par) {
        Pubgolf pubgolf = pubgolfRepository.findByName(name);
        if (Objects.nonNull(pubgolf)) {
            switch (hole) {
                case "1":
                    pubgolf.setHole1(Integer.parseInt(par));
                    break;
                case "2":
                    pubgolf.setHole2(Integer.parseInt(par));
                    break;
                case "3":
                    pubgolf.setHole3(Integer.parseInt(par));
                    break;
                case "4":
                    pubgolf.setHole4(Integer.parseInt(par));
                    break;
                case "5":
                    pubgolf.setHole5(Integer.parseInt(par));
                    break;
                case "6":
                    pubgolf.setHole6(Integer.parseInt(par));
                    break;
                case "7":
                    pubgolf.setHole7(Integer.parseInt(par));
                    break;
                case "8":
                    pubgolf.setHole8(Integer.parseInt(par));
                    break;
                case "9":
                    pubgolf.setHole9(Integer.parseInt(par));
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

    @GetMapping("/getscores")
    public List<Pubgolf> score() {
        List<Pubgolf> entities = (List<Pubgolf>) pubgolfRepository.findAll();
        Collections.sort(entities);
        return entities;
    }
}
