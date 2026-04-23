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
}
