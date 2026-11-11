// pe-api/src/modules/standings/entities/standing.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';
import { Tournament } from '../../tournaments/entities/tournament.entity';
import { Team } from '../../teams/entities/team.entity';

@Entity('standings')
@Unique(['tournament', 'team'])
export class Standing {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Tournament, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'tournament_id' })
  tournament!: Tournament;

  @ManyToOne(() => Team, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'team_id' })
  team!: Team;

  @Column({ name: 'points', type: 'int', default: 0 })
  points!: number; // 1 punto por serie Bo3 ganada

  @Column({ name: 'series_played', type: 'int', default: 0 })
  series_played!: number;

  @Column({ name: 'series_won', type: 'int', default: 0 })
  series_won!: number;

  @Column({ name: 'series_lost', type: 'int', default: 0 })
  series_lost!: number;

  @Column({ name: 'matches_won', type: 'int', default: 0 })
  matches_won!: number; // Mapas ganados (ej: 2)

  @Column({ name: 'matches_lost', type: 'int', default: 0 })
  matches_lost!: number; // Mapas perdidos (ej: 1 o 0)

  @CreateDateColumn({ name: 'created_at' })
  created_at!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at!: Date;
}
