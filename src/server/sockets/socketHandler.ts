import { Server, Socket } from 'socket.io';
import { winGoManager } from '../games/win-go/WinGoRoundManager.ts';
import { aviatorManager } from '../games/aviator/AviatorRoundManager.ts';
import { WalletService } from '../wallet/WalletService.ts';
import {
  WinGoBetSchema,
  AviatorBetSchema,
  AviatorCashOutSchema,
} from '../validation/schemas.ts';

export function setupSocketIO(io: Server) {
  // Wire up broadcasters from both game managers
  const broadcastHandler = (event: string, data: any, targetUser?: string) => {
    if (targetUser) {
      io.to(`user:${targetUser}`).emit(event, data);
    } else {
      io.emit(event, data);
    }
  };

  winGoManager.setBroadcaster(broadcastHandler);
  aviatorManager.setBroadcaster(broadcastHandler);

  io.on('connection', (socket: Socket) => {
    let currentAccountId: string | null = null;

    socket.emit('connection:ready', {
      serverTime: Date.now(),
      socketId: socket.id,
    });

    // Authenticate / register user socket
    socket.on('auth:identify', async (payload: { accountId: string }, ack?: (res: any) => void) => {
      try {
        if (!payload?.accountId) {
          if (ack) ack({ success: false, error: 'Account ID required' });
          return;
        }

        currentAccountId = payload.accountId;
        socket.join(`user:${currentAccountId}`);

        const account = await WalletService.getOrCreateAccount(currentAccountId);

        const responseData = {
          success: true,
          account,
          winGoState: winGoManager.getState(),
          aviatorState: aviatorManager.getState(),
        };

        if (ack) ack(responseData);

        // Send full sync
        socket.emit('sync:full', responseData);
      } catch (err: any) {
        if (ack) ack({ success: false, error: err.message });
      }
    });

    // Request fresh states for reconnection
    socket.on('game:sync:request', async (_, ack?: (res: any) => void) => {
      const state = {
        winGoState: winGoManager.getState(),
        aviatorState: aviatorManager.getState(),
        serverTime: Date.now(),
      };
      if (ack) ack({ success: true, ...state });
      socket.emit('sync:refresh', state);
    });

    // --- WIN GO BETTING ---
    socket.on('wingo:bet:place', async (data: unknown, ack?: (res: any) => void) => {
      try {
        const parsed = WinGoBetSchema.safeParse(data);
        if (!parsed.success) {
          const errMsg = parsed.error.issues[0]?.message || 'Invalid bet payload';
          if (ack) ack({ success: false, error: errMsg });
          socket.emit('bet:rejected', { game: 'WIN_GO', error: errMsg });
          return;
        }

        const result = await winGoManager.placeBet(parsed.data as any);
        if (!result.success) {
          if (ack) ack({ success: false, error: result.error });
          socket.emit('bet:rejected', { game: 'WIN_GO', error: result.error });
          return;
        }

        const successPayload = {
          success: true,
          game: 'WIN_GO',
          bet: result.bet,
          newBalance: result.newBalance,
        };

        if (ack) ack(successPayload);
        socket.emit('bet:accepted', successPayload);
      } catch (err: any) {
        const errMsg = err.message || 'Internal server error while placing Win Go bet';
        if (ack) ack({ success: false, error: errMsg });
        socket.emit('bet:rejected', { game: 'WIN_GO', error: errMsg });
      }
    });

    // --- AVIATOR BETTING ---
    socket.on('aviator:bet:place', async (data: unknown, ack?: (res: any) => void) => {
      try {
        const parsed = AviatorBetSchema.safeParse(data);
        if (!parsed.success) {
          const errMsg = parsed.error.issues[0]?.message || 'Invalid Aviator bet payload';
          if (ack) ack({ success: false, error: errMsg });
          socket.emit('bet:rejected', { game: 'AVIATOR', error: errMsg });
          return;
        }

        const result = await aviatorManager.placeBet(parsed.data as any);
        if (!result.success) {
          if (ack) ack({ success: false, error: result.error });
          socket.emit('bet:rejected', { game: 'AVIATOR', error: result.error });
          return;
        }

        const successPayload = {
          success: true,
          game: 'AVIATOR',
          bet: result.bet,
          newBalance: result.newBalance,
        };

        if (ack) ack(successPayload);
        socket.emit('bet:accepted', successPayload);
      } catch (err: any) {
        const errMsg = err.message || 'Internal server error while placing Aviator bet';
        if (ack) ack({ success: false, error: errMsg });
        socket.emit('bet:rejected', { game: 'AVIATOR', error: errMsg });
      }
    });

    // --- AVIATOR CASH OUT ---
    socket.on('aviator:cashout', async (data: unknown, ack?: (res: any) => void) => {
      try {
        const parsed = AviatorCashOutSchema.safeParse(data);
        if (!parsed.success) {
          const errMsg = parsed.error.issues[0]?.message || 'Invalid Cash Out payload';
          if (ack) ack({ success: false, error: errMsg });
          socket.emit('aviator:cashout:rejected', { error: errMsg });
          return;
        }

        const result = await aviatorManager.cashOutBet(
          parsed.data.accountId,
          parsed.data.betId,
          parsed.data.requestedMultiplier
        );

        if (!result.success) {
          if (ack) ack({ success: false, error: result.error });
          socket.emit('aviator:cashout:rejected', {
            betId: parsed.data.betId,
            error: result.error,
          });
          return;
        }

        const successPayload = {
          success: true,
          betId: parsed.data.betId,
          multiplier: result.multiplier,
          payoutAmount: result.payoutAmount,
          newBalance: result.newBalance,
        };

        if (ack) ack(successPayload);
        socket.emit('aviator:cashout:success', successPayload);
      } catch (err: any) {
        const errMsg = err.message || 'Internal error during cash out';
        if (ack) ack({ success: false, error: errMsg });
        socket.emit('aviator:cashout:rejected', {
          error: errMsg,
        });
      }
    });

    socket.on('disconnect', () => {
      if (currentAccountId) {
        socket.leave(`user:${currentAccountId}`);
      }
    });
  });
}
