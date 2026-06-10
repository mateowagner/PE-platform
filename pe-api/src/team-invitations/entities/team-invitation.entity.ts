import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Team } from '../../teams/entities/team.entity';

// 1. Enum estricto para proteger los estados posibles
export enum InvitationStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
  CANCELED = 'CANCELED',
}

// 2. Nombre explícito de la tabla en snake_case
@Entity('team_invitations')
// 3. Índice Único Parcial: El candado anti-spam a nivel base de datos
@Index(['team', 'userInvited'], { unique: true, where: "status = 'PENDING'" })
export class TeamInvitation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // TypeORM creará un tipo ENUM nativo en PostgreSQL
  @Column({
    type: 'enum',
    enum: InvitationStatus,
    default: InvitationStatus.PENDING,
  })
  status!: InvitationStatus;

  // Mapeo: camelCase en TypeScript -> snake_case en PostgreSQL
  @Column({
    name: 'created_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt!: Date;

  @Column({
    name: 'expires_at',
    type: 'timestamp',
  })
  expiresAt!: Date;

  @ManyToOne(() => Team, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'team_id' })
  team!: Team;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'admin_inviter_id' })
  adminInviter!: User;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_invited_id' })
  userInvited!: User;
}
