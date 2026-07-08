import { pgTable, serial, text, integer, boolean, timestamp, primaryKey, jsonb, doublePrecision } from "drizzle-orm/pg-core";
import type { AdapterAccountType } from "next-auth/adapters";

// --- AUTH.JS TABLES --- //

export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  password: text("password"), // Para login local
  teamId: integer("team_id"), // FK to teams (custom firmafoot field)
  role: text("role").default("user").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastActiveAt: timestamp("last_active_at").defaultNow().notNull(),
});

export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  })
);

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (verificationToken) => ({
    compositePk: primaryKey({
      columns: [verificationToken.identifier, verificationToken.token],
    }),
  })
);

export const authenticators = pgTable(
  "authenticator",
  {
    credentialID: text("credentialID").notNull().unique(),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    providerAccountId: text("providerAccountId").notNull(),
    credentialPublicKey: text("credentialPublicKey").notNull(),
    counter: integer("counter").notNull(),
    credentialDeviceType: text("credentialDeviceType").notNull(),
    credentialBackedUp: boolean("credentialBackedUp").notNull(),
    transports: text("transports"),
  },
  (authenticator) => ({
    compositePK: primaryKey({
      columns: [authenticator.userId, authenticator.credentialID],
    }),
  })
);

// --- FIRMAFOOT GAME TABLES --- //

export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  baseId: text("base_id").notNull(), // ex: 'fla', 'pal'
  name: text("name").notNull(),
  acronym: text("acronym").notNull(),
  reputation: integer("reputation").notNull(),
  balance: integer("balance").notNull(), // saldo
  logoUrl: text("logo_url"),
  primaryColor: text("primary_color"),
  secondaryColor: text("secondary_color"),
  stadium: text("stadium"),
  capacity: integer("capacity"),
  isSaf: boolean("is_saf").default(false),
  userId: text("user_id").references(() => users.id), // if human controlled
  formation: text("formation").notNull().default("4-4-2"),
  trainingFocus: text("training_focus").notNull().default("tecnico"), // 'fisico' | 'tatico' | 'tecnico' | 'descanso'
  boardConfidence: integer("board_confidence").notNull().default(70),
  ticketPrice: integer("ticket_price").notNull().default(30),
  debt: integer("debt").notNull().default(0),
  safModel: text("saf_model"), // null | 'textor' | 'city' | 'minoritaria'
  tacticalBonus: integer("tactical_bonus").notNull().default(0),
  seasonExpectation: text("season_expectation"), // ex: 'libertadores', 'g6', 'permanencia'
});

export const players = pgTable("players", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").references(() => teams.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  age: integer("age").notNull(),
  position: text("position").notNull(),
  secondaryPosition: text("secondary_position"),
  strength: integer("strength").notNull(),
  characteristic: text("characteristic"),
  value: integer("value").notNull(),
  salary: integer("salary").notNull(),
  fitness: integer("fitness").notNull().default(100),
  yellowCards: integer("yellow_cards").notNull().default(0),
  redCard: boolean("red_card").notNull().default(false),
  goals: integer("goals").notNull().default(0),
  assists: integer("assists").notNull().default(0),
  isInjured: boolean("is_injured").notNull().default(false),
  injuryTime: integer("injury_time").notNull().default(0),
  morale: integer("morale").notNull().default(100),
  loanFromTeamId: integer("loan_from_team_id").references(() => teams.id),
  loanRoundsLeft: integer("loan_rounds_left"),
  originalSalary: integer("original_salary"),
  transferListed: boolean("transfer_listed").notNull().default(false),
  conversationCooldown: integer("conversation_cooldown").notNull().default(0),
  matchesPlayed: integer("matches_played").notNull().default(0),
});

export const matches = pgTable("matches", {
  id: serial("id").primaryKey(),
  homeTeamId: integer("home_team_id").references(() => teams.id, { onDelete: "cascade" }).notNull(),
  awayTeamId: integer("away_team_id").references(() => teams.id, { onDelete: "cascade" }).notNull(),
  homeScore: integer("home_score"),
  awayScore: integer("away_score"),
  round: integer("round").notNull(),
  division: text("division").notNull(), // 'A' ou 'B'
  played: boolean("played").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  events: jsonb("events"), // timeline minuto a minuto gerado pelo motor de partida
  attendance: integer("attendance"),
  revenue: integer("revenue"),
});

