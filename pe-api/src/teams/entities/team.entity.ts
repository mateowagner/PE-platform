import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity()
export class Team {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 50, unique: true })
  name!: string;

  @Column({ nullable: true })
  logoUrl!: string;

  @Column({ default: 0 })
  totalRankPoints!: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;

  // Propietario del equipo
  @ManyToOne(() => User, { eager: false, nullable: false })
  @JoinColumn({ name: 'ownerId' })
  owner!: User;

  // Miembros del equipo
  @OneToMany(() => User, (user) => user.team)
  members!: User[];
}
