import { db } from '../db/index.js';
import { quests, questCompletions, users } from '../db/schema.js';
import { eq, and, sql, gte } from 'drizzle-orm';

export async function getQuestsForUser(userId: string) {
    // Get all active quests
    const allQuests = await db
        .select()
        .from(quests)
        .where(eq(quests.isActive, true));

    // Get user's completions
    const completions = await db
        .select()
        .from(questCompletions)
        .where(eq(questCompletions.userId, userId));

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Get the start of the current ISO week (Monday)
    const weekStart = new Date(todayStart);
    const dayOfWeek = weekStart.getDay();
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Adjust to Monday=0
    weekStart.setDate(weekStart.getDate() - diff);

    return allQuests.map((quest) => {
        let isClaimed = false;

        if (quest.questType === 'daily') {
            // Check if claimed today
            isClaimed = completions.some(
                (c) =>
                    c.questId === quest.id && c.completedAt >= todayStart
            );
        } else if (quest.questType === 'weekly') {
            // Check if claimed this week
            isClaimed = completions.some(
                (c) =>
                    c.questId === quest.id && c.completedAt >= weekStart
            );
        }

        return {
            id: quest.id,
            title: quest.title,
            description: quest.description,
            rewardType: quest.rewardType,
            rewardAmount: quest.rewardAmount,
            questType: quest.questType,
            actionUrl: quest.actionUrl,
            isClaimed,
        };
    });
}

export async function claimQuest(userId: string, questId: number) {
    // Verify quest exists and is active
    const [quest] = await db
        .select()
        .from(quests)
        .where(and(eq(quests.id, questId), eq(quests.isActive, true)));

    if (!quest) throw new Error('Quest not found or inactive');

    // Check if already claimed in the current period
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const weekStart = new Date(todayStart);
    const dayOfWeek = weekStart.getDay();
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    weekStart.setDate(weekStart.getDate() - diff);

    const periodStart = quest.questType === 'daily' ? todayStart : weekStart;

    const existingCompletion = await db
        .select()
        .from(questCompletions)
        .where(
            and(
                eq(questCompletions.userId, userId),
                eq(questCompletions.questId, questId),
                gte(questCompletions.completedAt, periodStart)
            )
        );

    if (existingCompletion.length > 0) {
        throw new Error('Quest already claimed for this period');
    }

    // Record completion
    await db.insert(questCompletions).values({
        userId,
        questId,
    });

    // Award reward
    if (quest.rewardType === 'warps') {
        await db
            .update(users)
            .set({
                balance: sql`${users.balance} + ${quest.rewardAmount}`,
                updatedAt: new Date(),
            })
            .where(eq(users.id, userId));
    } else if (quest.rewardType === 'spins') {
        await db
            .update(users)
            .set({
                freeSpins: sql`${users.freeSpins} + ${quest.rewardAmount}`,
                updatedAt: new Date(),
            })
            .where(eq(users.id, userId));
    }

    // Return updated user balance info
    const [updatedUser] = await db
        .select({ balance: users.balance, freeSpins: users.freeSpins })
        .from(users)
        .where(eq(users.id, userId));

    return {
        success: true,
        rewardType: quest.rewardType,
        rewardAmount: quest.rewardAmount,
        newBalance: Number(updatedUser.balance),
        newFreeSpins: updatedUser.freeSpins,
    };
}
