// Barrel de compatibilidade: os componentes importam de "@/app/actions" (sem apontar
// para um arquivo específico). Manter esse index.ts permite que a resolução de módulo
// do Next.js/TS trate "@/app/actions" como este diretório sem precisar tocar nenhum
// import existente. Novas actions de domínios futuros (mercado, finanças, treino, rodada,
// admin) devem virar um novo arquivo aqui e ser reexportadas abaixo.
export * from "./auth";
export * from "./inbox";
export * from "./teams";
export * from "./standings";
export * from "./tactics";
export * from "./admin";
export * from "./round";
export * from "./dashboard";
export * from "./matches";
export * from "./training";
export * from "./players";
export * from "./market";
export * from "./finances";
export * from "./board";
export * from "./leaderboard";
