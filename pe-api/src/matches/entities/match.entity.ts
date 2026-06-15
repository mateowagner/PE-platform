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
  match_order!: number; // Indica si es el Juego 1, Juego 2, Juego 3...

  @Column({ type: 'varchar', length: 150, nullable: true })
  riot_match_id?: string; // El ID real de la API de Riot Games después de jugarse

  @Column({ type: 'varchar', length: 150, nullable: true })
  tournament_code?: string; // Código único provisto por Riot para el lobby

  @Column({ type: 'jsonb', nullable: true })
  stats?: Record<string, any>; // JSON crudo con KDA, oro, daño, etc.

  @Column({
    type: 'enum',
    enum: MatchStatus,
    default: MatchStatus.CREATED,
  })
  status!: MatchStatus;

  // --- FECHAS DE LA PARTIDA REAL (RIOT) ---
  @Column({ type: 'timestamp', nullable: true })
  start_date?: Date; // Cuándo inició el mapa en la Grieta

  @Column({ type: 'timestamp', nullable: true })
  end_date?: Date; // Cuándo explotó el Nexo

  // --- AUDITORÍA INTERNA DEL SISTEMA ---
  @CreateDateColumn({ type: 'timestamp' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at!: Date;

  // --- RELACIONES ---
  @ManyToOne(() => Serie, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'series_id' })
  series!: Serie;

  @ManyToOne(() => Team, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'winner_id' })
  winner?: Team; // El equipo que ganó este mapa específico
}
