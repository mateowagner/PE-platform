// pe-web/src/utils/bracketHelper.ts

/**
 * Retorna el nombre competitivo formal de la ronda según la distancia hacia la final.
 * distanceToFinal: 0 = Final, 1 = Semifinal, 2 = Cuartos, 3 = Octavos, 4 = 16avos, 5 = 32avos
 */
export function getStageTitle(distanceToFinal: number): string {
  switch (distanceToFinal) {
    case 0:
      return "Gran Final";
    case 1:
      return "Semifinales";
    case 2:
      return "Cuartos de Final";
    case 3:
      return "Octavos de Final";
    case 4:
      return "16avos de Final";
    case 5:
      return "32avos de Final";
    default:
      return `Ronda ${distanceToFinal + 1}`;
  }
}
