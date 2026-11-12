// pe-api/src/team-invitations/team-invitations.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  TeamInvitation,
  InvitationStatus,
} from './entities/team-invitation.entity';
import { Team } from '../teams/entities/team.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class TeamInvitationsService {
  constructor(
    @InjectRepository(TeamInvitation)
    private readonly invitationRepository: Repository<TeamInvitation>,
    @InjectRepository(Team)
    private readonly teamRepository: Repository<Team>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async sendInvitationByIdentifier(
    teamId: string,
    inviterId: string,
    identifier: string,
  ): Promise<TeamInvitation> {
    const rawInput = identifier.trim();
    let invitee: User | null = null;

    if (rawInput.includes('#')) {
      const [rawGameName, rawTagLine] = rawInput.split('#');
      const gameName = rawGameName.trim();
      const tagLine = rawTagLine.trim();

      invitee = await this.userRepository
        .createQueryBuilder('user')
        .where('LOWER(user.riotGameName) = LOWER(:gameName)', { gameName })
        .andWhere('LOWER(user.riotTagLine) = LOWER(:tagLine)', { tagLine })
        .getOne();
    } else {
      invitee = await this.userRepository
        .createQueryBuilder('user')
        .where('LOWER(user.username) = LOWER(:username)', {
          username: rawInput,
        })
        .getOne();
    }

    if (!invitee) {
      throw new NotFoundException(
        `No se encontró ningún jugador registrado con el identificador "${rawInput}".`,
      );
    }

    return await this.sendInvitation(teamId, inviterId, invitee.id);
  }

  async sendInvitation(
    teamId: string,
    inviterId: string,
    inviteeId: string,
  ): Promise<TeamInvitation> {
    const team = await this.teamRepository.findOne({
      where: { id: teamId },
      relations: ['owner', 'members'],
    });

    if (!team) throw new NotFoundException('El equipo no existe.');
    if (team.owner.id !== inviterId) {
      throw new ForbiddenException(
        'Solo el capitán del equipo puede enviar invitaciones.',
      );
    }

    const invitee = await this.userRepository.findOne({
      where: { id: inviteeId },
      relations: ['team'],
    });

    if (!invitee) throw new NotFoundException('El jugador no existe.');
    if (invitee.team)
      throw new ConflictException('El jugador ya pertenece a otro equipo.');
    if (!invitee.riotPuuid) {
      throw new BadRequestException(
        'El jugador no ha vinculado su cuenta de Riot Games.',
      );
    }

    const existingPending = await this.invitationRepository.findOne({
      where: {
        team: { id: teamId },
        userInvited: { id: inviteeId },
        status: InvitationStatus.PENDING,
      },
    });

    if (existingPending) {
      throw new ConflictException(
        'Ya existe una invitación pendiente para este jugador.',
      );
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invitation = this.invitationRepository.create({
      team,
      adminInviter: team.owner,
      userInvited: invitee,
      status: InvitationStatus.PENDING,
      expiresAt,
    });

    return await this.invitationRepository.save(invitation);
  }

  async acceptInvitation(
    userId: string,
    invitationId: string,
  ): Promise<TeamInvitation> {
    const invitation = await this.invitationRepository.findOne({
      where: { id: invitationId },
      relations: ['team', 'userInvited'],
    });

    if (!invitation) throw new NotFoundException('Invitación no encontrada.');
    if (invitation.userInvited.id !== userId) {
      throw new ForbiddenException(
        'No tienes permiso para aceptar esta invitación.',
      );
    }
    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException(
        'Esta invitación ya fue procesada o expiró.',
      );
    }

    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['team'],
    });

    if (!user) throw new NotFoundException('Usuario no encontrado.');
    if (user.team) throw new ConflictException('Ya perteneces a un equipo.');

    user.team = invitation.team;
    await this.userRepository.save(user);

    invitation.status = InvitationStatus.ACCEPTED;
    return await this.invitationRepository.save(invitation);
  }

  async rejectInvitation(
    userId: string,
    invitationId: string,
  ): Promise<TeamInvitation> {
    const invitation = await this.invitationRepository.findOne({
      where: { id: invitationId },
      relations: ['userInvited'],
    });

    if (!invitation) throw new NotFoundException('Invitación no encontrada.');
    if (invitation.userInvited.id !== userId) {
      throw new ForbiddenException(
        'No tienes permiso para rechazar esta invitación.',
      );
    }
    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException(
        'Esta invitación ya fue procesada o expiró.',
      );
    }

    invitation.status = InvitationStatus.REJECTED;
    return await this.invitationRepository.save(invitation);
  }

  async getInvitationsByUserId(userId: string): Promise<TeamInvitation[]> {
    return await this.invitationRepository
      .createQueryBuilder('invitation')
      .innerJoinAndSelect('invitation.team', 'team')
      .leftJoinAndSelect('team.owner', 'owner')
      .leftJoinAndSelect('invitation.adminInviter', 'adminInviter')
      .innerJoinAndSelect('invitation.userInvited', 'userInvited')
      .where('userInvited.id = :userId', { userId })
      .andWhere('invitation.status = :status', {
        status: InvitationStatus.PENDING,
      })
      .andWhere('invitation.expiresAt > :now', { now: new Date() })
      .orderBy('invitation.createdAt', 'DESC')
      .getMany();
  }
}
