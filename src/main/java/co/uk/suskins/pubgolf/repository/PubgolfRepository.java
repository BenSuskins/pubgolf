package co.uk.suskins.pubgolf.repository;

import co.uk.suskins.pubgolf.entity.PubGolf;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PubgolfRepository extends JpaRepository<PubGolf, String> {
    PubGolf findByName(String name);
}
