package co.uk.suskins.pubgolf.score.repository;

import co.uk.suskins.pubgolf.score.entity.PubGolf;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PubgolfRepository extends JpaRepository<PubGolf, String> {
    PubGolf findByName(String name);
}
