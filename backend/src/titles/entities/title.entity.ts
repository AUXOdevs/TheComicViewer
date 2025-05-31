import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('titles')
export class Title {
  @PrimaryGeneratedColumn('uuid')
  title_id: string;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column()
  author: string;

  @Column()
  type: string; // 'comic' | 'manga'

  @Column()
  status: string;

  @Column({ type: 'timestamptz', nullable: true })
  publication_date: Date;

  @Column({ nullable: true })
  image_url: string;
}
