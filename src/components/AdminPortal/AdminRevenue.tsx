import React, { useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  Building2,
  Megaphone,
  Sparkles,
  ShieldCheck,
  Clock,
  ArrowUpRight,
  Download,
  PlusCircle,
  CheckCircle2,
  AlertCircle,
  Filter,
  Search,
  Wallet,
  Receipt,
  ChevronRight
} from 'lucide-react';
import { RevenueSummary, RevenueTransaction } from '../../types';

interface AdminRevenueProps {
  revenue: RevenueSummary;
  onRecordTransaction?: (tx: {
    source: RevenueTransaction['source'];
    title: string;
    amount: number;
    payer: string;
    status: 'completed' | 'pending';
    reference?: string;
  }) => Promise<void>;
  onRefresh?: () => void;
}

export const AdminRevenue: React.FC<AdminRevenueProps> = ({
  revenue,
  onRecordTransaction,
  onRefresh
}) => {
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [newTxSource, setNewTxSource] = useState<RevenueTransaction['source']>('booking_commission');
  const [newTxTitle, setNewTxTitle] = useState('');
  const [newTxAmount, setNewTxAmount] = useState('');
  const [newTxPayer, setNewTxPayer] = useState('');
  const [newTxStatus, setNewTxStatus] = useState<'completed' | 'pending'>('completed');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const transactions = revenue.recentTransactions || [];

  const filteredTransactions = transactions.filter((tx) => {
    if (selectedFilter !== 'all' && tx.source !== selectedFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        tx.title.toLowerCase().includes(q) ||
        tx.payer.toLowerCase().includes(q) ||
        tx.reference.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleCreateTx = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTxTitle.trim() || !newTxAmount) return;
    const num = parseFloat(newTxAmount);
    if (isNaN(num) || num <= 0) return;

    if (onRecordTransaction) {
      setIsSubmitting(true);
      try {
        await onRecordTransaction({
          source: newTxSource,
          title: newTxTitle.trim(),
          amount: num,
          payer: newTxPayer.trim() || 'Direct Payer',
          status: newTxStatus
        });
        setIsRecordModalOpen(false);
        setNewTxTitle('');
        setNewTxAmount('');
        setNewTxPayer('');
      } catch (err) {
        console.error(err);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Reference', 'Source', 'Title', 'Payer', 'Amount', 'Date', 'Status'];
    const rows = transactions.map((t) => [
      t.id,
      t.reference,
      t.source,
      `"${t.title.replace(/"/g, '""')}"`,
      `"${t.payer.replace(/"/g, '""')}"`,
      t.amount,
      t.date,
      t.status
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Shendam_Revenue_Ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalRecognized = revenue.bookingCommission + revenue.advertising + revenue.sponsoredListings + revenue.premiumAccounts;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#08254D] via-[#0B2D5C] to-[#04142F] border border-white/14 rounded-3xl p-5 sm:p-7 relative overflow-hidden shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 px-2.5 py-1 rounded-full inline-flex items-center gap-1.5">
                <Wallet className="w-3 h-3" />
                <span>Shendam Connect Platform Economy & Ledger</span>
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white font-brand-sans tracking-tight">
              Revenue & Financial Control
            </h1>
            <p className="text-xs text-[#D5DCE8] max-w-xl leading-relaxed">
              Transparent tracking of booking records, commercial advertisements, verified merchant fees, and sponsored tourism listings on Shendam Connect.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2.5 bg-[#04142F] hover:bg-[#061D40] text-white border border-white/16 rounded-xl font-bold text-xs flex items-center gap-2 transition cursor-pointer shadow-sm"
            >
              <Download className="w-4 h-4 text-[#FFC928]" />
              <span>Export Ledger</span>
            </button>
            <button
              onClick={() => setIsRecordModalOpen(true)}
              className="px-4 py-2.5 bg-[#FFC928] hover:bg-[#E6B31E] text-[#04142F] rounded-xl font-black text-xs flex items-center gap-2 transition cursor-pointer shadow-md"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Record Transaction</span>
            </button>
          </div>
        </div>
      </div>

      {/* Primary Revenue KPI Matrix (Matching Requested Metric Schema) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Today's Revenue */}
        <div className="bg-[#08254D] border border-emerald-500/30 rounded-2xl p-4.5 text-white space-y-2 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-[#9BAABD]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300">Today's Revenue</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-brand-sans">
            ₦{revenue.todaysRevenue.toLocaleString()}
          </div>
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3" />
              <span>Active today</span>
            </span>
            <span className="text-[#9BAABD]">Direct platform settlement</span>
          </div>
        </div>

        {/* Metric 2: This Month */}
        <div className="bg-[#08254D] border border-[#FFC928]/30 rounded-2xl p-4.5 text-white space-y-2 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-[#9BAABD]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#FFC928]">This Month</span>
            <div className="w-8 h-8 rounded-xl bg-[#FFC928]/15 border border-[#FFC928]/30 flex items-center justify-center text-[#FFC928]">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#FFC928] font-brand-sans">
            ₦{revenue.thisMonth.toLocaleString()}
          </div>
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-[#FFC928] font-bold">August 2026</span>
            <span className="text-[#9BAABD]">Monthly Cumulative</span>
          </div>
        </div>

        {/* Metric 3: Booking Commission */}
        <div className="bg-[#08254D] border border-white/12 rounded-2xl p-4.5 text-white space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-[#9BAABD]">
            <span className="text-[11px] font-bold uppercase tracking-wider">Booking Commission</span>
            <div className="w-8 h-8 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-brand-sans">
            ₦{revenue.bookingCommission.toLocaleString()}
          </div>
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-sky-300 font-semibold">10% Standard fee</span>
            <span className="text-[#9BAABD]">Hotels & stays</span>
          </div>
        </div>

        {/* Metric 4: Pending Revenue */}
        <div className="bg-[#08254D] border border-amber-500/30 rounded-2xl p-4.5 text-white space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-[#9BAABD]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300">Pending Revenue</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-300 font-brand-sans">
            ₦{revenue.pendingRevenue.toLocaleString()}
          </div>
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-amber-400 font-semibold">Escrow & Verification</span>
            <span className="text-[#9BAABD]">Pending payout</span>
          </div>
        </div>
      </div>

      {/* Secondary Revenue Streams Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Advertising */}
        <div className="bg-[#08254D] border border-white/12 rounded-2xl p-4 text-white flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#9BAABD] flex items-center gap-1.5">
              <Megaphone className="w-3.5 h-3.5 text-indigo-400" />
              <span>Advertising</span>
            </span>
            <div className="text-xl font-black text-white font-brand-sans">
              ₦{revenue.advertising.toLocaleString()}
            </div>
            <p className="text-[10px] text-[#9BAABD]">Banner slots & promoted posts</p>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold text-indigo-300 bg-indigo-500/15 px-2.5 py-1 rounded-lg border border-indigo-500/30">
              {totalRecognized > 0 ? ((revenue.advertising / totalRecognized) * 100).toFixed(1) : 0}%
            </span>
          </div>
        </div>

        {/* Sponsored Listings */}
        <div className="bg-[#08254D] border border-white/12 rounded-2xl p-4 text-white flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#9BAABD] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#FFC928]" />
              <span>Sponsored Listings</span>
            </span>
            <div className="text-xl font-black text-white font-brand-sans">
              ₦{revenue.sponsoredListings.toLocaleString()}
            </div>
            <p className="text-[10px] text-[#9BAABD]">Top placement badge pins</p>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold text-[#FFC928] bg-[#FFC928]/15 px-2.5 py-1 rounded-lg border border-[#FFC928]/30">
              {totalRecognized > 0 ? ((revenue.sponsoredListings / totalRecognized) * 100).toFixed(1) : 0}%
            </span>
          </div>
        </div>

        {/* Premium Accounts */}
        <div className="bg-[#08254D] border border-white/12 rounded-2xl p-4 text-white flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#9BAABD] flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Premium Accounts</span>
            </span>
            <div className="text-xl font-black text-white font-brand-sans">
              ₦{revenue.premiumAccounts.toLocaleString()}
            </div>
            <p className="text-[10px] text-[#9BAABD]">Verified merchant listing tiers</p>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/15 px-2.5 py-1 rounded-lg border border-emerald-500/30">
              {totalRecognized > 0 ? ((revenue.premiumAccounts / totalRecognized) * 100).toFixed(1) : 0}%
            </span>
          </div>
        </div>
      </div>

      {/* Revenue Structure Breakdown Table */}
      <div className="bg-[#08254D] border border-white/12 rounded-3xl p-5 text-white shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white font-brand-sans">
                Official Revenue Summary Table
              </h3>
              <p className="text-[11px] text-[#9BAABD]">
                Consolidated financial ledger by revenue category
              </p>
            </div>
          </div>

          <div className="text-xs text-[#9BAABD]">
            Total Recognized: <strong className="text-white font-brand-sans">₦{totalRecognized.toLocaleString()}</strong>
          </div>
        </div>

        {/* Structured Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-[10px] font-black uppercase tracking-wider text-[#9BAABD]">
                <th className="py-2.5 px-3">Revenue Stream Metric</th>
                <th className="py-2.5 px-3">Channel / Description</th>
                <th className="py-2.5 px-3 text-right">Recorded Amount</th>
                <th className="py-2.5 px-3 text-right">Share of Total</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/6 font-medium">
              {/* Today's Revenue */}
              <tr className="hover:bg-white/5 transition">
                <td className="py-3 px-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="font-bold text-white">Today's Revenue</span>
                  </div>
                </td>
                <td className="py-3 px-3 text-[#D5DCE8]">Real-time daily collection for {new Date().toLocaleDateString()}</td>
                <td className="py-3 px-3 text-right font-bold text-emerald-400 font-brand-sans">₦{revenue.todaysRevenue.toLocaleString()}</td>
                <td className="py-3 px-3 text-right text-[#9BAABD]">-</td>
                <td className="py-3 px-3 text-center">
                  <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    Live
                  </span>
                </td>
              </tr>

              {/* This Month */}
              <tr className="hover:bg-white/5 transition">
                <td className="py-3 px-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#FFC928]" />
                    <span className="font-bold text-white">This Month</span>
                  </div>
                </td>
                <td className="py-3 px-3 text-[#D5DCE8]">Cumulative gross revenue for current billing month</td>
                <td className="py-3 px-3 text-right font-bold text-[#FFC928] font-brand-sans">₦{revenue.thisMonth.toLocaleString()}</td>
                <td className="py-3 px-3 text-right text-[#9BAABD]">100%</td>
                <td className="py-3 px-3 text-center">
                  <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FFC928]/15 text-[#FFC928] border border-[#FFC928]/30">
                    Active
                  </span>
                </td>
              </tr>

              {/* Booking Commission */}
              <tr className="hover:bg-white/5 transition">
                <td className="py-3 px-3">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-sky-400" />
                    <span className="font-bold text-white">Booking Commission</span>
                  </div>
                </td>
                <td className="py-3 px-3 text-[#D5DCE8]">10% platform commission from completed hotel guest reservations</td>
                <td className="py-3 px-3 text-right font-bold text-white font-brand-sans">₦{revenue.bookingCommission.toLocaleString()}</td>
                <td className="py-3 px-3 text-right text-[#9BAABD]">
                  {totalRecognized > 0 ? ((revenue.bookingCommission / totalRecognized) * 100).toFixed(1) : 0}%
                </td>
                <td className="py-3 px-3 text-center">
                  <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/15 text-sky-400 border border-sky-500/30">
                    Settled
                  </span>
                </td>
              </tr>

              {/* Advertising */}
              <tr className="hover:bg-white/5 transition">
                <td className="py-3 px-3">
                  <div className="flex items-center gap-2">
                    <Megaphone className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="font-bold text-white">Advertising</span>
                  </div>
                </td>
                <td className="py-3 px-3 text-[#D5DCE8]">Hero sliders, event sponsorships, and homepage banner placements</td>
                <td className="py-3 px-3 text-right font-bold text-white font-brand-sans">₦{revenue.advertising.toLocaleString()}</td>
                <td className="py-3 px-3 text-right text-[#9BAABD]">
                  {totalRecognized > 0 ? ((revenue.advertising / totalRecognized) * 100).toFixed(1) : 0}%
                </td>
                <td className="py-3 px-3 text-center">
                  <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                    Settled
                  </span>
                </td>
              </tr>

              {/* Sponsored Listings */}
              <tr className="hover:bg-white/5 transition">
                <td className="py-3 px-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-[#FFC928]" />
                    <span className="font-bold text-white">Sponsored Listings</span>
                  </div>
                </td>
                <td className="py-3 px-3 text-[#D5DCE8]">Priority search ranking and verified badge highlights on directory cards</td>
                <td className="py-3 px-3 text-right font-bold text-white font-brand-sans">₦{revenue.sponsoredListings.toLocaleString()}</td>
                <td className="py-3 px-3 text-right text-[#9BAABD]">
                  {totalRecognized > 0 ? ((revenue.sponsoredListings / totalRecognized) * 100).toFixed(1) : 0}%
                </td>
                <td className="py-3 px-3 text-center">
                  <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FFC928]/15 text-[#FFC928] border border-[#FFC928]/30">
                    Settled
                  </span>
                </td>
              </tr>

              {/* Premium Accounts */}
              <tr className="hover:bg-white/5 transition">
                <td className="py-3 px-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="font-bold text-white">Premium Accounts</span>
                  </div>
                </td>
                <td className="py-3 px-3 text-[#D5DCE8]">Annual verified merchant portal subscriptions and analytics access</td>
                <td className="py-3 px-3 text-right font-bold text-white font-brand-sans">₦{revenue.premiumAccounts.toLocaleString()}</td>
                <td className="py-3 px-3 text-right text-[#9BAABD]">
                  {totalRecognized > 0 ? ((revenue.premiumAccounts / totalRecognized) * 100).toFixed(1) : 0}%
                </td>
                <td className="py-3 px-3 text-center">
                  <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    Settled
                  </span>
                </td>
              </tr>

              {/* Pending Revenue */}
              <tr className="hover:bg-white/5 transition bg-amber-500/5">
                <td className="py-3 px-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span className="font-bold text-amber-300">Pending Revenue</span>
                  </div>
                </td>
                <td className="py-3 px-3 text-[#D5DCE8]">Bookings in transit / awaiting guest checkout settlement</td>
                <td className="py-3 px-3 text-right font-bold text-amber-300 font-brand-sans">₦{revenue.pendingRevenue.toLocaleString()}</td>
                <td className="py-3 px-3 text-right text-[#9BAABD]">-</td>
                <td className="py-3 px-3 text-center">
                  <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                    Pending
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction History & Live Ledger */}
      <div className="bg-[#08254D] border border-white/12 rounded-3xl p-5 text-white shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-white/10">
          <div>
            <h3 className="font-bold text-sm text-white font-brand-sans">
              Recent Transactions & Ledger Log
            </h3>
            <p className="text-[11px] text-[#9BAABD]">
              Audit trail of individual payments, fees, and settlements
            </p>
          </div>

          {/* Search & Channel Filter */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#9BAABD] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search transaction..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-[#04142F] border border-white/14 rounded-xl text-xs text-white placeholder-[#9BAABD] focus:outline-none focus:border-[#FFC928]"
              />
            </div>

            <div className="flex items-center gap-1 bg-[#04142F] p-1 rounded-xl border border-white/10 text-[11px]">
              <button
                onClick={() => setSelectedFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                  selectedFilter === 'all' ? 'bg-[#FFC928] text-[#04142F]' : 'text-[#9BAABD] hover:text-white'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setSelectedFilter('booking_commission')}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                  selectedFilter === 'booking_commission' ? 'bg-[#FFC928] text-[#04142F]' : 'text-[#9BAABD] hover:text-white'
                }`}
              >
                Hotels
              </button>
              <button
                onClick={() => setSelectedFilter('advertising')}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                  selectedFilter === 'advertising' ? 'bg-[#FFC928] text-[#04142F]' : 'text-[#9BAABD] hover:text-white'
                }`}
              >
                Ads
              </button>
              <button
                onClick={() => setSelectedFilter('sponsored_listing')}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                  selectedFilter === 'sponsored_listing' ? 'bg-[#FFC928] text-[#04142F]' : 'text-[#9BAABD] hover:text-white'
                }`}
              >
                Sponsored
              </button>
              <button
                onClick={() => setSelectedFilter('premium_account')}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                  selectedFilter === 'premium_account' ? 'bg-[#FFC928] text-[#04142F]' : 'text-[#9BAABD] hover:text-white'
                }`}
              >
                Premium
              </button>
            </div>
          </div>
        </div>

        {/* Ledger List */}
        {filteredTransactions.length === 0 ? (
          <div className="py-10 text-center text-[#9BAABD] text-xs">
            No transactions found matching your criteria.
          </div>
        ) : (
          <div className="divide-y divide-white/8">
            {filteredTransactions.map((tx) => (
              <div key={tx.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                      tx.source === 'booking_commission'
                        ? 'bg-sky-500/15 text-sky-400 border-sky-500/30'
                        : tx.source === 'advertising'
                        ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                        : tx.source === 'sponsored_listing'
                        ? 'bg-[#FFC928]/15 text-[#FFC928] border-[#FFC928]/30'
                        : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    }`}
                  >
                    {tx.source === 'booking_commission' && <Building2 className="w-4 h-4" />}
                    {tx.source === 'advertising' && <Megaphone className="w-4 h-4" />}
                    {tx.source === 'sponsored_listing' && <Sparkles className="w-4 h-4" />}
                    {tx.source === 'premium_account' && <ShieldCheck className="w-4 h-4" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-white">{tx.title}</span>
                      <span className="text-[10px] text-[#9BAABD] bg-white/5 px-2 py-0.5 rounded border border-white/10">
                        {tx.reference}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#9BAABD] mt-0.5">
                      Payer: <span className="text-white font-medium">{tx.payer}</span> • {new Date(tx.date).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1 shrink-0">
                  <span className="text-sm font-black text-white font-brand-sans">
                    +₦{tx.amount.toLocaleString()}
                  </span>
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                      tx.status === 'completed'
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                        : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                    }`}
                  >
                    {tx.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Record Transaction Modal */}
      {isRecordModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#08254D] border border-white/20 rounded-3xl w-full max-w-md p-6 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#FFC928]/15 border border-[#FFC928]/30 flex items-center justify-center text-[#FFC928]">
                  <PlusCircle className="w-4 h-4" />
                </div>
                <h3 className="font-black text-sm text-white font-brand-sans">
                  Record Revenue Entry
                </h3>
              </div>
              <button
                onClick={() => setIsRecordModalOpen(false)}
                className="text-[#9BAABD] hover:text-white text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTx} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#9BAABD] mb-1">
                  Revenue Stream Channel
                </label>
                <select
                  value={newTxSource}
                  onChange={(e) => setNewTxSource(e.target.value as any)}
                  className="w-full px-3 py-2 bg-[#04142F] border border-white/14 rounded-xl text-white focus:outline-none focus:border-[#FFC928]"
                >
                  <option value="booking_commission">Booking Commission (Hotels & Stays)</option>
                  <option value="advertising">Advertising & Banner Sponsorships</option>
                  <option value="sponsored_listing">Sponsored Featured Placement</option>
                  <option value="premium_account">Premium Verified Merchant Subscription</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#9BAABD] mb-1">
                  Transaction Title / Description
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Booking Fee - Hillview Lodge"
                  value={newTxTitle}
                  onChange={(e) => setNewTxTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-[#04142F] border border-white/14 rounded-xl text-white placeholder-[#9BAABD] focus:outline-none focus:border-[#FFC928]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#9BAABD] mb-1">
                    Amount (₦)
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="25000"
                    value={newTxAmount}
                    onChange={(e) => setNewTxAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-[#04142F] border border-white/14 rounded-xl text-white placeholder-[#9BAABD] focus:outline-none focus:border-[#FFC928]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#9BAABD] mb-1">
                    Status
                  </label>
                  <select
                    value={newTxStatus}
                    onChange={(e) => setNewTxStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[#04142F] border border-white/14 rounded-xl text-white focus:outline-none focus:border-[#FFC928]"
                  >
                    <option value="completed">Completed (Settled)</option>
                    <option value="pending">Pending Settlement</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#9BAABD] mb-1">
                  Payer / Organization Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dreams Hotel Ltd"
                  value={newTxPayer}
                  onChange={(e) => setNewTxPayer(e.target.value)}
                  className="w-full px-3 py-2 bg-[#04142F] border border-white/14 rounded-xl text-white placeholder-[#9BAABD] focus:outline-none focus:border-[#FFC928]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRecordModalOpen(false)}
                  className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-[#FFC928] hover:bg-[#E6B31E] text-[#04142F] rounded-xl font-black cursor-pointer shadow-md disabled:opacity-50"
                >
                  {isSubmitting ? 'Recording...' : 'Save Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
