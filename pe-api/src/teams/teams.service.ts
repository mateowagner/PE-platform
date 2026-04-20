import { Injectable, NotFoundException } from '@nestjs/common';
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
  async create(createTeamDto: CreateTeamDto) {
    const owner = await this.usersRepository.findOneBy({
      id: createTeamDto.owner_id,
    });
    if (!owner)
      throw new NotFoundException(
        `User with id ${createTeamDto.owner_id} not found`,
      );

    const team = this.teamsRepository.create({ ...createTeamDto, owner });
    return await this.teamsRepository.save(team);
  }

  async findAll() {
    return await this.teamsRepository.find({ relations: ['owner'] });
  }

  async findOne(id: string) {
    return await this.teamsRepository.findOne({
      where: { id: id.toString() },
      relations: ['owner'],
    });
  }

  async update(id: string, updateTeamDto: UpdateTeamDto) {
    const team = await this.teamsRepository.findOne({ where: { id } });
    if (!team) {
      throw new NotFoundException(`Team with id ${id} not found`);
    }
    Object.assign(team, updateTeamDto);
    return await this.teamsRepository.save(team);
  }

  async remove(id: string) {
    return await this.teamsRepository.delete(id);
  }
}
