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

  @ManyToOne(() => Team, (team) => team.members, {
    eager: false,
    nullable: true,
  })
  @JoinColumn({ name: 'teamId' })
  team!: Team | null;
}
