import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance, AxiosError } from 'axios';

// ─── Tipos de respuesta de Riot API ─────────────────────────────────────────

interface RiotAccount {
  puuid: string;
  gameName: string;
  tagLine: string;
}

interface RiotLeagueEntry {
  queueType: string; // RANKED_SOLO_5x5 | RANKED_FLEX_SR
  tier: string; // IRON | BRONZE | SILVER | GOLD | PLATINUM | EMERALD | DIAMOND | MASTER | GRANDMASTER | CHALLENGER
  rank: string; // I | II | III | IV
  leaguePoints: number;
}

export interface RiotRankData {
  puuid: string;
  gameName: string;
  tagLine: string;
  summonerLevel: number;
  soloTier: string | null;
  soloRank: string | null;
  soloLp: number;
  flexTier: string | null;
  flexRank: string | null;
  flexLp: number;
  rankPoints: number; // puntos calculados según tabla del reglamento
}

// ─── Tabla de puntos según reglamento (sección 2.2) ─────────────────────────

const TIER_BASE_POINTS: Record<string, number> = {
  UNRANKED: 0,
  IRON: 0,
  BRONZE: 1,
  SILVER: 2, // IV-III = 0, II-I = 1 (se ajusta por rank abajo)
  GOLD: 3, // IV-III = 2, II-I = 3
  PLATINUM: 4, // IV-III = 4, II-I = 5
  EMERALD: 5, // IV-III = 6, II-I = 7
  DIAMOND: 6, // IV-III = 8, II = 9, I = 10
  MASTER: 7,
  GRANDMASTER: 8,
  CHALLENGER: 9,
};

function calculateRankPoints(
  tier: string | null,
  rank: string | null,
  lp: number,
): number {
  if (!tier) return 0;

  const base = TIER_BASE_POINTS[tier] ?? 0 + (rank === 'I' ? 0 : 0) + lp * 0;

  return base;
}

// ────────────────────────────────────────────────────────────────────────────

@Injectable()
export class RiotService {
  private readonly accountClient: AxiosInstance; // americas (global)
  private readonly regionalClient: AxiosInstance; // la1 (LAS)

  constructor(private config: ConfigService) {
    const apiKey = this.config.getOrThrow<string>('RIOT_API_KEY');

    const headers = { 'X-Riot-Token': apiKey };

    // Cuenta y PUUID → siempre en americas para LAS
    this.accountClient = axios.create({
      baseURL: 'https://americas.api.riotgames.com',
      headers,
    });

    // Summoner y rangos → servidor regional LAS
    this.regionalClient = axios.create({
      baseURL: 'https://la2.api.riotgames.com',
      headers,
    });
  }

  // ─── Método principal: recibe "NickName#TAG" y devuelve todos los datos ───

  async getAccountData(riotId: string): Promise<RiotRankData> {
    const { gameName, tagLine } = this.parseRiotId(riotId);
    const puuid = await this.fetchPuuid(gameName, tagLine);
    const entries = await this.fetchLeagueEntriesByPuuid(puuid);

    const solo = entries.find((e) => e.queueType === 'RANKED_SOLO_5x5') ?? null;
    const flex = entries.find((e) => e.queueType === 'RANKED_FLEX_SR') ?? null;

    const soloPoints = calculateRankPoints(
      solo?.tier ?? null,
      solo?.rank ?? null,
      solo?.leaguePoints ?? 0,
    );
    const flexPoints = calculateRankPoints(
      flex?.tier ?? null,
      flex?.rank ?? null,
      flex?.leaguePoints ?? 0,
    );

    return {
      puuid,
      gameName,
      tagLine,
      summonerLevel: 0,
      soloTier: solo?.tier ?? 'UNRANKED',
      soloRank: solo?.rank ?? '-',
      soloLp: solo?.leaguePoints ?? 0,
      flexTier: flex?.tier ?? 'UNRANKED',
      flexRank: flex?.rank ?? '-',
      flexLp: flex?.leaguePoints ?? 0,
      rankPoints: Math.max(soloPoints, flexPoints),
    };
  }

  // ─── Helpers privados ────────────────────────────────────────────────────

  private parseRiotId(riotId: string): { gameName: string; tagLine: string } {
    const hashIndex = riotId.lastIndexOf('#');

    if (
      hashIndex === -1 ||
      hashIndex === 0 ||
      hashIndex === riotId.length - 1
    ) {
      throw new BadRequestException(
        'Riot ID must be in the format NickName#TAG (e.g. Player#LAS)',
      );
    }

    return {
      gameName: riotId.substring(0, hashIndex),
      tagLine: riotId.substring(hashIndex + 1),
    };
  }

