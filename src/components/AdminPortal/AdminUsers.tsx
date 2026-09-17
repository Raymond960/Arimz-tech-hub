import React, { useState, useEffect } from 'react';
import {
  Users2,
  Radio,
  RefreshCw,
  Smartphone,
  Laptop,
  Tablet,
  Clock,
  Activity,
  Search,
  ShieldCheck
} from 'lucide-react';
import { UserSessionRecord } from '../../types';

interface AdminUsersProps {
  sessions: UserSessionRecord[];
  activeCount: number;
  onRefresh: () => void;
}

export const AdminUsers: React.FC<AdminUsersProps> = ({
  sessions,
  activeCount,
  onRefresh
}) => {
  const [search, setSearch] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active'>('all');

  const filteredSessions = sessions.filter((s) => {
    const matchesSearch = s.sessionId.toLowerCase().includes(search.toLowerCase()) || s.currentPage.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filterActive === 'all' || s.isActive;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#08254D] border border-white/12 rounded-3xl p-5 text-white">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 px-2.5 py-1 rounded-full inline-flex items-center gap-1.5">
              <Radio className="w-3 h-3 animate-pulse" />
              <span>Real-time Telemetry Engine</span>
            </span>
          </div>
          <h2 className="text-lg font-black text-white font-brand-sans mt-1 flex items-center gap-2">
            <span>Visitor Sessions & Active Users</span>
          </h2>
          <p className="text-xs text-[#9BAABD]">
            Privacy-first anonymous telemetry: tracking active journeys without collecting personal IP addresses.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-[#04142F] border border-emerald-500/30 px-3.5 py-1.5 rounded-2xl flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-xs font-black text-emerald-300">
              {activeCount} Users Online
            </span>
          </div>

          <button
            onClick={onRefresh}
            className="p-2 bg-white/10 hover:bg-white/15 border border-white/14 rounded-2xl text-white transition cursor-pointer"
            title="Refresh active telemetry"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#9BAABD] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search anonymous sessions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#08254D] border border-white/14 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-[#9BAABD] outline-none focus:border-[#FFC928]"
          />
        </div>

        <div className="flex bg-[#08254D] p-1 rounded-2xl border border-white/12 text-xs">
          <button
            onClick={() => setFilterActive('all')}
            className={`px-3.5 py-1.5 rounded-xl font-semibold transition cursor-pointer ${
              filterActive === 'all' ? 'bg-[#FFC928] text-[#04142F]' : 'text-[#9BAABD] hover:text-white'
            }`}
          >
            All Sessions ({sessions.length})
          </button>
          <button
            onClick={() => setFilterActive('active')}
            className={`px-3.5 py-1.5 rounded-xl font-semibold transition cursor-pointer ${
              filterActive === 'active' ? 'bg-[#FFC928] text-[#04142F]' : 'text-[#9BAABD] hover:text-white'
            }`}
          >
            Active Online ({activeCount})
          </button>
        </div>
      </div>

      {/* Session Table */}
      <div className="bg-[#08254D] border border-white/12 rounded-3xl overflow-hidden shadow-xl text-white">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#04142F] text-[#9BAABD] uppercase tracking-wider text-[10px] border-b border-white/10">
              <tr>
                <th className="py-3.5 px-4">Anonymous Session</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Current Page</th>
                <th className="py-3.5 px-4">Device & Browser</th>
                <th className="py-3.5 px-4">Page Views</th>
                <th className="py-3.5 px-4 text-right">Last Seen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/8">
              {filteredSessions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#9BAABD]">
                    No sessions registered yet.
                  </td>
                </tr>
              ) : (
                filteredSessions.map((sess) => {
                  const secondsAgo = Math.floor((Date.now() - sess.lastSeen) / 1000);
                  const isOnline = secondsAgo < 90;

                  return (
                    <tr key={sess.sessionId} className="hover:bg-white/4 transition">
                      <td className="py-3.5 px-4 font-mono text-[11px] text-[#FFC928]">
                        {sess.sessionId.slice(0, 16)}...
                      </td>

                      <td className="py-3.5 px-4">
                        {isOnline ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold text-[10px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                            <span>ONLINE</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/10 border border-white/14 text-[#9BAABD] text-[10px]">
                            <span>IDLE</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-white font-medium">
                        {sess.currentPage || '/'}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          {sess.deviceCategory === 'mobile' ? (
                            <Smartphone className="w-3.5 h-3.5 text-sky-400" />
                          ) : sess.deviceCategory === 'tablet' ? (
                            <Tablet className="w-3.5 h-3.5 text-purple-400" />
                          ) : (
                            <Laptop className="w-3.5 h-3.5 text-indigo-400" />
                          )}
                          <span className="text-[#D5DCE8]">{sess.browser || 'Browser'}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-white font-bold">
                        {sess.pageViewsCount || 1} views
                      </td>

                      <td className="py-3.5 px-4 text-right text-[#9BAABD] text-[11px]">
                        {secondsAgo < 60 ? `${secondsAgo}s ago` : `${Math.floor(secondsAgo / 60)}m ago`}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
