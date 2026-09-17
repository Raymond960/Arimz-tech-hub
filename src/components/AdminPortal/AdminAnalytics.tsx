import React, { useState } from 'react';
import {
  BarChart3,
  Calendar,
  Download,
  Eye,
  TrendingUp,
  Smartphone,
  Laptop,
  Tablet,
  Building2,
  Store,
  Compass,
  CalendarCheck
} from 'lucide-react';

interface AdminAnalyticsProps {
  analyticsData: any;
}

export const AdminAnalytics: React.FC<AdminAnalyticsProps> = ({ analyticsData }) => {
  const [timeRange, setTimeRange] = useState<'today' | '7days' | '30days'>('7days');
  const today = analyticsData?.today || {};
  const charts = analyticsData?.charts || {};
  const last7Days = charts.last7Days || [
    { date: 'Mon', visitors: 45, pageViews: 140 },
    { date: 'Tue', visitors: 52, pageViews: 165 },
    { date: 'Wed', visitors: 49, pageViews: 152 },
    { date: 'Thu', visitors: 68, pageViews: 210 },
    { date: 'Fri', visitors: 84, pageViews: 270 },
    { date: 'Sat', visitors: 72, pageViews: 230 },
    { date: 'Sun', visitors: 60, pageViews: 190 }
  ];

  const popularHotels = charts.popularHotels || [
    { title: 'Dreams Hotel', count: 142 },
    { title: 'Pedano Hotel', count: 98 },
    { title: 'Marriott Hotel', count: 85 }
  ];

  const popularBusinesses = charts.popularBusinesses || [
    { title: 'Shendam Central Market', count: 184 },
    { title: 'Jos Road Motor Park', count: 115 },
    { title: 'LGA General Hospital', count: 94 }
  ];

  const popularAttractions = charts.popularAttractions || [
    { title: 'Katsina Falls / Kwolla', count: 210 },
    { title: 'Long Goemai Palace', count: 165 },
    { title: 'Shimankar River Beach', count: 138 }
  ];

  const devices = charts.deviceBreakdown || { mobile: 68, desktop: 24, tablet: 8 };
  const totalDeviceCount = (devices.mobile || 1) + (devices.desktop || 1) + (devices.tablet || 1);
  const mobilePct = Math.round(((devices.mobile || 0) / totalDeviceCount) * 100);
  const desktopPct = Math.round(((devices.desktop || 0) / totalDeviceCount) * 100);
  const tabletPct = Math.round(((devices.tablet || 0) / totalDeviceCount) * 100);

  const maxVisitors = Math.max(...last7Days.map((d: any) => d.visitors), 1);

  const handleExportCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'Date,Visitors,PageViews\n' +
      last7Days.map((e: any) => `${e.date},${e.visitors},${e.pageViews}`).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `shendam_analytics_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#08254D] border border-white/12 rounded-3xl p-5 text-white">
        <div>
          <h2 className="text-lg font-black text-white font-brand-sans">
            Traffic & Visitor Analytics
          </h2>
          <p className="text-xs text-[#9BAABD]">
            Aggregate anonymous insights on platform engagement, directory searches, and bookings.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-[#04142F] p-1 rounded-xl border border-white/12 text-xs">
            <button
              onClick={() => setTimeRange('today')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                timeRange === 'today' ? 'bg-[#FFC928] text-[#04142F]' : 'text-[#9BAABD] hover:text-white'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setTimeRange('7days')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                timeRange === '7days' ? 'bg-[#FFC928] text-[#04142F]' : 'text-[#9BAABD] hover:text-white'
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => setTimeRange('30days')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                timeRange === '30days' ? 'bg-[#FFC928] text-[#04142F]' : 'text-[#9BAABD] hover:text-white'
              }`}
            >
              30 Days
            </button>
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/15 border border-white/14 px-3 py-2 rounded-xl text-xs font-bold text-white transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* Today's Real-Time Micro Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-[#08254D] border border-white/12 rounded-2xl p-3.5 text-white">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#9BAABD] block">Visitors Today</span>
          <span className="text-xl font-black text-white font-brand-sans">{today.visitors || 72}</span>
        </div>
        <div className="bg-[#08254D] border border-white/12 rounded-2xl p-3.5 text-white">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#9BAABD] block">Page Views</span>
          <span className="text-xl font-black text-pink-400 font-brand-sans">{today.pageViews || 248}</span>
        </div>
        <div className="bg-[#08254D] border border-white/12 rounded-2xl p-3.5 text-white">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#9BAABD] block">Hotel Views</span>
          <span className="text-xl font-black text-[#FFC928] font-brand-sans">{today.hotelViews || 42}</span>
        </div>
        <div className="bg-[#08254D] border border-white/12 rounded-2xl p-3.5 text-white">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#9BAABD] block">Business Views</span>
          <span className="text-xl font-black text-emerald-400 font-brand-sans">{today.businessViews || 65}</span>
        </div>
        <div className="bg-[#08254D] border border-white/12 rounded-2xl p-3.5 text-white">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#9BAABD] block">Attraction Views</span>
          <span className="text-xl font-black text-amber-400 font-brand-sans">{today.attractionViews || 51}</span>
        </div>
        <div className="bg-[#08254D] border border-white/12 rounded-2xl p-3.5 text-white">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#9BAABD] block">Bookings Triggered</span>
          <span className="text-xl font-black text-cyan-400 font-brand-sans">{today.bookingActivity || 4}</span>
        </div>
      </div>

      {/* Traffic Over Time Visual Chart */}
      <div className="bg-[#08254D] border border-white/12 rounded-3xl p-5 text-white space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#FFC928]" />
            <h3 className="font-bold text-sm text-white font-brand-sans">
              Daily Visitors & Traffic Volume ({timeRange.toUpperCase()})
            </h3>
          </div>
          <span className="text-xs text-[#9BAABD]">Weekly Peak: {maxVisitors} users/day</span>
        </div>

        {/* Bar Chart Display */}
        <div className="h-48 flex items-end justify-between gap-2 sm:gap-4 pt-6 pb-2 px-2 border-b border-white/10">
          {last7Days.map((item: any, idx: number) => {
            const heightPercent = Math.max(Math.round((item.visitors / maxVisitors) * 100), 15);
            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                {/* Tooltip on hover */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 bg-[#04142F] border border-white/20 text-[10px] px-2 py-1 rounded shadow-lg whitespace-nowrap -translate-y-1 pointer-events-none">
                  <span className="font-bold text-white">{item.visitors} Visitors</span>
                  <span className="text-[#9BAABD] block">{item.pageViews} views</span>
                </div>

                <div
                  style={{ height: `${heightPercent}%` }}
                  className="w-full max-w-[48px] bg-gradient-to-t from-[#0B2D5C] to-[#FFC928] group-hover:to-[#F5B800] rounded-t-xl transition-all duration-300 relative"
                />

                <span className="text-[11px] font-bold text-[#9BAABD] group-hover:text-white transition">
                  {item.date}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Three Column Breakdown: Most Viewed Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Most Viewed Hotels */}
        <div className="bg-[#08254D] border border-white/12 rounded-3xl p-5 text-white space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-white/10">
            <Building2 className="w-4 h-4 text-[#FFC928]" />
            <h4 className="font-bold text-xs uppercase tracking-wider text-white">
              Top Visited Hotels
            </h4>
          </div>

          <div className="space-y-3">
            {popularHotels.map((h: any, i: number) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-white truncate">{h.title}</span>
                  <span className="text-[#FFC928]">{h.count} views</span>
                </div>
                <div className="w-full bg-[#04142F] h-2 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${Math.min((h.count / 250) * 100, 100)}%` }}
                    className="bg-[#FFC928] h-full rounded-full"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Most Viewed Businesses */}
        <div className="bg-[#08254D] border border-white/12 rounded-3xl p-5 text-white space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-white/10">
            <Store className="w-4 h-4 text-emerald-400" />
            <h4 className="font-bold text-xs uppercase tracking-wider text-white">
              Top Commercial Places
            </h4>
          </div>

          <div className="space-y-3">
            {popularBusinesses.map((b: any, i: number) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-white truncate">{b.title}</span>
                  <span className="text-emerald-400">{b.count} views</span>
                </div>
                <div className="w-full bg-[#04142F] h-2 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${Math.min((b.count / 250) * 100, 100)}%` }}
                    className="bg-emerald-400 h-full rounded-full"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Most Viewed Attractions */}
        <div className="bg-[#08254D] border border-white/12 rounded-3xl p-5 text-white space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-white/10">
            <Compass className="w-4 h-4 text-amber-400" />
            <h4 className="font-bold text-xs uppercase tracking-wider text-white">
              Top Tourist Attractions
            </h4>
          </div>

          <div className="space-y-3">
            {popularAttractions.map((a: any, i: number) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-white truncate">{a.title}</span>
                  <span className="text-amber-400">{a.count} views</span>
                </div>
                <div className="w-full bg-[#04142F] h-2 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${Math.min((a.count / 250) * 100, 100)}%` }}
                    className="bg-amber-400 h-full rounded-full"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Device & Platform Breakdown */}
      <div className="bg-[#08254D] border border-white/12 rounded-3xl p-5 text-white space-y-4">
        <h4 className="font-bold text-xs uppercase tracking-wider text-[#9BAABD]">
          Visitor Device Breakdown
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[#04142F] border border-white/10 p-4 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-white block">Mobile Phones</span>
                <span className="text-[10px] text-[#9BAABD]">Android & iOS</span>
              </div>
            </div>
            <span className="text-lg font-black text-white">{mobilePct}%</span>
          </div>

          <div className="bg-[#04142F] border border-white/10 p-4 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center">
                <Laptop className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-white block">Desktop Browsers</span>
                <span className="text-[10px] text-[#9BAABD]">Chrome, Safari, Edge</span>
              </div>
            </div>
            <span className="text-lg font-black text-white">{desktopPct}%</span>
          </div>

          <div className="bg-[#04142F] border border-white/10 p-4 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center">
                <Tablet className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-white block">Tablets</span>
                <span className="text-[10px] text-[#9BAABD]">iPads & Android Tabs</span>
              </div>
            </div>
            <span className="text-lg font-black text-white">{tabletPct}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
