import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  ManyToOne,
  JoinTable,
  OneToMany,
  //OneToMany,
} from 'typeorm';
import { Team } from '../../teams/entities/team.entity';
import { User } from '../../users/entities/user.entity';
import { TournamentSeries } from '../../series/entities/series.entity'; // La crearemos luego

export enum TournamentType {
  LEAGUE = 'LEAGUE',
  CUP = 'CUP',
}

export enum TournamentStatus {
  PREPARING = 'PREPARING',
  STARTED = 'STARTED',
  FINISHED = 'FINISHED',
}

export enum SkillTier {
  DIV_1 = 'DIV_1',
  DIV_2 = 'DIV_2',
  TIER_HIGH = 'TIER_HIGH',
  TIER_MID = 'TIER_MID',
  TIER_LOW = 'TIER_LOW',
}

@Entity('tournaments')
export class Tournament {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: TournamentType,
    default: TournamentType.LEAGUE,
  })
  type!: TournamentType;

  @Column({
    type: 'enum',
    enum: TournamentStatus,
    default: TournamentStatus.PREPARING,
  })
  status!: TournamentStatus;

  @Column({
    type: 'enum',
    enum: SkillTier,
  })
  skill_tier!: SkillTier;

  // Fechas de Inscripción
  @Column({ type: 'timestamp' })
  registration_start_date!: Date;

  @Column({ type: 'timestamp' })
  registration_end_date!: Date;

  // Fechas del Torneo
  @Column({ type: 'timestamp' })
  start_date!: Date;

  @Column({ type: 'timestamp', nullable: true })
  end_date?: Date;

  // Configuración de Cupos y Costos
  @Column({ type: 'int', default: 16 })
  max_teams!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  entry_fee!: number;

  @Column({ type: 'varchar', nullable: true })
  prize_pool?: string;

  // Fase actual (Ej: "Jornada 1", "Cuartos de Final")
  @Column({ type: 'varchar', default: 'PRE-TORNEO' })
  current_stage!: string;

  // --- RELACIONES ---

  @ManyToMany(() => Team, (team) => team.tournaments, {})
  @JoinTable({
    name: 'tournament_participants',
    joinColumn: { name: 'tournament_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'team_id', referencedColumnName: 'id' },
  })
  teams!: Team[];

  @ManyToOne(() => Team, { nullable: true })
  winner?: Team;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  created_by!: User;

  @OneToMany(() => TournamentSeries, (series) => series.tournament)
  series!: TournamentSeries[];

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
