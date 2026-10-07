import React from 'react';
import { Crown, Trophy } from 'lucide-react';

export const Lottery7EarningsChart: React.FC = () => {
  const topRankList = [
    { rank: 4, name: 'Mr ***SHU', avatar: '4-FzE5GskB.png', amount: '₹85,150,240.00' },
    { rank: 5, name: 'TUY***454', avatar: '1-Cz2mt-nl.png', amount: '₹77,625,284.00' },
    { rank: 6, name: 'KB***892', avatar: '2-DzTtSgI1.png', amount: '₹58,312,244.00' },
    { rank: 7, name: 'Sou***Yio', avatar: '7-OCP1Ruci.png', amount: '₹52,480,554.00' },
    { rank: 8, name: 'Al***pa', avatar: '9-iOf3oyEz.png', amount: '₹41,010,554.00' },
    { rank: 9, name: 'JH***🐯', avatar: '5-BE1kalqa.png', amount: '₹38,010,324.00' },
    { rank: 10, name: 'Tan***🦁', avatar: '4-FzE5GskB.png', amount: '₹34,312,244.00' },
  ];

  return (
    <div className="l7-earnings-card">
      {/* Title */}
      <div className="flex items-center gap-1.5 pb-2 text-xs font-bold text-slate-800">
        <Trophy className="w-4 h-4 text-amber-500 fill-amber-500" />
        <span>Today's earnings chart</span>
      </div>

      {/* Top 3 Podium */}
      <div className="l7-podium-container">
        {/* 2nd Place Podium */}
        <div className="l7-podium-item second">
          <div className="l7-podium-avatar-wrapper">
            <img
              src="/assets/lottery7/1-Cz2mt-nl.png"
              alt="2nd"
              className="l7-podium-avatar"
            />
            <div className="l7-podium-badge">2</div>
          </div>
          <div className="l7-podium-name">Mem***1R8</div>
          <div className="l7-podium-amount">₹172,042,920.00</div>
        </div>

        {/* 1st Place Podium (Center, Elevated) */}
        <div className="l7-podium-item first -translate-y-2">
          <div className="l7-podium-avatar-wrapper">
            <Crown className="l7-podium-crown text-amber-400 fill-amber-400" />
            <img
              src="/assets/lottery7/1-Cz2mt-nl.png"
              alt="1st"
              className="l7-podium-avatar ring-2 ring-amber-400"
            />
            <div className="l7-podium-badge">1</div>
          </div>
          <div className="l7-podium-name font-bold">Jac***999</div>
          <div className="l7-podium-amount text-[11px] font-black">₹263,510,240.00</div>
        </div>

        {/* 3rd Place Podium */}
        <div className="l7-podium-item third">
          <div className="l7-podium-avatar-wrapper">
            <img
              src="/assets/lottery7/5-BE1kalqa.png"
              alt="3rd"
              className="l7-podium-avatar"
            />
            <div className="l7-podium-badge">3</div>
          </div>
          <div className="l7-podium-name">Mem***L2S</div>
          <div className="l7-podium-amount">₹95,602,920.00</div>
        </div>
      </div>

      {/* Ranks 4 to 10 List */}
      <div className="l7-ranks-list">
        {topRankList.map((item) => (
          <div key={item.rank} className="l7-rank-item">
            <div className="l7-rank-left">
              <span className="l7-rank-pos">{item.rank}</span>
              <img
                src={`/assets/lottery7/${item.avatar}`}
                alt={item.name}
                className="l7-rank-user-avatar"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/assets/lottery7/avatar-BTjdxpts.png';
                }}
              />
              <span className="l7-rank-user-name">{item.name}</span>
            </div>

            <div className="l7-rank-amount">{item.amount}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
