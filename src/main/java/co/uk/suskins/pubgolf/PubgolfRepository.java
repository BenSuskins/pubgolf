package co.uk.suskins.pubgolf;

import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PubgolfRepository extends CrudRepository<Pubgolf, String> {
    Pubgolf findByName(String name);
}
