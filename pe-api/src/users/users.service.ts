import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Team } from '../teams/entities/team.entity';

interface RiotDataUpdate {
  riotPuuid: string;
  riotGameName: string;
  riotTagLine: string;
  riotRegion: string;
  soloTier: string | null;
  soloRank: string | null;
  soloLp: number;
  flexTier: string | null;
  flexRank: string | null;
  flexLp: number;
  rankPoints: number;
  rankUpdatedAt: Date;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Team)
    private teamsRepository: Repository<Team>,
  ) {}

  create(createUserDto: CreateUserDto) {
    const user = this.usersRepository.create(createUserDto);
    return this.usersRepository.save(user);
  }

  findAll() {
    return this.usersRepository.find();
  }

  findOne(id: string) {
    return this.usersRepository.findOneBy({ id });
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.usersRepository.findOneBy({ id });
    if (!user) throw new NotFoundException(`User with id ${id} not found`);

    let team: Team | undefined;
    if (updateUserDto.team_id) {
      const found = await this.teamsRepository.findOneBy({
        id: updateUserDto.team_id,
      });
      if (!found)
        throw new NotFoundException(
          `Team with id ${updateUserDto.team_id} not found`,
        );
      team = found;
    }

    Object.assign(user, updateUserDto);
    if (team) user.team = team;
    return this.usersRepository.save(user);
  }

  async remove(id: string) {
    const user = await this.usersRepository.findOneBy({ id });
    if (!user) throw new NotFoundException(`User with id ${id} not found`);
    return this.usersRepository.remove(user);
  }

  // ─── Auth ────────────────────────────────────────────────────────────────

  findByEmail(email: string) {
    return this.usersRepository.findOneBy({ email });
  }

  findByUsername(username: string) {
    return this.usersRepository.findOneBy({ username });
  }

  findById(id: string) {
    return this.usersRepository.findOneBy({ id });
  }

  async updateRefreshToken(userId: string, hash: string | null) {
    await this.usersRepository.update(userId, { refreshTokenHash: hash });
  }

  // ─── Riot ────────────────────────────────────────────────────────────────

  findByPuuid(puuid: string) {
    return this.usersRepository.findOneBy({ riotPuuid: puuid });
  }

  async updateRiotData(userId: string, data: RiotDataUpdate) {
    const user = await this.usersRepository.findOneBy({ id: userId });
    if (!user) throw new NotFoundException(`User with id ${userId} not found`);

    user.riotPuuid = data.riotPuuid;
    user.riotGameName = data.riotGameName;
    user.riotTagLine = data.riotTagLine;
    user.riotRegion = data.riotRegion;
    user.soloTier = data.soloTier ?? '';
    user.soloRank = data.soloRank ?? '';
    user.soloLp = data.soloLp;
    user.flexTier = data.flexTier ?? '';
    user.flexRank = data.flexRank ?? '';
    user.flexLp = data.flexLp;
    user.rankPoints = data.rankPoints;
    user.rankUpdatedAt = data.rankUpdatedAt;

    await this.usersRepository.save(user);
  }
}
