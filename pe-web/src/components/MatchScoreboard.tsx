// pe-web/src/components/MatchScoreboard.tsx
import { Crown, Clock } from "lucide-react";
import { getChampionIconUrl, getItemIconUrl } from "../utils/riotCdn";
import "./MatchScoreboard.css";

interface ParticipantStats {
  puuid: string;
  riotIdGameName: string;
  riotIdTagline: string;
  championName: string;
  kills: number;
  deaths: number;
  assists: number;
  totalDamageDealtToChampions: number;
  goldEarned: number;
  teamId: number;
  win: boolean;
  items: number[];
  roleBoundItem?: number | null; // Objeto de misión / botas de rol
}

interface MatchScoreboardProps {
  stats: {
    gameDuration: number;
    participants: ParticipantStats[];
  };
  teamAName: string;
  teamBName: string;
}

export function MatchScoreboard({
  stats,
  teamAName,
  teamBName,
}: MatchScoreboardProps) {
  const blueTeam = stats.participants.filter((p) => p.teamId === 100);
  const redTeam = stats.participants.filter((p) => p.teamId === 200);

  const blueWon = blueTeam.some((p) => p.win);
  const redWon = redTeam.some((p) => p.win);

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remainingSecs = sec % 60;
    return `${mins}m ${remainingSecs < 10 ? "0" : ""}${remainingSecs}s`;
  };

  const renderRosterSide = (
    players: ParticipantStats[],
    isWin: boolean,
    isLeft: boolean,
  ) => (
    <div
      className={`scoreboard-side-table ${isWin ? "side-winner" : "side-loser"}`}
    >
      {players.map((p) => {
        const kda =
          p.deaths === 0
            ? "Perfect"
            : ((p.kills + p.assists) / p.deaths).toFixed(2);

        const mainItems = p.items.slice(0, 6);
        const trinket = p.items[6] || 0;
        const roleItem = p.roleBoundItem || 0;

        return (
          <div
            key={p.puuid}
            className={`player-row ${isLeft ? "row-left" : "row-right"}`}
          >
            {/* Ícono de Campeón */}
            <img
              src={getChampionIconUrl(p.championName)}
              alt={p.championName}
              className="champ-icon"
              onError={(e) => {
                e.currentTarget.src = "/default-shield.svg";
              }}
            />

            {/* Nombre & KDA */}
            <div className="player-meta-box">
              <span className="player-summoner truncate">
                {p.riotIdGameName}#{p.riotIdTagline}
              </span>
              <span className="kda-text">
                {p.kills}/{p.deaths}/{p.assists} <em>({kda})</em>
              </span>
            </div>

            {/* Daño y Oro */}
            <div className="player-stats-compact">
              <span>{p.totalDamageDealtToChampions.toLocaleString()} DMG</span>
              <span>{(p.goldEarned / 1000).toFixed(1)}k Gold</span>
            </div>

            {/* Grilla de Ítems (6 slots + Trinket + Misión) */}
            <div className="items-fixed-grid">
              {/* 6 Slots de Inventario */}
              {Array.from({ length: 6 }).map((_, idx) => {
                const itemId = mainItems[idx] || 0;
                return (
                  <div key={`${p.puuid}-slot-${idx}`} className="item-cell-box">
                    {itemId !== 0 ? (
                      <img
                        src={getItemIconUrl(itemId)}
                        alt={`item-${itemId}`}
                        className="item-img"
                        onError={(e) => {
                          e.currentTarget.style.visibility = "hidden";
                        }}
                      />
                    ) : null}
                  </div>
                );
              })}

              {/* Slot 7: Baratija / Trinket */}
              <div className="item-cell-box cell-trinket">
                {trinket !== 0 ? (
                  <img
                    src={getItemIconUrl(trinket)}
                    alt={`trinket-${trinket}`}
                    className="item-img img-trinket"
                    onError={(e) => {
                      e.currentTarget.style.visibility = "hidden";
                    }}
                  />
                ) : null}
              </div>

              {/* Slot 8: Ítem de Rol / Misión / Botas de ADC */}
              <div
                className="item-cell-box cell-mission"
                title="Objeto de Rol / Misión"
              >
                {roleItem !== 0 ? (
                  <img
                    src={getItemIconUrl(roleItem)}
                    alt={`role-item-${roleItem}`}
                    className="item-img img-mission"
                    onError={(e) => {
                      e.currentTarget.style.visibility = "hidden";
                    }}
                  />
                ) : null}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="scoreboard-container fade-in">
      <div className="scoreboard-top-banner">
        <div className={`team-banner-header ${blueWon ? "winner-header" : ""}`}>
          <h3>{teamAName}</h3>
          {blueWon && (
            <span className="crown-tag">
              <Crown size={14} /> VICTORIA
            </span>
          )}
        </div>

        <div className="game-duration-badge">
          <Clock size={14} /> {formatDuration(stats.gameDuration)}
        </div>

        <div className={`team-banner-header ${redWon ? "winner-header" : ""}`}>
          <h3>{teamBName}</h3>
          {redWon && (
            <span className="crown-tag">
              <Crown size={14} /> VICTORIA
            </span>
          )}
        </div>
      </div>

      <div className="scoreboard-horizontal-grid">
        {renderRosterSide(blueTeam, blueWon, true)}
        {renderRosterSide(redTeam, redWon, false)}
      </div>
    </div>
  );
}