  private async fetchPuuid(gameName: string, tagLine: string): Promise<string> {
    try {
      const { data } = await this.accountClient.get<RiotAccount>(
        `/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`,
      );
      return data.puuid;
    } catch (error) {
      if (
        axios.isAxiosError(error) &&
        (error as AxiosError).response?.status === 404
      ) {
        throw new BadRequestException(
          `Account "${gameName}#${tagLine}" not found. Check your Riot ID and try again.`,
        );
      }
      throw new InternalServerErrorException('Failed to contact Riot API');
    }
  }
  private async fetchLeagueEntriesByPuuid(
    puuid: string,
  ): Promise<RiotLeagueEntry[]> {
    try {
      console.log(`Fetching league entries for PUUID: ${puuid}`);
      const { data } = await this.regionalClient.get<RiotLeagueEntry[]>(
        `/lol/league/v4/entries/by-puuid/${puuid}`,
      );
      console.log('League entries:', JSON.stringify(data));
      return data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(
          'League entries error:',
          error.response?.status,
          error.response?.data,
        );
      }
      return [];
    }
  }
  // ─── API DE TORNEOS (STUB) ────────────────────────────────────────────────

  /**
   * Obtiene el Provider ID del entorno o registra uno nuevo si no existe.
   * IMPORTANTE: La URL debe ser tu dominio público (ej: https://api.tuplataforma.com/matches/webhook)
   */
  async getOrCreateProviderId(webhookUrl: string): Promise<number> {
    // 1. Buscamos si ya lo tenés configurado en el .env
    const envProviderId = this.config.get<number>('RIOT_PROVIDER_ID');

    if (envProviderId) {
      return envProviderId;
    }

    // 2. Si no existe, nos registramos en Riot
    try {
      const { data } = await this.accountClient.post<number>(
        '/lol/tournament-stub/v5/providers',
        {
          region: 'LAS',
          url: webhookUrl,
        },
      );

      // 3. Te avisamos por consola para que lo guardes para siempre
      console.warn('====================================================');
      console.warn(`[ATENCIÓN] Nuevo Provider ID generado en Riot: ${data}`);
      console.warn(`Por favor, agregá esta línea a tu archivo .env:`);
      console.warn(`RIOT_PROVIDER_ID=${data}`);
      console.warn('====================================================');

      return data;
    } catch (error) {
      console.error('Error de Riot API:', error);
      throw new InternalServerErrorException(
        'Fallo al registrar el Provider en la API de Torneos de Riot',
      );
    }
  }

  /**
   * Registra un nuevo torneo lógico en Riot Games.
   * Esto se ejecuta UNA vez cuando creás el torneo en tu plataforma.
   */
  async registerTournament(
    providerId: number,
    tournamentName: string,
  ): Promise<number> {
    try {
      const { data } = await this.accountClient.post<number>(
        '/lol/tournament-stub/v5/tournaments',
        {
          name: tournamentName,
          providerId: providerId,
        },
      );
      return data; // Devuelve el tournamentId (ej: 12345)
    } catch (error) {
      console.error('Error de Riot API:', error);
      throw new InternalServerErrorException(
        `Fallo al registrar el torneo "${tournamentName}" en Riot`,
      );
    }
  }

  /**
   * Genera el lote (batch) de códigos para repartir en tus partidas.
   * Esto se ejecuta cuando armás el fixture (generateFixture).
   */
  async generateTournamentCodes(
    tournamentId: number,
    count: number,
    mapType: string,
    pickType: string,
    metaData: string = '', // UUID de tu Match por defecto vacío
  ): Promise<string[]> {
    try {
      const { data } = await this.accountClient.post<string[]>(
        `/lol/tournament-stub/v5/codes?count=${count}&tournamentId=${tournamentId}`,
        {
          mapType: mapType,
          pickType: pickType,
          spectatorType: 'ALL',
          teamSize: 5,
          metadata: metaData,
        },
      );
      return data; // Devuelve ['LAS-123', 'LAS-456', ...]
    } catch (error) {
      console.error('Error de Riot API:', error);
      throw new InternalServerErrorException(
        `Fallo al generar los ${count} códigos de torneo`,
      );
    }
  }
}
