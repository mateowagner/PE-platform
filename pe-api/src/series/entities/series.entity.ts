// pe-api/src/series/entities/series.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Tournament } from '../../tournaments/entities/tournament.entity';
import { Team } from '../../teams/entities/team.entity';
import { Match } from '../../matches/entities/match.entity';

export enum SeriesStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

export enum SeriesSlot {
  TEAM_A = 'TEAM_A',
  TEAM_B = 'TEAM_B',
}

@Entity('series')
export class Serie {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Tournament, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tournament_id' })
  tournament!: Tournament;

  @ManyToOne(() => Team, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'team_a_id' })
  team_a?: Team;

  @ManyToOne(() => Team, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'team_b_id' })
  team_b?: Team;

  @ManyToOne(() => Team, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'winner_id' })
  winner?: Team;

  @ManyToOne(() => Serie, { nullable: true })
  @JoinColumn({ name: 'next_series_id' })
  next_series?: Serie;

  @Column({
    type: 'enum',
    enum: SeriesSlot,
    nullable: true,
  })
  next_series_slot?: SeriesSlot;

  @Column({ type: 'int', default: 0 })
  team_a_wins!: number;

  @Column({ type: 'int', default: 0 })
  team_b_wins!: number;

  @Column({ type: 'int', default: 2 })
  wins_required!: number; // 1 para BO1, 2 para BO3, 3 para BO5

  @Column({ type: 'int', default: 1 })
  round_order!: number;

  @Column({ type: 'varchar', length: 100 })
  stage_name!: string;

  @Column({ type: 'timestamp', nullable: true })
  scheduled_date?: Date; // 👈 Fecha y hora estimada de la serie

  @Column({
    type: 'enum',
    enum: SeriesStatus,
    default: SeriesStatus.PENDING,
  })
  status!: SeriesStatus;

  @OneToMany(() => Match, (match) => match.series)
  matches!: Match[];
}
