package co.uk.suskins.pubgolf.repository;

import co.uk.suskins.pubgolf.models.Pubgolf;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

/**
 * Interface for accessing the H2 Database.
 */
@Repository
public interface PubgolfRepository extends CrudRepository<Pubgolf, String> {
    Pubgolf findByName(String name);
}
