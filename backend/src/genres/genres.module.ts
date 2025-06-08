import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GenresService } from './genres.service';
import { GenresController } from './genres.controller';
import { Genre } from './entities/genre.entity';
import { GenreRepository } from './genres.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Genre])],
  controllers: [GenresController],
  providers: [GenresService, GenreRepository],
  exports: [GenresService, GenreRepository], // Exportar si otros módulos necesitan
})
export class GenresModule {}
