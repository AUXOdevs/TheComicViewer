import { Repository, DataSource, EntityManager } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { Role } from './entities/role.entity';
import { User } from '../user/entities/user.entity';
import { InjectDataSource } from '@nestjs/typeorm';

@Injectable()
export class RolesRepository extends Repository<Role> {
  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
  ) {
    super(Role, dataSource.manager);
  }

  async findByName(
    name: string,
    manager?: EntityManager,
  ): Promise<Role | null> {
    const repo = manager
      ? manager.getRepository(Role)
      : this.dataSource.manager.getRepository(Role);
    return repo.findOne({ where: { name } });
  }

  async findUsersByRoleId(roleId: string): Promise<User[]> {
    return this.dataSource.getRepository(User).find({
      where: { role: { role_id: roleId } },
      relations: ['role'],
    });
  }
}
