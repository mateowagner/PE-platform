// pe-api/src/rosters/entities/tournament-roster.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Unique,
} from 'typeorm';
import { Tournament } from '../../tournaments/entities/tournament.entity';
import { Team } from '../../teams/entities/team.entity';
import { User } from '../../users/entities/user.entity';

@Entity('tournament_rosters')
@Unique(['tournament', 'team', 'user'])
@Unique(['tournament', 'riot_puuid'])
export class TournamentRoster {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Tournament, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'tournament_id' })
  tournament!: Tournament;

  @ManyToOne(() => Team, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'team_id' })
  team!: Team;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'riot_puuid', type: 'varchar', length: 78, nullable: false })
  riot_puuid!: string;

  @Column({ name: 'riot_game_name', type: 'varchar', nullable: true })
  riot_game_name?: string;

  @Column({ name: 'riot_tag_line', type: 'varchar', nullable: true })
  riot_tag_line?: string;

  @Column({ name: 'is_substitute', type: 'boolean', default: false })
  is_substitute!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  created_at!: Date;
}
