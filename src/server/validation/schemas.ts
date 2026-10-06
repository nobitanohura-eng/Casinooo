import { z } from 'zod';

export const WinGoBetSchema = z.object({
  accountId: z.string().min(1, 'Account ID is required'),
  roundId: z.string().min(1, 'Round ID is required'),
  selectionType: z.enum(['COLOR', 'NUMBER', 'SIZE']),
  selectionValue: z.string().min(1, 'Selection value is required'),
  stakeAmount: z.number().positive('Stake amount must be strictly greater than 0').max(50000, 'Max single stake is 50,000'),
  idempotencyKey: z.string().min(1, 'Idempotency key is required'),
});

export const AviatorBetSchema = z.object({
  accountId: z.string().min(1, 'Account ID is required'),
  roundId: z.string().min(1, 'Round ID is required'),
  stakeAmount: z.number().positive('Stake amount must be strictly greater than 0').max(50000, 'Max single stake is 50,000'),
  autoCashoutMultiplier: z.number().min(1.01).max(1000).nullable().optional(),
  idempotencyKey: z.string().min(1, 'Idempotency key is required'),
});

export const AviatorCashOutSchema = z.object({
  accountId: z.string().min(1, 'Account ID is required'),
  betId: z.string().min(1, 'Bet ID is required'),
  requestedMultiplier: z.number().positive().optional(),
});

export const TopUpSchema = z.object({
  accountId: z.string().min(1, 'Account ID is required'),
  amount: z.number().min(1, 'Min topup is 1 credit').max(10000, 'Max single topup is 10,000 credits'),
  idempotencyKey: z.string().min(1, 'Idempotency key is required'),
});
