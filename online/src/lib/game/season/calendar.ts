// Método de Berger (Circle Method): gera os confrontos todos-contra-todos (turno e
// returno) para N times de uma divisão. Extraído de src/db/generate-fixtures.ts pra
// ser reutilizável tanto no seed manual quanto na virada de temporada (season/rollover.ts).
export interface TeamForCalendar {
  id: number;
}

export interface FixtureRow {
  homeTeamId: number;
  awayTeamId: number;
  round: number;
  division: string;
  played: boolean;
}

export function generateRoundRobin(divisionTeams: TeamForCalendar[], divisionName: string): FixtureRow[] {
  const matchSchedule: FixtureRow[] = [];
  const N = divisionTeams.length;

  let teamIndices = Array.from({ length: N }, (_, i) => i);
  const totalRounds = N - 1;

  for (let round = 0; round < totalRounds; round++) {
    for (let i = 0; i < N / 2; i++) {
      const homeIdx = teamIndices[i];
      const awayIdx = teamIndices[N - 1 - i];

      const homeTeam = divisionTeams[homeIdx];
      const awayTeam = divisionTeams[awayIdx];

      let home = homeTeam;
      let away = awayTeam;
      if (i === 0 && round % 2 !== 0) {
        home = awayTeam;
        away = homeTeam;
      }

      matchSchedule.push({
        homeTeamId: home.id,
        awayTeamId: away.id,
        round: round + 1,
        division: divisionName,
        played: false,
      });

      matchSchedule.push({
        homeTeamId: away.id,
        awayTeamId: home.id,
        round: round + 1 + totalRounds,
        division: divisionName,
        played: false,
      });
    }

    const last = teamIndices.pop()!;
    teamIndices.splice(1, 0, last);
  }

  return matchSchedule;
}
