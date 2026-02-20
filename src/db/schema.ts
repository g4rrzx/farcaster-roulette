import {
    pgTable,
    text,
    integer,
    boolean,
    timestamp,
    serial,
    numeric,
    uniqueIndex,
} from 'drizzle-orm/pg-core';

// ─── Users Table (Better Auth core + custom game fields) ────────────────────
export const users = pgTable('users', {
    // Better Auth core columns
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull(),
    emailVerified: boolean('email_verified').notNull().default(false),
    image: text('image'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),

    // Custom game columns
    fid: integer('fid').unique(),
    walletAddress: text('wallet_address'),
    balance: integer('balance').notNull().default(1000),
    level: integer('level').notNull().default(1),
    totalWins: integer('total_wins').notNull().default(0),
    totalLosses: integer('total_losses').notNull().default(0),
    totalSpins: integer('total_spins').notNull().default(0),
    freeSpins: integer('free_spins').notNull().default(0),
});

// ─── Sessions Table (Better Auth) ───────────────────────────────────────────
export const sessions = pgTable('sessions', {
    id: text('id').primaryKey(),
    expiresAt: timestamp('expires_at').notNull(),
    token: text('token').notNull().unique(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
});

// ─── Accounts Table (Better Auth) ───────────────────────────────────────────
export const accounts = pgTable('accounts', {
    id: text('id').primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at'),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
    scope: text('scope'),
    password: text('password'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ─── Verification Table (Better Auth) ───────────────────────────────────────
export const verifications = pgTable('verifications', {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

// ─── Spins Table ────────────────────────────────────────────────────────────
export const spins = pgTable('spins', {
    id: serial('id').primaryKey(),
    userId: text('user_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
    betAmount: integer('bet_amount').notNull(),
    multiplier: numeric('multiplier', { precision: 4, scale: 2 }).notNull(),
    result: text('result').notNull(), // 'win' | 'loss' | 'jackpot'
    payout: numeric('payout', { precision: 10, scale: 2 }).notNull(),
    txHash: text('tx_hash').unique(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ─── Quests Table ───────────────────────────────────────────────────────────
export const quests = pgTable('quests', {
    id: serial('id').primaryKey(),
    title: text('title').notNull(),
    description: text('description'),
    rewardType: text('reward_type').notNull(), // 'spins' | 'warps'
    rewardAmount: integer('reward_amount').notNull(),
    questType: text('quest_type').notNull(), // 'daily' | 'weekly'
    actionUrl: text('action_url'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ─── Quest Completions Table ────────────────────────────────────────────────
export const questCompletions = pgTable(
    'quest_completions',
    {
        id: serial('id').primaryKey(),
        userId: text('user_id')
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        questId: integer('quest_id')
            .notNull()
            .references(() => quests.id, { onDelete: 'cascade' }),
        completedAt: timestamp('completed_at').notNull().defaultNow(),
    },
    (table) => [
        uniqueIndex('quest_user_date_idx').on(table.userId, table.questId),
    ]
);