export const standings = pgTable("standings", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").references(() => teams.id, { onDelete: "cascade" }).notNull(),
  division: text("division").notNull(),
  points: integer("points").notNull().default(0),
  played: integer("played").notNull().default(0),
  won: integer("won").notNull().default(0),
  drawn: integer("drawn").notNull().default(0),
  lost: integer("lost").notNull().default(0),
  goalsFor: integer("goals_for").notNull().default(0),
  goalsAgainst: integer("goals_against").notNull().default(0),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  userId: text("user_id").references(() => users.id).notNull(),
  sender: text("sender").notNull(),
  subject: text("subject").notNull(),
  content: text("content").notNull(),
  date: timestamp("date").defaultNow().notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  actionType: text("action_type"), // null | 'sponsor_offer' | 'transfer_offer' | 'job_offer' | 'fired'
  actionData: jsonb("action_data"),
  mandatory: boolean("mandatory").notNull().default(false),
  actionDone: boolean("action_done").notNull().default(false),
});

// --- RELÓGIO GLOBAL DA LIGA (singleton: sempre 1 linha) --- //

export const league = pgTable("league", {
  id: serial("id").primaryKey(),
  seasonYear: integer("season_year").notNull(),
  currentRound: integer("current_round").notNull().default(1),
  phase: text("phase").notNull().default("in_season"), // 'in_season' | 'processing' | 'off_season'
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Parâmetros numéricos do simulador (limiares, taxas, chances) editáveis no Admin sem
// precisar de deploy. Ver src/lib/game/config.ts para o helper de leitura (com cache)
// e src/db/seed-catalogs.ts para os valores padrão.
export const gameConfig = pgTable("game_config", {
  key: text("key").primaryKey(),
  value: doublePrecision("value").notNull(),
  label: text("label").notNull(),
  description: text("description"),
});

// --- CATÁLOGOS EDITÁVEIS NO ADMIN --- //

export const sponsors = pgTable("sponsors", {
  id: serial("id").primaryKey(),
  slot: text("slot").notNull(), // 'master' | 'material' | 'mangas' | 'costas' | 'calcao'
  name: text("name").notNull(),
  baseValue: integer("base_value").notNull(),
  royaltyPct: integer("royalty_pct").notNull().default(0), // % sobre receita de bilheteria (patrocínio master)
  goalType: text("goal_type").notNull().default("none"), // 'none' | 'clean_sheet' | 'three_goals' | 'win'
  bonusValue: integer("bonus_value").notNull().default(0), // pago quando a meta de rodada é cumprida
  minReputation: integer("min_reputation").notNull().default(0),
  active: boolean("active").notNull().default(true),
});

export const teamSponsors = pgTable("team_sponsors", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").references(() => teams.id, { onDelete: "cascade" }).notNull(),
  sponsorId: integer("sponsor_id").references(() => sponsors.id, { onDelete: "cascade" }).notNull(),
  slot: text("slot").notNull(),
  signedRound: integer("signed_round").notNull(),
});

export const conversationTypes = pgTable("conversation_types", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(), // 'elogiar' | 'cobrar' | 'folga'
  label: text("label").notNull(),
  description: text("description"),
  moraleEffect: integer("morale_effect").notNull().default(0), // efeito principal (ou em caso de sucesso)
  moraleEffectAlt: integer("morale_effect_alt"), // efeito alternativo (ex: "cobrar" pode motivar OU chatear)
  fitnessEffect: integer("fitness_effect").notNull().default(0),
  successChance: integer("success_chance").notNull().default(100), // 0-100
  cooldownRounds: integer("cooldown_rounds").notNull().default(3),
});

// --- MERCADO DE TRANSFERÊNCIAS --- //

export const transferOffers = pgTable("transfer_offers", {
  id: serial("id").primaryKey(),
  fromTeamId: integer("from_team_id").references(() => teams.id, { onDelete: "cascade" }).notNull(),
  toTeamId: integer("to_team_id").references(() => teams.id, { onDelete: "cascade" }).notNull(),
  playerId: integer("player_id").references(() => players.id, { onDelete: "cascade" }).notNull(),
  type: text("type").notNull(), // 'buy' | 'loan'
  feeValue: integer("fee_value").notNull().default(0),
  salaryPct: integer("salary_pct").notNull().default(100),
  loanRounds: integer("loan_rounds"), // null = até o fim da temporada
  status: text("status").notNull().default("pending"), // 'pending' | 'accepted' | 'rejected' | 'countered'
  round: integer("round").notNull(),
});

// --- HISTÓRICO --- //

export const championsHistory = pgTable("champions_history", {
  id: serial("id").primaryKey(),
  year: integer("year").notNull(),
  division: text("division").notNull(),
  teamId: integer("team_id").references(() => teams.id, { onDelete: "cascade" }).notNull(),
});
