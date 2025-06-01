import { EntityRepository, Repository } from 'typeorm';
import { Title } from './entities/title.entity';

@EntityRepository(Title)
export class TitlesRepository extends Repository<Title> {}
