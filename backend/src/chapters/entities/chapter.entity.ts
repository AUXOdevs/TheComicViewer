import { Title } from 'src/titles/entities/title.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';

@Entity('chapters')
export class Chapter {
  @PrimaryGeneratedColumn('uuid')
  chapter_id: string;

  @ManyToOne(() => Title)
  title: Title;

  @Column()
  name: string;

  @Column({ type: 'timestamptz', nullable: true })
  release_date: Date;

  @Column()
  pages: string; // URLs o paths

  @Column()
  chapter_number: number;
}
