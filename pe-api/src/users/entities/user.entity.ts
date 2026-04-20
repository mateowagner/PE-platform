import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Team } from '../../teams/entities/team.entity';

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

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;

  // Equipo al que pertenece (nullable porque puede no estar en ninguno)
  @ManyToOne(() => Team, (team) => team.members, {
    eager: false,
    nullable: true,
  })
  @JoinColumn({ name: 'teamId' })
  team!: Team | null;
}
