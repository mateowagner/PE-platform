import {
  Column,
  Entity,
  JoinColumn,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { TeamInvitation } from '../../team-invitations/entities/team-invitation.entity'; // <-- No olvides importar
import {
  SkillTier,
  Tournament,
} from '../../tournaments/entities/tournament.entity';

@Entity('teams') // 1. Nombre explícito y en plural para la DB
export class Team {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 50, unique: true })
  name!: string;

  // En DB TypeORM lo llamará logoUrl (camel), si querés ser purista podés poner { name: 'logo_url' }
  @Column({ name: 'logo_url', nullable: true })
  logoUrl!: string;

  @Column({ name: 'total_rank_points', default: 0 })
  totalRankPoints!: number;

  // 2. camelCase en TypeScript, snake_case en la DB
  @Column({
    name: 'created_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt!: Date;

  // Propietario del equipo
  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'owner_id' }) // 3. Forzamos snake_case para la FK en PostgreSQL
  owner!: User;

  // Miembros del equipo
  @OneToMany(() => User, (user) => user.team)
  members!: User[];

  // 4. El vínculo bidireccional para acceder a las invitaciones emitidas por este equipo
  @OneToMany(() => TeamInvitation, (invitation) => invitation.team)
  invitations!: TeamInvitation[];

  @ManyToMany(() => Tournament, (tournament) => tournament.teams)
  tournaments!: Tournament[];

  @Column({
    type: 'enum',
    enum: SkillTier,
    nullable: true, // Ojo con este detalle
  })
  skill_tier?: SkillTier;
}
