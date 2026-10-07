import React, { useState, useEffect } from 'react';
import { Trophy } from 'lucide-react';

interface WinnerItem {
  id: string;
  game: string;
  user: string;
  amount: number;
}

export const Lottery7WinningFeed: React.FC = () => {
  const [winners, setWinners] = useState<WinnerItem[]>([
    { id: '1', game: 'Moto Racing', user: 'Mem***CHE', amount: 24.00 },
    { id: '2', game: '5D 1 min', user: 'Mem***WNX', amount: 24.00 },
    { id: '3', game: 'Moto Racing', user: 'Mem***QBQ', amount: 18.82 },
    { id: '4', game: 'Win Go 1Min', user: 'Mem***VTL', amount: 94.00 },
    { id: '5', game: 'Moto Racing', user: 'Mem***HGI', amount: 144.00 },
    { id: '6', game: 'Spribe Aviator', user: 'Mem***VGE', amount: 392.00 },
    { id: '7', game: 'Moto Racing', user: 'Mem***PFS', amount: 94.00 },
    { id: '8', game: 'Win Go 1Min', user: 'Mem***GBQ', amount: 392.00 },
    { id: '9', game: 'Moto Racing', user: 'Mem***MQA', amount: 18.12 },
    { id: '10', game: '5D 1 min', user: 'Mem***GOZ', amount: 94.24 },
  ]);

  // Periodic simulated live winner feed
  useEffect(() => {
    const interval = setInterval(() => {
      const games = ['Win Go 1Min', 'Spribe Aviator', 'Moto Racing', '5D 1 min', 'K3 Lotre'];
      const randomGame = games[Math.floor(Math.random() * games.length)];
      const randomUser = `Mem***${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
      const randomAmount = (Math.random() * 400 + 10).toFixed(2);

      const newWinner: WinnerItem = {
        id: String(Date.now()),
        game: randomGame,
        user: randomUser,
        amount: parseFloat(randomAmount),
      };

      setWinners((prev) => [newWinner, ...prev.slice(0, 9)]);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="l7-winning-card">
      {/* Title */}
      <div className="flex items-center gap-1.5 pb-2 mb-2 text-xs font-bold text-slate-800">
        <Trophy className="w-4 h-4 text-rose-500 fill-rose-500" />
        <span>Winning information</span>
      </div>

      {/* Table Header */}
      <div className="l7-table-header">
        <span>Game</span>
        <span>User</span>
        <span className="text-right">Winning amount</span>
      </div>

      {/* Table Rows */}
      <div className="space-y-0.5 mt-1">
        {winners.map((item) => (
          <div key={item.id} className="l7-table-row">
            <div className="l7-table-game">
              <span className="l7-game-tag-icon">●</span>
              <span className="truncate">{item.game}</span>
            </div>

            <div className="l7-table-user">{item.user}</div>

            <div className="l7-table-amount">₹{item.amount.toFixed(2)}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
