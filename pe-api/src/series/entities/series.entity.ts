import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Tournament } from '../../tournaments/entities/tournament.entity';
import { Team } from '../../teams/entities/team.entity';

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

  // --- RELACIONES ESTRUCTURALES ---
  @ManyToOne(() => Tournament, { onDelete: 'CASCADE' }) // <-- Agregamos el cascade delete acá
  @JoinColumn({ name: 'tournament_id' })
  tournament!: Tournament;

  @ManyToOne(() => Team, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'team_a_id' })
  team_a?: Team; // Nullable para esperar clasificados en rondas avanzadas

  @ManyToOne(() => Team, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'team_b_id' })
  team_b?: Team;

  @ManyToOne(() => Team, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'winner_id' })
  winner?: Team; // Se setea automáticamente al finalizar la serie

  // --- AUTORREFERENCIA (Árbol binario para formato Copa) ---
  @ManyToOne(() => Serie, { nullable: true })
  @JoinColumn({ name: 'next_series_id' })
  next_series?: Serie; // A dónde viaja el ganador

  @Column({
    type: 'enum',
    enum: SeriesSlot,
    nullable: true,
  })
  next_series_slot?: SeriesSlot; // Qué lugar va a ocupar ('TEAM_A' o 'TEAM_B')

  // --- LÓGICA DE FORMATO Y PUNTUACIÓN ---
  @Column({ type: 'int', default: 0 })
  team_a_wins!: number;

  @Column({ type: 'int', default: 0 })
  team_b_wins!: number;

  @Column({ type: 'int', default: 2 })
  wins_required!: number; // Agnóstico: 1 para BO1, 2 para BO3, 3 para BO5

  // --- ESTRUCTURA Y ORDEN DEL FIXTURE ---
  @Column({ type: 'int', default: 1 })
  round_order!: number; // Control numérico interno (1, 2, 3...)

  @Column({ type: 'varchar', length: 100 })
  stage_name!: string; // Nombre amigable para el frontend ("Cuartos de Final", "Fecha 3")

  // --- CONTROL DE ESTADO ---
  @Column({
    type: 'enum',
    enum: SeriesStatus,
    default: SeriesStatus.PENDING,
  })
  status!: SeriesStatus;
}
