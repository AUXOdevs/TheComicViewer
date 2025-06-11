import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Setting } from './entities/setting.entity';
import { SettingRepository } from './setting.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Setting])],
  providers: [SettingRepository],
  exports: [SettingRepository],
})
export class SettingsModule {}
