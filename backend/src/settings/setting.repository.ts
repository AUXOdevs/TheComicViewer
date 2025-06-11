import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { Setting } from './entities/setting.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class SettingRepository {
  constructor(
    @InjectRepository(Setting)
    private readonly settingORMRepository: Repository<Setting>,
  ) {}

  async findByKey(key: string): Promise<Setting | null> {
    return this.settingORMRepository.findOne({ where: { key } });
  }

  create(settingPartial: Partial<Setting>): Setting {
    return this.settingORMRepository.create(settingPartial);
  }

  async save(setting: Setting): Promise<Setting> {
    return this.settingORMRepository.save(setting);
  }
}
