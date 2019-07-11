package co.uk.suskins.pubgolf.controllers;

import co.uk.suskins.pubgolf.models.PubGolfEntity;
import co.uk.suskins.pubgolf.repository.PubgolfRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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
    private static final Logger LOGGER = LoggerFactory.getLogger(ScoreController.class);
    @Autowired
    private PubgolfRepository pubgolfRepository;

    /**
     * Submit Score POST endpoint.
     * Updates the score for the provided player.
     *
     * @param name String Users Name (Dervived from Facebook)
     * @param hole String Hole number
     * @param par  String Par
     */
    @PostMapping("/submitscore")
    public void submit(@RequestParam("name") String name,
                       @RequestParam("hole") String hole,
                       @RequestParam("par") String par) {
        LOGGER.debug("{} submitted a score of {} for hole {}.", name, par, hole);
        PubGolfEntity pubGolfEntity = pubgolfRepository.findByName(name);

        if (Objects.nonNull(pubGolfEntity)) {
            //Updates the users score if they have previously submitted a score.
            switch (hole) {
                case "1":
                    pubGolfEntity.setHole1(Integer.parseInt(par));
                    break;
                case "2":
                    pubGolfEntity.setHole2(Integer.parseInt(par));
                    break;
                case "3":
                    pubGolfEntity.setHole3(Integer.parseInt(par));
                    break;
                case "4":
                    pubGolfEntity.setHole4(Integer.parseInt(par));
                    break;
                case "5":
                    pubGolfEntity.setHole5(Integer.parseInt(par));
                    break;
                case "6":
                    pubGolfEntity.setHole6(Integer.parseInt(par));
                    break;
                case "7":
                    pubGolfEntity.setHole7(Integer.parseInt(par));
                    break;
                case "8":
                    pubGolfEntity.setHole8(Integer.parseInt(par));
                    break;
                case "9":
                    pubGolfEntity.setHole9(Integer.parseInt(par));
                    break;
            }
            pubGolfEntity.updateScore();
            pubgolfRepository.save(pubGolfEntity);

        } else {
            //Creates a new entry in database as user has not already submitted score.
            switch (hole) {
                case "1":
                    pubgolfRepository.save(new PubGolfEntity(name, Integer.parseInt(par), 0, 0, 0, 0, 0, 0, 0, 0));
                    break;
                case "2":
                    pubgolfRepository.save(new PubGolfEntity(name, 0, Integer.parseInt(par), 0, 0, 0, 0, 0, 0, 0));
                    break;
                case "3":
                    pubgolfRepository.save(new PubGolfEntity(name, 0, 0, Integer.parseInt(par), 0, 0, 0, 0, 0, 0));
                    break;
                case "4":
                    pubgolfRepository.save(new PubGolfEntity(name, 0, 0, 0, Integer.parseInt(par), 0, 0, 0, 0, 0));
                    break;
                case "5":
                    pubgolfRepository.save(new PubGolfEntity(name, 0, 0, 0, 0, Integer.parseInt(par), 0, 0, 0, 0));
                    break;
                case "6":
                    pubgolfRepository.save(new PubGolfEntity(name, 0, 0, 0, 0, 0, Integer.parseInt(par), 0, 0, 0));
                    break;
                case "7":
                    pubgolfRepository.save(new PubGolfEntity(name, 0, 0, 0, 0, 0, 0, Integer.parseInt(par), 0, 0));
                    break;
                case "8":
                    pubgolfRepository.save(new PubGolfEntity(name, 0, 0, 0, 0, 0, 0, 0, Integer.parseInt(par), 0));
                    break;
                case "9":
                    pubgolfRepository.save(new PubGolfEntity(name, 0, 0, 0, 0, 0, 0, 0, 0, Integer.parseInt(par)));
                    break;
            }
        }
    }

    /**
     * Gets all scores in database.
     *
     * @return List of PubGolfEntities from Database
     */
    @GetMapping("/getscores")
    public List<PubGolfEntity> score() {
        List<PubGolfEntity> entities = (List<PubGolfEntity>) pubgolfRepository.findAll();
        Collections.sort(entities);
        return entities;
    }
}
