import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { Team } from './entities/team.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { ForbiddenException, BadRequestException } from '@nestjs/common';
@Injectable()
export class TeamsService {
  constructor(
    @InjectRepository(Team)
    private teamsRepository: Repository<Team>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  // Crear equipo: el usuario autenticado es owner y primer miembro
  async createWithOwner(dto: CreateTeamDto, userId: string) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['team'],
    });
    if (!user) throw new NotFoundException('User not found');
    if (user.team) throw new ConflictException('Ya pertenecés a un equipo');
    if (!user.riotPuuid)
      throw new ConflictException(
        'Necesitás vincular tu cuenta de Riot antes de crear un equipo',
      );

    const team = this.teamsRepository.create({
      name: dto.name,
      logoUrl: dto.logo_url,
      owner: user,
    });
    const savedTeam = await this.teamsRepository.save(team);

    // Asignamos al usuario como miembro del equipo
    user.team = savedTeam;
    await this.usersRepository.save(user);

    return this.findOne(savedTeam.id);
  }

  // Buscar el equipo de un usuario por su userId
  async findByMember(userId: string) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['team'],
    });
    if (!user?.team) return null;

    return this.teamsRepository.findOne({
      where: { id: user.team.id },
      relations: ['members', 'owner'],
    });
  }

  async findAll() {
    return this.teamsRepository.find({ relations: ['owner'] });
  }

  async findOne(id: string) {
    return this.teamsRepository.findOne({
      where: { id },
      relations: ['members', 'owner'],
    });
  }

  async update(id: string, dto: UpdateTeamDto) {
    const team = await this.teamsRepository.findOne({ where: { id } });
    if (!team) throw new NotFoundException(`Team with id ${id} not found`);
    Object.assign(team, dto);
    return this.teamsRepository.save(team);
  }

  async remove(id: string) {
    return this.teamsRepository.delete(id);
  }

  async getMembers(id: string) {
    const team = await this.teamsRepository.findOne({
      where: { id },
      relations: ['members'],
    });
    if (!team) throw new NotFoundException(`Team with id ${id} not found`);
    return team.members;
  }
  async removeMember(
    teamId: string,
    captainId: string,
    memberId: string,
  ): Promise<Team> {
    // 1. Obtener el equipo con su dueño y sus miembros
    const team = await this.teamsRepository.findOne({
      where: { id: teamId },
      relations: ['owner', 'members'],
    });

    if (!team) {
      throw new NotFoundException('El equipo especificado no existe.');
    }

    // 2. VALIDACIÓN: Solo el capitán puede echar gente
    if (team.owner.id !== captainId) {
      throw new ForbiddenException(
        'Operación denegada. Solo el capitán puede remover miembros.',
      );
    }

    // 3. VALIDACIÓN: El capitán no puede echarse a sí mismo
    if (memberId === captainId) {
      throw new BadRequestException(
        'No puedes eliminarte a ti mismo del equipo. Utiliza la opción de salir.',
      );
    }

    // 4. VALIDACIÓN: Verificar que el usuario realmente pertenezca al equipo
    const memberIndex = team.members.findIndex((m) => m.id === memberId);
    if (memberIndex === -1) {
      throw new BadRequestException(
        'El jugador especificado no pertenece a este equipo.',
      );
    }

    // 5. Romper la relación: sacamos al miembro del arreglo del equipo
    team.members.splice(memberIndex, 1);

    // 6. Guardamos el equipo actualizado y lo retornamos para refrescar el front
    return await this.teamsRepository.save(team);
  }
  async leaveTeam(userId: string): Promise<void> {
    // 1. Buscar al usuario con su relación de equipo
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['team'],
    });

    if (!user) {
      throw new NotFoundException('El usuario no existe.');
    }

    // 2. VALIDACIÓN: Verificar si realmente tiene un equipo
    if (!user.team) {
      throw new BadRequestException(
        'No perteneces a ningún equipo actualmente.',
      );
    }

    // 3. Obtener el equipo para chequear el dueño
    const team = await this.teamsRepository.findOne({
      where: { id: user.team.id },
      relations: ['owner'],
    });

    // 4. VALIDACIÓN CRÍTICA: El capitán no puede usar este flujo
    if (team && team.owner.id === userId) {
      throw new BadRequestException(
        'Como capitán, no podés abandonar el equipo directamente. Debés transferir el liderazgo o disolver el equipo.',
      );
    }

    // 5. Romper la relación sacando el equipo del usuario
    user.team = null;
    await this.usersRepository.save(user);
  }
}
