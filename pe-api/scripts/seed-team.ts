import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import axios from 'axios';
import * as bcrypt from 'bcrypt';
import { User } from '../src/users/entities/user.entity';
import { Team } from '../src/teams/entities/team.entity';
import { RiotService } from '../src/riot/riot.service';

// Interfaces para tipar las respuestas de Riot y Axios
interface RiotChallengerResponse {
  entries: Array<{ puuid: string }>;
}

interface RiotAccountResponse {
  puuid: string;
  gameName: string;
  tagLine: string;
}

interface RiotAccountDataSync {
  gameName?: string;
  tagLine?: string;
  soloTier?: string;
  soloRank?: string;
  soloLp?: number;
  flexTier?: string;
  flexRank?: string;
  flexLp?: number;
  rankPoints?: number;
}

const TEAM_NAME = 'Equipo Bot -';
const BASE_PASSWORD = '415869Mw';
const REGION_ROUTING = 'americas';
const PLATFORM_ROUTING = 'la2';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);
  const riotService = app.get(RiotService);
  const userRepository = dataSource.getRepository(User);
  const teamRepository = dataSource.getRepository(Team);

  const riotApiKey = process.env.RIOT_API_KEY;
  if (!riotApiKey) {
    console.error('ERROR: No se encontró RIOT_API_KEY en el entorno.');
    await app.close();
    return;
  }

  console.log(`Buscando jugadores activos no vinculados en LAS...`);

  // 1. Obtener entradas de Challenger tipadas
  const challengerRes = await axios.get<RiotChallengerResponse>(
    `https://${PLATFORM_ROUTING}.api.riotgames.com/lol/league/v4/challengerleagues/by-queue/RANKED_SOLO_5x5`,
    { headers: { 'X-Riot-Token': riotApiKey } },
  );

  const challengerEntries = challengerRes.data.entries;

  // 2. Filtrar 5 PUUIDs no vinculados
  const availableRiotAccounts: Array<{ puuid: string; riotId: string }> = [];

  for (const entry of challengerEntries) {
    if (availableRiotAccounts.length >= 5) break;

    const existingUser = await userRepository.findOneBy({
      riotPuuid: entry.puuid,
    }); //[cite: 2]
    if (existingUser) continue;

    try {
      const accountRes = await axios.get<RiotAccountResponse>(
        `https://${REGION_ROUTING}.api.riotgames.com/riot/account/v1/accounts/by-puuid/${entry.puuid}`,
        { headers: { 'X-Riot-Token': riotApiKey } },
      );

      const { gameName, tagLine } = accountRes.data;
      if (gameName && tagLine) {
        availableRiotAccounts.push({
          puuid: entry.puuid,
          riotId: `${gameName}#${tagLine}`,
        });
        console.log(`-> Encontrado: ${gameName}#${tagLine}`);
      }
    } catch {
      continue;
    }
  }

  if (availableRiotAccounts.length < 5) {
    console.error('No se pudieron obtener 5 cuentas libres de Riot.');
    await app.close();
    return;
  }

  // 3. Obtener el siguiente correlativo (test1, test2...)
  const allUsers = await userRepository.find({ select: ['username'] });
  let nextIndex = 1;

  for (const u of allUsers) {
    const match = u.username.match(/^test(\d+)$/);
    if (match) {
      const val = parseInt(match[1], 10);
      if (val >= nextIndex) nextIndex = val + 1;
    }
  }

  console.log(`Creando lote a partir del identificador: test${nextIndex}`);

  // 4. Crear y sincronizar los 5 usuarios
  const passwordHash = await bcrypt.hash(BASE_PASSWORD, 10);
  const createdUsers: User[] = [];

  for (let i = 0; i < 5; i++) {
    const userNumber = nextIndex + i;
    const username = `test${userNumber}`;
    const email = `test${userNumber}@gmail.com`;
    const riotAccount = availableRiotAccounts[i];

    let riotData: RiotAccountDataSync = {};
    try {
      riotData = (await riotService.getAccountData(
        riotAccount.riotId,
      )) as RiotAccountDataSync; //[cite: 3]
    } catch {
      console.warn(
        `No se pudieron sincronizar puntos de ${riotAccount.riotId}, usando defaults.`,
      );
    }

    const newUser = userRepository.create({
      username,
      email,
      password: passwordHash,
      riotPuuid: riotAccount.puuid, //[cite: 2]
      riotGameName: riotData.gameName ?? riotAccount.riotId.split('#')[0], //[cite: 2]
      riotTagLine: riotData.tagLine ?? riotAccount.riotId.split('#')[1], //[cite: 2]
      riotRegion: 'LAS', //[cite: 2]
      soloTier: riotData.soloTier ?? '', //[cite: 2]
      soloRank: riotData.soloRank ?? '', //[cite: 2]
      soloLp: riotData.soloLp ?? 0, //[cite: 2]
      flexTier: riotData.flexTier ?? '', //[cite: 2]
      flexRank: riotData.flexRank ?? '', //[cite: 2]
      flexLp: riotData.flexLp ?? 0, //[cite: 2]
      rankPoints: riotData.rankPoints ?? 0, //[cite: 2]
      rankUpdatedAt: new Date(), //[cite: 2]
    });

    const savedUser = await userRepository.save(newUser); //[cite: 2]
    createdUsers.push(savedUser);
    console.log(
      `Usuario creado y vinculado: ${username} (${email}) <-> ${riotAccount.riotId}`,
    );
  }

  // 5. Crear el equipo
  const captain = createdUsers[0];
  const newTeam = teamRepository.create({
    name: `${TEAM_NAME} (${nextIndex - 10})`,
    owner: captain,
    members: createdUsers,
    totalRankPoints: createdUsers.reduce(
      (sum, u) => sum + (u.rankPoints || 0),
      0,
    ), //[cite: 3]
  });

  const savedTeam = await teamRepository.save(newTeam);

  // 6. Asignar la FK del equipo a cada usuario
  for (const member of createdUsers) {
    await userRepository.update(member.id, { team: savedTeam });
  }

  console.log(`\n======================================================`);
  console.log(`Equipo creado con éxito: "${savedTeam.name}"`);
  console.log(`Capitán: ${captain.username}`);
  console.log(`Puntos de rango acumulados: ${savedTeam.totalRankPoints}`);
  console.log(
    `Integrantes vinculados: ${createdUsers.map((u) => u.username).join(', ')}`,
  );
  console.log(`Contraseña de acceso para todos: ${BASE_PASSWORD}`);
  console.log(`======================================================\n`);

  await app.close();
}

bootstrap().catch((err: unknown) => {
  console.error('Error fatal ejecutando el seeder:', err);
  process.exit(1);
});
