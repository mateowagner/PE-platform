// pe-api/src/rosters/rosters.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { TournamentRoster } from './entities/tournament-roster.entity';
import { MatchRoster } from './entities/match-roster.entity';
import {
  Tournament,
  TournamentStatus,
} from '../tournaments/entities/tournament.entity';
import { Team } from '../teams/entities/team.entity';
import { User } from '../users/entities/user.entity';
import { Match, MatchStatus } from '../matches/entities/match.entity';
import { RegisterTournamentRosterDto } from './dto/register-tournament-roster.dto';
import { DeclareMatchLineupDto } from './dto/declare-match-lineup.dto';

export interface ParticipantWebhookData {
  puuid: string;
  summonerName?: string;
  championId?: number;
  championName?: string;
}

@Injectable()
export class RostersService {
  constructor(
    @InjectRepository(TournamentRoster)
    private readonly tournamentRosterRepository: Repository<TournamentRoster>,
    @InjectRepository(MatchRoster)
    private readonly matchRosterRepository: Repository<MatchRoster>,
    @InjectRepository(Tournament)
    private readonly tournamentRepository: Repository<Tournament>,
    @InjectRepository(Team)
    private readonly teamRepository: Repository<Team>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Match)
    private readonly matchRepository: Repository<Match>,
  ) {}

  async registerTournamentRoster(
    tournamentId: string,
    dto: RegisterTournamentRosterDto,
    requesterId: string,
    manager?: EntityManager,
  ): Promise<TournamentRoster[]> {
    const tRepo = manager
      ? manager.getRepository(Tournament)
      : this.tournamentRepository;
    const teamRepo = manager
      ? manager.getRepository(Team)
      : this.teamRepository;
    const uRepo = manager ? manager.getRepository(User) : this.userRepository;
    const trRepo = manager
      ? manager.getRepository(TournamentRoster)
      : this.tournamentRosterRepository;

    const tournament = await tRepo.findOne({ where: { id: tournamentId } });
    if (!tournament) throw new NotFoundException('Torneo no encontrado.');

    if (tournament.status !== TournamentStatus.PREPARING) {
      throw new BadRequestException(
        'El torneo ya comenzó; las plantillas oficiales están bloqueadas.',
      );
    }

    const team = await teamRepo.findOne({
      where: { id: dto.teamId },
      relations: ['owner'],
    });
    if (!team) throw new NotFoundException('Equipo no encontrado.');
    if (team.owner.id !== requesterId) {
      throw new ForbiddenException(
        'Solo el capitán puede registrar o editar el roster.',
      );
    }

    const starters = dto.members.filter((m) => !m.isSubstitute);
    if (starters.length !== 5) {
      throw new BadRequestException(
        'Se requieren exactamente 5 jugadores titulares.',
      );
    }

    await trRepo.delete({
      tournament: { id: tournamentId },
      team: { id: team.id },
    });

    const savedRosters: TournamentRoster[] = [];

    for (const member of dto.members) {
      const user = await uRepo.findOne({ where: { id: member.userId } });
      if (!user) {
        throw new NotFoundException(
          `Usuario con ID ${member.userId} no encontrado.`,
        );
      }
      if (!user.riotPuuid) {
        throw new BadRequestException(
          `El jugador ${user.username} no tiene cuenta de Riot vinculada.`,
        );
      }

      const existingInAnotherTeam = await trRepo.findOne({
        where: {
          tournament: { id: tournamentId },
          riot_puuid: user.riotPuuid,
        },
      });

      if (existingInAnotherTeam) {
        throw new ConflictException(
          `El jugador ${user.username} ya está inscripto en otro equipo de este torneo.`,
        );
      }

      const entry = trRepo.create({
        tournament,
        team,
        user,
        riot_puuid: user.riotPuuid,
        riot_game_name: user.riotGameName,
        riot_tag_line: user.riotTagLine,
        is_substitute: member.isSubstitute,
      });

      savedRosters.push(await trRepo.save(entry));
    }

    return savedRosters;
  }

  async declareMatchLineup(
    matchId: string,
    dto: DeclareMatchLineupDto,
    requesterId: string,
  ): Promise<MatchRoster[]> {
    const match = await this.matchRepository.findOne({
      where: { id: matchId },
      relations: [
        'series',
        'series.tournament',
        'series.team_a',
        'series.team_b',
      ],
    });

    if (!match) throw new NotFoundException('Mapa no encontrado.');
    if (match.status === MatchStatus.FINISHED) {
      throw new BadRequestException(
        'No puedes cambiar la alineación: el mapa ya ha finalizado.',
      );
    }

    const team = await this.teamRepository.findOne({
      where: { id: dto.teamId },
      relations: ['owner'],
    });

    if (!team) throw new NotFoundException('Equipo no encontrado.');
    if (team.owner.id !== requesterId) {
      throw new ForbiddenException(
        'Solo el capitán del equipo puede declarar la alineación.',
      );
    }

    if (
      match.series.team_a?.id !== team.id &&
      match.series.team_b?.id !== team.id
    ) {
      throw new BadRequestException('El equipo no participa en esta serie.');
    }

    const tournamentId = match.series.tournament.id;
    const officialRoster = await this.tournamentRosterRepository.find({
      where: { tournament: { id: tournamentId }, team: { id: team.id } },
      relations: ['user'],
    });

    const rosterMap = new Map(
      officialRoster.map((r) => [r.riot_puuid, r.user]),
    );

    for (const puuid of dto.playerPuuids) {
      if (!rosterMap.has(puuid)) {
        throw new BadRequestException(
          `El jugador con PUUID ${puuid} no está inscripto en la lista oficial del torneo.`,
        );
      }
    }

    await this.matchRosterRepository.delete({
      match: { id: matchId },
      team: { id: team.id },
    });

    const createdLineup: MatchRoster[] = [];
    for (const puuid of dto.playerPuuids) {
      const user = rosterMap.get(puuid);
      const row = this.matchRosterRepository.create({
        match,
        team,
        user: user ?? null,
        riot_puuid: puuid,
        is_authorized: true,
      });
      createdLineup.push(await this.matchRosterRepository.save(row));
    }

    return createdLineup;
  }

  async getMatchRosters(
    matchId: string,
  ): Promise<MatchRoster[] | TournamentRoster[]> {
    const existingMatchRosters = await this.matchRosterRepository.find({
      where: { match: { id: matchId } },
      relations: ['user', 'team'],
    });

    if (existingMatchRosters.length > 0) {
      return existingMatchRosters;
    }

    // Si aún no se declaró alineación específica para este mapa, devolvemos los 5 titulares por defecto
    const match = await this.matchRepository.findOne({
      where: { id: matchId },
      relations: [
        'series',
        'series.tournament',
        'series.team_a',
        'series.team_b',
      ],
    });

    if (!match || !match.series) {
      return [];
    }

    const tournamentId = match.series.tournament?.id;
    const teamAId = match.series.team_a?.id;
    const teamBId = match.series.team_b?.id;

    if (!tournamentId) return [];

    const defaultStarters = await this.tournamentRosterRepository
      .createQueryBuilder('tr')
      .leftJoinAndSelect('tr.user', 'user')
      .leftJoinAndSelect('tr.team', 'team')
      .where('tr.tournament_id = :tournamentId', { tournamentId })
      .andWhere('tr.is_substitute = false')
      .andWhere('tr.team_id IN (:...teamIds)', {
        teamIds: [teamAId, teamBId].filter(Boolean),
      })
      .getMany();

    return defaultStarters;
  }

  async recordMatchParticipants(
    match: Match,
    teamA: Team,
    teamB: Team,
    participantsA: ParticipantWebhookData[],
    participantsB: ParticipantWebhookData[],
    manager: EntityManager,
  ): Promise<MatchRoster[]> {
    const mrRepo = manager.getRepository(MatchRoster);
    const trRepo = manager.getRepository(TournamentRoster);
    const uRepo = manager.getRepository(User);

    const tournamentId = match.series.tournament.id;
    const records: MatchRoster[] = [];

    const processTeam = async (
      team: Team,
      participants: ParticipantWebhookData[],
    ) => {
      const validRoster = await trRepo.find({
        where: {
          tournament: { id: tournamentId },
          team: { id: team.id },
        },
      });

      const allowedPuuids = new Set(validRoster.map((r) => r.riot_puuid));

      for (const p of participants) {
        const user = await uRepo.findOne({ where: { riotPuuid: p.puuid } });
        const isAuthorized = allowedPuuids.has(p.puuid);

        const row = mrRepo.create({
          match,
          team,
          user: user ?? null,
          riot_puuid: p.puuid,
          summoner_name: p.summonerName,
          champion_id: p.championId,
          champion_name: p.championName,
          is_authorized: isAuthorized,
        });

        records.push(await mrRepo.save(row));
      }
    };

    await processTeam(teamA, participantsA);
    await processTeam(teamB, participantsB);

    return records;
  }

  async getTournamentRosters(
    tournamentId: string,
    teamId?: string,
  ): Promise<TournamentRoster[]> {
    const qb = this.tournamentRosterRepository
      .createQueryBuilder('tr')
      .leftJoinAndSelect('tr.user', 'user')
      .leftJoinAndSelect('tr.team', 'team')
      .where('tr.tournament_id = :tournamentId', { tournamentId });

    if (teamId) {
      qb.andWhere('tr.team_id = :teamId', { teamId });
    }

    return qb.getMany();
  }
}
