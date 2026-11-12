// pe-api/src/matches/entities/match.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Serie } from '../../series/entities/series.entity';
import { Team } from '../../teams/entities/team.entity';

export enum MatchStatus {
  CREATED = 'CREATED',
  STARTED = 'STARTED',
  FINISHED = 'FINISHED',
}

@Entity('matches')
export class Match {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'int' })
  match_order!: number;

  @Column({ type: 'varchar', length: 150, nullable: true })
  riot_match_id?: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  tournament_code?: string;

  // 👇 Nuevos campos para salas personalizadas del MVP
  @Column({ type: 'varchar', length: 150, nullable: true })
  lobby_name?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  lobby_password?: string;

  @Column({ type: 'jsonb', nullable: true })
  stats?: Record<string, any>;

  @Column({
    type: 'enum',
    enum: MatchStatus,
    default: MatchStatus.CREATED,
  })
  status!: MatchStatus;

  @Column({ type: 'timestamp', nullable: true })
  start_date?: Date;

  @Column({ type: 'timestamp', nullable: true })
  end_date?: Date;

  @CreateDateColumn({ type: 'timestamp' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at!: Date;

  @ManyToOne(() => Serie, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'series_id' })
  series!: Serie;

  @ManyToOne(() => Team, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'winner_id' })
  winner?: Team;
}
