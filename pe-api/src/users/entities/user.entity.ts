import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Team } from '../../teams/entities/team.entity';

export enum UserRole {
  USER = 'USER',
  STAFF = 'STAFF',
  ADMIN = 'ADMIN',
}

@Entity()
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

  @Column({ nullable: true, type: 'text' })
  refreshTokenHash!: string | null;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;

  // ─── Riot Account ────────────────────────────────────────────────────────

  @Column({ nullable: true, unique: true })
  riotPuuid!: string;

  @Column({ nullable: true })
  riotGameName!: string;

  @Column({ nullable: true })
  riotTagLine!: string;

  @Column({ nullable: true })
  riotRegion!: string;

  @Column({ nullable: true })
  soloTier!: string;

  @Column({ nullable: true })
  soloRank!: string;

  @Column({ nullable: true, type: 'int' })
  soloLp!: number;

  @Column({ nullable: true })
  flexTier!: string;

  @Column({ nullable: true })
  flexRank!: string;

  @Column({ nullable: true, type: 'int' })
  flexLp!: number;

  @Column({ default: 0, type: 'int' })
  rankPoints!: number;

  @Column({ nullable: true, type: 'timestamp' })
  rankUpdatedAt!: Date;

  // ─── Team ────────────────────────────────────────────────────────────────

  @ManyToOne(() => Team, (team) => team.members, {
    eager: false,
    nullable: true,
  })
  @JoinColumn({ name: 'teamId' })
  team!: Team | null;
}
