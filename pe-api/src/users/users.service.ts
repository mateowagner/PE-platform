import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Team } from '../teams/entities/team.entity';

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
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    let team: Team | undefined;
    if (updateUserDto.team_id) {
      const found = await this.teamsRepository.findOneBy({
        id: updateUserDto.team_id,
      });
      if (!found) {
        throw new NotFoundException(
          `Team with id ${updateUserDto.team_id} not found`,
        );
      }
      team = found;
    }

    Object.assign(user, updateUserDto);
    if (team) user.team = team;
    return this.usersRepository.save(user);
  }

  async remove(id: string) {
    const user = await this.usersRepository.findOneBy({ id });
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return this.usersRepository.remove(user);
  }

  // ─── Métodos usados por AuthService ────────────────────────────────────────

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
}
