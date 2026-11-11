// pe-api/src/users/rank-sync.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, Not } from 'typeorm';
import { User } from './entities/user.entity';
import { Team } from '../teams/entities/team.entity';
import { RiotService } from '../riot/riot.service';

@Injectable()
export class RankSyncService {
  private readonly logger = new Logger(RankSyncService.name);
  private isSyncRunning = false;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Team)
    private readonly teamRepository: Repository<Team>,
    private readonly riotService: RiotService,
  ) {}

  // Se ejecuta todos los días a las 04:00 AM
  @Cron(CronExpression.EVERY_DAY_AT_4AM)
  async handleDailyRankSync(): Promise<void> {
    if (this.isSyncRunning) {
      this.logger.warn(
        'La sincronización anterior aún sigue en ejecución. Omitiendo ciclo...',
      );
      return;
    }

    this.isSyncRunning = true;
    this.logger.log(
      'Iniciando sincronización automática diaria de rangos con Riot API...',
    );

    try {
      // 1. Obtener todos los usuarios con Riot vinculado
      const users = await this.userRepository.find({
        where: {
          riotPuuid: Not(IsNull()),
        },
        relations: ['team'],
      });

      this.logger.log(
        `Se encontraron ${users.length} usuarios con cuenta Riot vinculada.`,
      );

      const affectedTeamIds = new Set<string>();
      const batchSize = 5; // Lote pequeño para no saturar los 20 req/s de Riot
      const delayMs = 1200; // 1.2 segundos entre peticiones

      for (let i = 0; i < users.length; i += batchSize) {
        const currentBatch = users.slice(i, i + batchSize);

        for (const user of currentBatch) {
          if (!user.riotPuuid) continue;

          try {
            // Se utiliza riotGameName#riotTagLine si el método requiere riotId
            const riotId = `${user.riotGameName}#${user.riotTagLine}`;
            const riotData = await this.riotService.getAccountData(riotId);

            // Actualizar datos del usuario
            user.soloTier = riotData.soloTier ?? '';
            user.soloRank = riotData.soloRank ?? '';
            user.soloLp = riotData.soloLp ?? 0;
            user.flexTier = riotData.flexTier ?? '';
            user.flexRank = riotData.flexRank ?? '';
            user.flexLp = riotData.flexLp ?? 0;
            user.rankPoints = riotData.rankPoints ?? 0;
            user.rankUpdatedAt = new Date();

            await this.userRepository.save(user);

            if (user.team?.id) {
              affectedTeamIds.add(user.team.id);
            }

            this.logger.debug(
              `Rango actualizado para: ${user.username} (${riotId})`,
            );
          } catch (error: unknown) {
            const errMessage =
              error instanceof Error ? error.message : String(error);
            this.logger.error(
              `Error actualizando rango de ${user.username}: ${errMessage}`,
            );
          }

          // Delay de seguridad entre llamadas a Riot
          await this.sleep(delayMs);
        }
      }

      // 2. Recalcular puntos totales y promedio de los equipos afectados
      if (affectedTeamIds.size > 0) {
        this.logger.log(
          `Recalculando puntajes de ${affectedTeamIds.size} equipos afectados...`,
        );
        for (const teamId of affectedTeamIds) {
          await this.recalculateTeamPoints(teamId);
        }
      }

      this.logger.log(
        'Sincronización diaria de rangos completada exitosamente.',
      );
    } catch (error: unknown) {
      const errMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Error crítico en la sincronización diaria: ${errMessage}`,
      );
    } finally {
      this.isSyncRunning = false;
    }
  }

  // Recálculo del puntaje acumulado del equipo
  private async recalculateTeamPoints(teamId: string): Promise<void> {
    const result = await this.userRepository
      .createQueryBuilder('user')
      .select('COALESCE(SUM(user.rank_points), 0)', 'total')
      .where('user.team_id = :teamId', { teamId })
      .getRawOne<{ total: string }>();

    const totalPoints = parseInt(result?.total ?? '0', 10);

    await this.teamRepository.update(teamId, {
      totalRankPoints: totalPoints,
    });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  async syncUserRank(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['team'],
    });

    if (!user) {
      throw new Error('Usuario no encontrado.');
    }

    if (!user.riotPuuid || !user.riotGameName || !user.riotTagLine) {
      throw new Error('El usuario no tiene una cuenta de Riot vinculada.');
    }

    const riotId = `${user.riotGameName}#${user.riotTagLine}`;
    const riotData = await this.riotService.getAccountData(riotId);

    user.soloTier = riotData.soloTier ?? '';
    user.soloRank = riotData.soloRank ?? '';
    user.soloLp = riotData.soloLp ?? 0;
    user.flexTier = riotData.flexTier ?? '';
    user.flexRank = riotData.flexRank ?? '';
    user.flexLp = riotData.flexLp ?? 0;
    user.rankPoints = riotData.rankPoints ?? 0;
    user.rankUpdatedAt = new Date();

    const updatedUser = await this.userRepository.save(user);

    if (user.team?.id) {
      await this.recalculateTeamPoints(user.team.id);
    }

    return updatedUser;
  }
}
