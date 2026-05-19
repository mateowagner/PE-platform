import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Team } from '../../teams/entities/team.entity';
import { TeamInvitation } from '../../team-invitations/entities/team-invitation.entity';

export enum UserRole {
  USER = 'USER',
  STAFF = 'STAFF',
  ADMIN = 'ADMIN',
}

@Entity('users') // Nombre de la tabla en plural y minúscula
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 30, unique: true })
  email!: string;

  @Column({ length: 30, unique: true })
  username!: string;

  @Column()
  @Exclude()
  password!: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role!: UserRole;

  @Column({ name: 'refresh_token_hash', nullable: true, type: 'text' })
  refreshTokenHash!: string | null;

  @Column({
    name: 'created_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt!: Date;

  // ─── Riot Account ────────────────────────────────────────────────────────

  @Column({ name: 'riot_puuid', nullable: true, unique: true })
  riotPuuid!: string;

  @Column({ name: 'riot_game_name', nullable: true })
  riotGameName!: string;

  @Column({ name: 'riot_tag_line', nullable: true })
  riotTagLine!: string;

  @Column({ name: 'riot_region', nullable: true })
  riotRegion!: string;

  @Column({ name: 'solo_tier', nullable: true })
  soloTier!: string;

  @Column({ name: 'solo_rank', nullable: true })
  soloRank!: string;

  @Column({ name: 'solo_lp', nullable: true, type: 'int' })
  soloLp!: number;

  @Column({ name: 'flex_tier', nullable: true })
  flexTier!: string;

  @Column({ name: 'flex_rank', nullable: true })
  flexRank!: string;

  @Column({ name: 'flex_lp', nullable: true, type: 'int' })
  flexLp!: number;

  @Column({ name: 'rank_points', default: 0, type: 'int' })
  rankPoints!: number;

  @Column({ name: 'rank_updated_at', nullable: true, type: 'timestamp' })
  rankUpdatedAt!: Date;

  // ─── Team & Invitations ──────────────────────────────────────────────────

  @ManyToOne(() => Team, (team) => team.members, {
    eager: false,
    nullable: true,
  })
  @JoinColumn({ name: 'team_id' }) // Forzamos snake_case para la clave foránea
  team!: Team | null;

  @OneToMany(() => TeamInvitation, (invitation) => invitation.adminInviter)
  sentInvitations!: TeamInvitation[];

  @OneToMany(() => TeamInvitation, (invitation) => invitation.userInvited)
  receivedInvitations!: TeamInvitation[];
}
