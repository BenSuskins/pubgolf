package co.uk.suskins.pubgolf.repository;

import co.uk.suskins.pubgolf.models.PubGolfEntity;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

/**
 * Interface for accessing the H2 Database.
 */
@Repository
public interface PubgolfRepository extends CrudRepository<PubGolfEntity, String> {
    PubGolfEntity findByName(String name);
}
