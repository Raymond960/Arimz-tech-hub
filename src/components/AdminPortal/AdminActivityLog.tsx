import React, { useState } from 'react';
import { History, Search, ShieldCheck, Download, Filter, Clock } from 'lucide-react';
import { AuditLogRecord } from '../../types';

interface AdminActivityLogProps {
  logs: AuditLogRecord[];
}

export const AdminActivityLog: React.FC<AdminActivityLogProps> = ({ logs }) => {
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.resource.toLowerCase().includes(search.toLowerCase()) ||
      log.details.toLowerCase().includes(search.toLowerCase()) ||
      log.adminEmail.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = actionFilter === 'all' || log.action.includes(actionFilter);
    return matchesSearch && matchesFilter;
  });

  const handleExportCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'ID,Action,Resource,Details,Admin,Timestamp,DateStr\n' +
      filteredLogs
        .map(
          (l) =>
            `"${l.id}","${l.action}","${l.resource}","${l.details.replace(/"/g, '""')}","${l.adminEmail}",${l.timestamp},"${l.dateStr}"`
        )
        .join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `shendam_audit_logs_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#08254D] border border-white/12 rounded-3xl p-5 text-white">
        <div>
          <h2 className="text-lg font-black text-white font-brand-sans flex items-center gap-2">
            <History className="w-5 h-5 text-emerald-400" />
            <span>Administrative Audit Log ({logs.length})</span>
          </h2>
          <p className="text-xs text-[#9BAABD]">
            Immutable record of all administrator sessions, directory edits, booking updates, and broadcast alerts.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 bg-white/10 hover:bg-white/15 border border-white/14 px-3.5 py-2 rounded-2xl text-xs font-bold text-white transition cursor-pointer self-start sm:self-auto"
        >
          <Download className="w-4 h-4" />
          <span>Export Audit Log</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#9BAABD] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search audit trail by keyword, admin, or action..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#08254D] border border-white/14 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-[#9BAABD] outline-none focus:border-[#FFC928]"
          />
        </div>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="bg-[#08254D] border border-white/14 rounded-2xl px-4 py-2.5 text-xs text-white outline-none focus:border-[#FFC928]"
        >
          <option value="all">All Event Types</option>
          <option value="LOGIN">Auth & Sessions</option>
          <option value="BOOKING">Booking Actions</option>
          <option value="PLACE">Directory Places</option>
          <option value="BROADCAST">Alerts & Broadcasts</option>
          <option value="SETTINGS">Settings</option>
        </select>
      </div>

      {/* Logs Table */}
      <div className="bg-[#08254D] border border-white/12 rounded-3xl overflow-hidden shadow-xl text-white">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#04142F] text-[#9BAABD] uppercase tracking-wider text-[10px] border-b border-white/10">
              <tr>
                <th className="py-3.5 px-4">Action Type</th>
                <th className="py-3.5 px-4">Target Resource</th>
                <th className="py-3.5 px-4">Details</th>
                <th className="py-3.5 px-4">Admin Identity</th>
                <th className="py-3.5 px-4 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/8">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[#9BAABD]">
                    No audit records matching search filter.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((item) => (
                  <tr key={item.id} className="hover:bg-white/4 transition">
                    <td className="py-3.5 px-4">
                      <span className="font-mono text-[10px] font-bold text-[#FFC928] bg-[#FFC928]/10 px-2 py-0.5 rounded border border-[#FFC928]/20">
                        {item.action}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-bold text-white">
                      {item.resource}
                    </td>

                    <td className="py-3.5 px-4 text-[#D5DCE8] max-w-sm">
                      {item.details}
                    </td>

                    <td className="py-3.5 px-4 text-[#9BAABD] text-[11px]">
                      {item.adminEmail}
                    </td>

                    <td className="py-3.5 px-4 text-right text-[#9BAABD] text-[11px] whitespace-nowrap">
                      {item.dateStr}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
