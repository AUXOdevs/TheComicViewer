import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Admin } from './entities/admin.entity';

@Injectable()
export class AdminRepository extends Repository<Admin> {
  constructor(private dataSource: DataSource) {
    super(Admin, dataSource.createEntityManager());
  }

  // Example: Find an admin by user ID (auth0_id)
  async findByUserId(user_id: string): Promise<Admin | undefined> {
    return this.findOne({
      where: { user: { auth0_id: user_id } },
      relations: ['user'],
    });
  }
}
