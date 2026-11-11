// pe-api/src/rosters/entities/match-roster.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Match } from '../../matches/entities/match.entity';
import { Team } from '../../teams/entities/team.entity';
import { User } from '../../users/entities/user.entity';

@Entity('match_rosters')
export class MatchRoster {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Match, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'match_id' })
  match!: Match;

  @ManyToOne(() => Team, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'team_id' })
  team!: Team;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user?: User | null;

  @Column({ name: 'riot_puuid', type: 'varchar', length: 78, nullable: false })
  riot_puuid!: string;

  @Column({ name: 'summoner_name', type: 'varchar', nullable: true })
  summoner_name?: string;

  @Column({ name: 'champion_id', type: 'int', nullable: true })
  champion_id?: number;

  @Column({ name: 'champion_name', type: 'varchar', nullable: true })
  champion_name?: string;

  @Column({ name: 'is_authorized', type: 'boolean', default: true })
  is_authorized!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  created_at!: Date;
}
