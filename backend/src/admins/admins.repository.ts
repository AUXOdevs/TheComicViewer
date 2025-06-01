import { EntityRepository, Repository } from 'typeorm';
import { Admin } from './entities/admin.entity';

@EntityRepository(Admin)
export class AdminsRepository extends Repository<Admin> {}
