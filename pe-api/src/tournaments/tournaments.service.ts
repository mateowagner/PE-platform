import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { Tournament, TournamentStatus } from './entities/tournament.entity';
import { Team } from '../teams/entities/team.entity';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { Request } from 'express';
import { User } from '../users/entities/user.entity';
@Injectable()
export class TournamentsService {
  constructor(
    @InjectRepository(Tournament)
    private readonly tournamentRepository: Repository<Tournament>,
    @InjectRepository(Team)
    private readonly teamRepository: Repository<Team>,
  ) {}

  async enrollTeam(
    tournamentId: string,
    teamId: string,
    captainId: string,
  ): Promise<Tournament> {
    // 1. Obtener el torneo con sus equipos ya inscritos
    const tournament = await this.tournamentRepository.findOne({
      where: { id: tournamentId },
      relations: ['teams'],
    });

    if (!tournament) {
      throw new NotFoundException('El torneo especificado no existe.');
    }

    if (tournament.status !== TournamentStatus.PREPARING) {
      throw new BadRequestException(
        'No se pueden inscribir equipos. El torneo no está en fase de preparación.',
      );
    }

    if (tournament.teams.length >= tournament.max_teams) {
      throw new BadRequestException(
        'El torneo ha alcanzado el cupo máximo de equipos.',
      );
    }

    // 2. Obtener el equipo con sus miembros, capitán e historial de torneos
    const team = await this.teamRepository.findOne({
      where: { id: teamId },
      relations: ['members', 'owner', 'tournaments'],
    });

    if (!team) {
      throw new NotFoundException('El equipo especificado no existe.');
    }

    // VALIDACIÓN 1: El capitán existe y es quien ejecuta la acción
    if (!team.owner || team.owner.id !== captainId) {
      throw new BadRequestException(
        'Operación denegada. Solo el capitán del equipo puede realizar la inscripción.',
      );
    }

    // VALIDACIÓN 4: El equipo es válido (Mínimo 5 miembros en el roster)
    if (!team.members || team.members.length < 5) {
      throw new BadRequestException(
        'El equipo no cumple con el mínimo de 5 miembros requeridos para competir.',
      );
    }

    // VALIDACIÓN 2: Cumplimiento de requisitos de Skill Tier (MMR protegido)
    if (team.skill_tier !== tournament.skill_tier) {
      throw new BadRequestException(
        `Restricción de Tier. El nivel del equipo (${team.skill_tier}) no corresponde al nivel del torneo (${tournament.skill_tier}).`,
      );
    }

    // VALIDACIÓN 3: No estar en otra liga o torneo activo de forma simultánea
    const hasActiveTournament = team.tournaments.some(
      (activeTourney) => activeTourney.status === TournamentStatus.STARTED,
    );

    if (hasActiveTournament) {
      throw new BadRequestException(
        'El equipo ya se encuentra disputando una competición activa.',
      );
    }

    // Control de redundancia: Evitar doble inscripción en el mismo torneo
    const isAlreadyEnrolled = tournament.teams.some(
      (enrolledTeam) => enrolledTeam.id === team.id,
    );
    if (isAlreadyEnrolled) {
      throw new BadRequestException(
        'El equipo ya se encuentra inscrito en este torneo.',
      );
    }

    // 3. Persistencia de la relación ManyToMany
    tournament.teams.push(team);
    return await this.tournamentRepository.save(tournament);
  }

  async create(
    createTournamentDto: CreateTournamentDto,
    creatorId: string,
  ): Promise<Tournament> {
    const { registration_start_date, registration_end_date, start_date } =
      createTournamentDto;

    const regStart = new Date(registration_start_date);
    const regEnd = new Date(registration_end_date);
    const tournamentStart = new Date(start_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalizamos las horas para comparar solo días

    // VALIDACIÓN 1: La inscripción no puede abrir en el pasado
    if (regStart < today) {
      throw new BadRequestException(
        'La fecha de inicio de inscripción no puede estar en el pasado.',
      );
    }

    // VALIDACIÓN 2: El cierre de inscripción debe ser posterior a la apertura
    if (regEnd <= regStart) {
      throw new BadRequestException(
        'La fecha de finalización de inscripción debe ser posterior a la fecha de inicio.',
      );
    }

    // VALIDACIÓN 3: El torneo debe empezar estrictamente después de cerrar las inscripciones
    if (tournamentStart <= regEnd) {
      throw new BadRequestException(
        'La fecha de inicio del torneo debe ser posterior al cierre de las inscripciones.',
      );
    }

    // Creación de la instancia sobreescribiendo los valores controlados por el sistema
    const newTournament = this.tournamentRepository.create({
      ...createTournamentDto,
      status: TournamentStatus.PREPARING,
      current_stage: 'PRE-TORNEO',
      created_by: { id: creatorId } as DeepPartial<User>, // Asignamos la relación usando solo el ID
    });

    return await this.tournamentRepository.save(newTournament);
  }
  async findAll(): Promise<Tournament[]> {
    return await this.tournamentRepository.find();
  }

  async findOne(id: string): Promise<Tournament> {
    const tournament = await this.tournamentRepository.findOne({
      where: { id },
    });

    if (!tournament) {
      throw new NotFoundException(`El torneo con ID ${id} no existe.`);
    }

    return tournament;
  }

  async update(
    id: string,
    updateData: Partial<Tournament>,
  ): Promise<Tournament> {
    const tournament = await this.findOne(id);
    Object.assign(tournament, updateData);
    return await this.tournamentRepository.save(tournament);
  }

  async remove(id: string): Promise<void> {
    const tournament = await this.findOne(id);
    await this.tournamentRepository.remove(tournament);
  }
}
