import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { TournamentSeries } from '../../series/entities/series.entity';
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
  match_order!: number; // Indica si es el Juego 1, Juego 2, Juego 3...

  @Column({ type: 'varchar', length: 150, nullable: true })
  riot_match_id?: string; // El ID real de la API de Riot Games

  @Column({ type: 'jsonb', nullable: true })
  stats?: Record<string, any>; // Guardamos el JSON crudo con todo el KDA, oro, etc.

  @Column({
    type: 'enum',
    enum: MatchStatus,
    default: MatchStatus.CREATED,
  })
  status!: MatchStatus;

  // --- RELACIONES ---
  @ManyToOne(() => TournamentSeries, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'series_id' })
  series!: TournamentSeries;

  @ManyToOne(() => Team, { nullable: true })
  @JoinColumn({ name: 'winner_id' })
  winner?: Team; // El equipo que destruyó el nexo
}
