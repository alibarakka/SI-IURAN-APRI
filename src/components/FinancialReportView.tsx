import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  MapPin, 
  Plus, 
  FileSpreadsheet, 
  FileText, 
  TrendingUp, 
  TrendingDown, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Search, 
  Filter, 
  Trash2, 
  PieChart, 
  BookOpen, 
  Percent, 
  ShieldCheck, 
  AlertCircle,
  HelpCircle,
  Clock
} from 'lucide-react';
import { AuthUser, CashFlowEntry, IuranRecord, PenghuluMember, ExpenseCategory } from '../types';
import { KAB_KOTA_SULSEL, NAMA_BULAN } from '../data/mockData';
import { formatRupiah, generateLaporanKeuanganPDF, exportFinancialReportExcel } from '../utils/exporter';

interface FinancialReportViewProps {
  currentUser: AuthUser;
  cashFlow: CashFlowEntry[];
  records: IuranRecord[];
  members: PenghuluMember[];
  onOpenAddModal: () => void;
  onDeleteEntry?: (id: string) => void;
  selectedBulan: number;
  setSelectedBulan: (bulan: number) => void;
  selectedTahun: number;
  setSelectedTahun: (tahun: number) => void;
}

export const FinancialReportView: React.FC<FinancialReportViewProps> = ({
  currentUser,
  cashFlow,
  records,
  members,
  onOpenAddModal,
  onDeleteEntry,
  selectedBulan,
  setSelectedBulan,
  selectedTahun,
  setSelectedTahun
}) => {
  const isWilayah = currentUser.role === 'BENDAHARA_WILAYAH';
  const isCabang = currentUser.role === 'BENDAHARA_CABANG';
  const branchKabKota = currentUser.kabKota || 'Kota Makassar';

  // Sub-navigation inside Financial Report
  const [reportSubTab, setReportSubTab] = useState<'BKU' | 'ANALISIS_POS' | 'DISTRIBUSI_ADART'>('BKU');

  // Wilayah Treasury Scope:
  // - 'PW_ONLY': Kas Pengurus Wilayah Sulsel (Porsi 25% + Pangkal - Belanja PW)
  // - 'KONSOLIDASI': Gabungan seluruh 24 Kab/Kota
  // - 'CABANG_AUDIT': Drill-down ke kas PC Cabang tertentu
  const [wilayahScope, setWilayahScope] = useState<'PW_ONLY' | 'KONSOLIDASI' | 'CABANG_AUDIT'>(
    isWilayah ? 'PW_ONLY' : 'CABANG_AUDIT'
  );
  const [auditKabKota, setAuditKabKota] = useState<string>('Kota Makassar');

  // Filters
  const [jenisFilter, setJenisFilter] = useState<'SEMUA' | 'MASUK' | 'KELUAR'>('SEMUA');
  const [kategoriFilter, setKategoriFilter] = useState<string>('SEMUA');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Active targeted Kab/Kota for Branch mode
  const currentTargetKabKota = isCabang ? branchKabKota : (wilayahScope === 'CABANG_AUDIT' ? auditKabKota : undefined);

  // Compute automatic Iuran income according to AD/ART distribution:
  // Paid records in current filtered month/year
  const paidRecordsInPeriod = useMemo(() => {
    return records.filter(r => {
      if (r.status !== 'LUNAS') return false;
      if (selectedBulan > 0 && r.periodeBulan !== selectedBulan && r.periodeBulan !== 0) return false;
      if (r.periodeTahun !== selectedTahun) return false;
      return true;
    });
  }, [records, selectedBulan, selectedTahun]);

  // AD/ART Allocation figures for current period
  const adArtStats = useMemo(() => {
    let targetRecords = paidRecordsInPeriod;
    if (currentTargetKabKota) {
      targetRecords = targetRecords.filter(r => r.kabKota === currentTargetKabKota);
    }

    const bulananLunas = targetRecords.filter(r => r.jenisIuran !== 'PANGKAL' && r.periodeBulan > 0);
    const totalBulananBruto = bulananLunas.reduce((acc, r) => acc + r.nominal, 0);

    const pangkalLunas = targetRecords.filter(r => r.jenisIuran === 'PANGKAL' || r.periodeBulan === 0);
    const totalPangkalBruto = pangkalLunas.reduce((acc, r) => acc + r.nominal, 0);

    // Distribution
    const porsiPC = Math.round(totalBulananBruto * 0.60); // 60%
    const porsiPW = Math.round(totalBulananBruto * 0.25); // 25%
    const porsiPP = Math.round(totalBulananBruto * 0.15); // 15%

    return {
      totalBulananBruto,
      totalPangkalBruto,
      totalBruto: totalBulananBruto + totalPangkalBruto,
      porsiPC,
      porsiPW,
      porsiPP,
      lunasCount: bulananLunas.length
    };
  }, [paidRecordsInPeriod, currentTargetKabKota]);

  // Filtered Cash Flow Entries
  const filteredEntries = useMemo(() => {
    return cashFlow.filter(entry => {
      // 1. Period filter (if selectedBulan > 0)
      if (selectedBulan > 0 && entry.periodeBulan !== selectedBulan && entry.periodeBulan !== 0) {
        return false;
      }
      if (entry.periodeTahun !== selectedTahun) {
        return false;
      }

      // 2. Role / Scope Filter
      if (isCabang) {
        // Cabang can only see entries belonging to their Kab/Kota
        if (entry.kabKota !== branchKabKota) return false;
      } else if (isWilayah) {
        if (wilayahScope === 'PW_ONLY') {
          // PW only: entries without kabKota or kabKota === undefined or entityType === 'PW_WILAYAH' or 'PP_PUSAT'
          if (entry.entityType === 'PC_CABANG' && entry.kabKota) return false;
        } else if (wilayahScope === 'CABANG_AUDIT') {
          // Scoped to specific audit Kab/Kota
          if (entry.kabKota !== auditKabKota) return false;
        }
        // If 'KONSOLIDASI', all entries are included
      }

      // 3. Jenis Filter
      if (jenisFilter !== 'SEMUA' && entry.jenis !== jenisFilter) {
        return false;
      }

      // 4. Kategori Filter
      if (kategoriFilter !== 'SEMUA' && entry.kategori !== kategoriFilter) {
        return false;
      }

      // 5. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchKet = entry.keterangan.toLowerCase().includes(q);
        const matchPic = entry.penanggungJawab.toLowerCase().includes(q);
        const matchRef = entry.buktiRef?.toLowerCase().includes(q) || false;
        const matchKat = entry.kategori.toLowerCase().includes(q);
        if (!matchKet && !matchPic && !matchRef && !matchKat) return false;
      }

      return true;
    });
  }, [cashFlow, selectedBulan, selectedTahun, isCabang, isWilayah, wilayahScope, auditKabKota, branchKabKota, jenisFilter, kategoriFilter, searchQuery]);

  // Calculate totals and running balances
  const { totalMasuk, totalKeluar, saldoBerjalan, runningEntries } = useMemo(() => {
    // Sort chronological: oldest first for running balance calculation
    const sorted = [...filteredEntries].sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime());

    let balance = 0;
    let masuk = 0;
    let keluar = 0;

    const withBalance = sorted.map(entry => {
      if (entry.jenis === 'MASUK') {
        balance += entry.nominal;
        masuk += entry.nominal;
      } else {
        balance -= entry.nominal;
        keluar += entry.nominal;
      }
      return {
        ...entry,
        saldo: balance
      };
    });

    // Invert back for latest-first display in table
    return {
      totalMasuk: masuk,
      totalKeluar: keluar,
      saldoBerjalan: balance,
      runningEntries: [...withBalance].reverse()
    };
  }, [filteredEntries]);

  // Surplus / Defisit
  const surplusDefisit = totalMasuk - totalKeluar;

  // Breakdown by Category for Analysis Tab
  const categoryBreakdown = useMemo(() => {
    const masukMap: Record<string, number> = {};
    const keluarMap: Record<string, number> = {};

    filteredEntries.forEach(entry => {
      const cat = entry.kategori.replace(/_/g, ' ');
      if (entry.jenis === 'MASUK') {
        masukMap[cat] = (masukMap[cat] || 0) + entry.nominal;
      } else {
        keluarMap[cat] = (keluarMap[cat] || 0) + entry.nominal;
      }
    });

    return { masukMap, keluarMap };
  }, [filteredEntries]);

  // Active Scope Label for header & export
  const scopeLabel = useMemo(() => {
    if (isCabang) return `PC APRI ${branchKabKota}`;
    if (wilayahScope === 'PW_ONLY') return 'Pengurus Wilayah (PW Sulsel)';
    if (wilayahScope === 'CABANG_AUDIT') return `PC APRI ${auditKabKota}`;
    return 'Konsolidasi Seluruh Sulawesi Selatan';
  }, [isCabang, branchKabKota, wilayahScope, auditKabKota]);

  // PDF Export
  const handleExportPDF = () => {
    generateLaporanKeuanganPDF({
      entries: runningEntries,
      bulan: selectedBulan,
      tahun: selectedTahun,
      totalMasuk,
      totalKeluar,
      saldoAkhir: saldoBerjalan,
      title: isCabang 
        ? `PENGURUS CABANG APRI ${branchKabKota.toUpperCase()}`
        : (wilayahScope === 'CABANG_AUDIT' ? `PENGURUS CABANG APRI ${auditKabKota.toUpperCase()}` : 'PENGURUS WILAYAH APRI SULAWESI SELATAN'),
      subTitle: `Laporan Keuangan & Buku Kas Umum (${scopeLabel})`,
      scopeLabel,
      kabKota: isCabang ? branchKabKota : (wilayahScope === 'CABANG_AUDIT' ? auditKabKota : undefined),
      bendaharaNama: currentUser.namaLengkap,
      bendaharaNip: currentUser.nip || '197508122003121002',
      porsiStats: {
        totalPorsiPC: adArtStats.porsiPC,
        totalPorsiPW: adArtStats.porsiPW,
        totalPorsiPP: adArtStats.porsiPP
      }
    });
  };

  // Excel Export
  const handleExportExcel = () => {
    exportFinancialReportExcel({
      entries: runningEntries,
      bulan: selectedBulan,
      tahun: selectedTahun,
      totalMasuk,
      totalKeluar,
      saldoAkhir: saldoBerjalan,
      scopeLabel,
      bendaharaNama: currentUser.namaLengkap
    });
  };

  return (
    <div className="space-y-6">
      
      {/* SECTION 1: REPORT BANNER & ROLE SCOPE SWITCHER */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          <div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                isWilayah ? 'bg-emerald-800 text-white' : 'bg-amber-600 text-white'
              }`}>
                {isWilayah ? 'Buku Kas Bendahara Wilayah' : 'Buku Kas Bendahara Cabang'}
              </span>
              <span className="text-slate-400">·</span>
              <span className="text-xs font-semibold text-slate-700">
                {scopeLabel}
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-1">
              {isCabang 
                ? `Laporan Keuangan PC APRI ${branchKabKota}`
                : (wilayahScope === 'CABANG_AUDIT' 
                    ? `Audit Keuangan Cabang: PC APRI ${auditKabKota}` 
                    : (wilayahScope === 'PW_ONLY' ? 'Laporan Kas Khusus PW APRI Sulawesi Selatan' : 'Konsolidasi Keuangan APRI Seluruh Sulawesi Selatan'))}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {isCabang 
                ? `Pencatatan real-time penerimaan porsi 60% hak cabang (Rp 30.000 / iuran bulanan), infaq, dan belanja operasional cabang.`
                : `Transparansi pembukuan kas sesuai AD/ART: Hak PC Cabang 60%, Hak PW Sulsel 25%, dan Kewajiban Setoran PP Pusat 15%.`}
            </p>
          </div>

          {/* Wilayah Admin Scope Switcher */}
          {isWilayah && (
            <div className="flex flex-wrap items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
              <button
                onClick={() => setWilayahScope('PW_ONLY')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  wilayahScope === 'PW_ONLY'
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                Kas Khusus PW (25%)
              </button>

              <button
                onClick={() => setWilayahScope('KONSOLIDASI')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  wilayahScope === 'KONSOLIDASI'
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                Konsolidasi 24 Kab/Kota
              </button>

              <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
                <button
                  onClick={() => setWilayahScope('CABANG_AUDIT')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    wilayahScope === 'CABANG_AUDIT'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  Audit PC Cabang:
                </button>
                {wilayahScope === 'CABANG_AUDIT' && (
                  <select
                    value={auditKabKota}
                    onChange={(e) => setAuditKabKota(e.target.value)}
                    className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 focus:outline-emerald-600"
                  >
                    {KAB_KOTA_SULSEL.map(k => (
                      <option key={k} value={k}>{k.replace('Kab. ', '').replace('Kota ', '')}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          )}

        </div>

        {/* AD/ART Distribution Highlight Notice */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs bg-emerald-50/50 rounded-xl p-3 border border-emerald-100">
          <div className="flex items-center gap-2 text-emerald-900 font-medium">
            <Percent className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>
              <strong>Ketentuan AD/ART & PO APRI:</strong> Iuran Pangkal Rp 100.000 · Iuran Bulanan Rp 50.000 (
              <span className="font-semibold text-emerald-800">PC 60% = Rp 30.000</span> · 
              <span className="font-semibold text-emerald-800"> PW 25% = Rp 12.500</span> · 
              <span className="font-semibold text-emerald-800"> PP 15% = Rp 7.500</span>)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500 font-mono">
              Periode Aktif: <strong>{selectedBulan > 0 ? NAMA_BULAN[selectedBulan - 1] : 'Semua Bulan'} {selectedTahun}</strong>
            </span>
          </div>
        </div>

      </div>

      {/* SECTION 2: FINANCIAL METRICS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Saldo Kas Berjalan */}
        <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-300 font-semibold tracking-wide uppercase">
                Saldo Kas Saat Ini
              </span>
              <span className="p-1.5 bg-slate-800 rounded-lg text-emerald-400">
                <BookOpen className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-400 mt-2">
              {formatRupiah(saldoBerjalan)}
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Kas Tersedia di Rekening</span>
            <span className="font-mono text-emerald-400 font-semibold">Tersinkron Real-time</span>
          </div>
        </div>

        {/* Card 2: Total Penerimaan (Kas Masuk) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-emerald-800 font-semibold flex items-center gap-1.5">
                <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
                <span>Total Penerimaan</span>
              </span>
              <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
                Masuk
              </span>
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-950 mt-2">
              {formatRupiah(totalMasuk)}
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
            <span>
              {isCabang 
                ? `Hak 60%: ${formatRupiah(adArtStats.porsiPC)}` 
                : (wilayahScope === 'PW_ONLY' ? `Hak 25%: ${formatRupiah(adArtStats.porsiPW)}` : `Total Bruto: ${formatRupiah(adArtStats.totalBruto)}`)}
            </span>
            <span className="font-mono text-slate-600">{adArtStats.lunasCount} Iuran Terbayar</span>
          </div>
        </div>

        {/* Card 3: Total Pengeluaran (Kas Keluar) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-rose-800 font-semibold flex items-center gap-1.5">
                <ArrowUpRight className="w-4 h-4 text-rose-600" />
                <span>Total Pengeluaran</span>
              </span>
              <span className="text-[11px] font-mono text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full font-bold">
                Keluar
              </span>
            </div>
            <div className="text-2xl font-bold font-mono text-rose-950 mt-2">
              {formatRupiah(totalKeluar)}
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Operasional & Kegiatan</span>
            <span className="font-mono text-rose-700 font-semibold">
              {filteredEntries.filter(e => e.jenis === 'KELUAR').length} Transaksi
            </span>
          </div>
        </div>

        {/* Card 4: Surplus / Defisit Periode */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-700 font-semibold flex items-center gap-1.5">
                {surplusDefisit >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-rose-600" />
                )}
                <span>Surplus / (Defisit)</span>
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                surplusDefisit >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}>
                {surplusDefisit >= 0 ? 'Surplus Kas' : 'Defisit Kas'}
              </span>
            </div>
            <div className={`text-2xl font-bold font-mono mt-2 ${
              surplusDefisit >= 0 ? 'text-emerald-700' : 'text-rose-700'
            }`}>
              {formatRupiah(surplusDefisit)}
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Net Arus Kas Periode</span>
            <span className="font-mono text-slate-700 font-semibold">
              {totalMasuk > 0 ? Math.round((surplusDefisit / totalMasuk) * 100) : 0}% Margin
            </span>
          </div>
        </div>

      </div>

      {/* SECTION 3: TOOLBAR & SUB-TABS */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        
        {/* Sub-tab Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setReportSubTab('BKU')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                reportSubTab === 'BKU'
                  ? 'bg-white text-emerald-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Buku Kas Umum (BKU)</span>
            </button>

            <button
              onClick={() => setReportSubTab('ANALISIS_POS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                reportSubTab === 'ANALISIS_POS'
                  ? 'bg-white text-emerald-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <PieChart className="w-3.5 h-3.5" />
              <span>Analisis Pos Anggaran</span>
            </button>

            <button
              onClick={() => setReportSubTab('DISTRIBUSI_ADART')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                reportSubTab === 'DISTRIBUSI_ADART'
                  ? 'bg-white text-emerald-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Percent className="w-3.5 h-3.5" />
              <span>Distribusi AD/ART (60:25:15)</span>
            </button>
          </div>

          {/* Action Buttons: Add Entry, PDF, Excel */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onOpenAddModal}
              className="px-3.5 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Catat Transaksi Kas</span>
            </button>

            <button
              onClick={handleExportExcel}
              disabled={filteredEntries.length === 0}
              className="px-3.5 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              title="Unduh Laporan Keuangan format Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
              <span>Ekspor Excel</span>
            </button>

            <button
              onClick={handleExportPDF}
              disabled={filteredEntries.length === 0}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              title="Cetak Laporan PDF Resmi Lengkap dengan Tanda Tangan"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Cetak PDF Resmi</span>
            </button>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5 text-xs">
          
          {/* Period Bulan */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Bulan
            </label>
            <select
              value={selectedBulan}
              onChange={(e) => setSelectedBulan(Number(e.target.value))}
              className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs font-semibold text-slate-800 focus:outline-emerald-600"
            >
              <option value={0}>Semua Bulan (Tahunan)</option>
              {NAMA_BULAN.map((bulan, idx) => (
                <option key={bulan} value={idx + 1}>
                  {bulan}
                </option>
              ))}
            </select>
          </div>

          {/* Period Tahun */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Tahun
            </label>
            <select
              value={selectedTahun}
              onChange={(e) => setSelectedTahun(Number(e.target.value))}
              className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs font-semibold text-slate-800 focus:outline-emerald-600"
            >
              <option value={2026}>2026</option>
              <option value={2025}>2025</option>
            </select>
          </div>

          {/* Jenis Transaksi */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Arus Kas
            </label>
            <select
              value={jenisFilter}
              onChange={(e) => setJenisFilter(e.target.value as any)}
              className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs font-semibold text-slate-800 focus:outline-emerald-600"
            >
              <option value="SEMUA">Semua (Masuk & Keluar)</option>
              <option value="MASUK">Penerimaan (Kas Masuk)</option>
              <option value="KELUAR">Pengeluaran (Kas Keluar)</option>
            </select>
          </div>

          {/* Pos Anggaran */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Pos Anggaran
            </label>
            <select
              value={kategoriFilter}
              onChange={(e) => setKategoriFilter(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs font-semibold text-slate-800 focus:outline-emerald-600"
            >
              <option value="SEMUA">Semua Pos Anggaran</option>
              <option value="IURAN_ANGGOTA">Iuran Anggota</option>
              <option value="BAGI_HASIL_PC_CABANG">Bagi Hasil PC (60%)</option>
              <option value="BAGI_HASIL_PW_WILAYAH">Bagi Hasil PW (25%)</option>
              <option value="SETORAN_PP_PUSAT">Setoran PP Pusat (15%)</option>
              <option value="BIMTEK_PENGHULU">Bimtek Kepenghuluan</option>
              <option value="RAKERWIL_APRI">Rakerwil APRI</option>
              <option value="RAKERCAB_APRI">Rakercab Cabang</option>
              <option value="SANTUNAN_DUKA">Santunan Duka Cita</option>
              <option value="ADVOKASI_HUKUM">Advokasi Perlindungan Hukum</option>
              <option value="OPERASIONAL_SEKRETARIAT">Operasional Wilayah</option>
              <option value="OPERASIONAL_CABANG">Operasional Cabang</option>
            </select>
          </div>

          {/* Search Query */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Cari Uraian / Bukti
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Cari transaksi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-800 focus:outline-emerald-600"
              />
            </div>
          </div>

        </div>

      </div>

      {/* SECTION 4: TAB CONTENT */}
      
      {/* SUB-TAB 1: BUKU KAS UMUM (BKU TABLE) */}
      {reportSubTab === 'BKU' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Jurnal Buku Kas Umum (BKU)
              </h3>
              <p className="text-xs text-slate-500">
                Catatan mutasi penerimaan dan pengeluaran kas dengan saldo berjalan
              </p>
            </div>
            <div className="text-xs text-slate-500 font-mono">
              Total {runningEntries.length} Transaksi Tercatat
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3.5 w-12 text-center">No</th>
                  <th className="py-3 px-3.5 whitespace-nowrap">Tanggal</th>
                  <th className="py-3 px-3.5">No. Bukti / Kwitansi</th>
                  <th className="py-3 px-3.5 min-w-[200px]">Uraian / Keterangan Mutasi</th>
                  <th className="py-3 px-3.5">Pos Anggaran</th>
                  <th className="py-3 px-3.5">Entitas</th>
                  <th className="py-3 px-3.5 text-right whitespace-nowrap">Penerimaan (Masuk)</th>
                  <th className="py-3 px-3.5 text-right whitespace-nowrap">Pengeluaran (Keluar)</th>
                  <th className="py-3 px-3.5 text-right whitespace-nowrap">Saldo Kas</th>
                  <th className="py-3 px-3.5">Penanggung Jawab</th>
                  {onDeleteEntry && <th className="py-3 px-3 text-center w-12">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {runningEntries.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-12 text-center text-slate-400">
                      <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-40 text-slate-400" />
                      <p className="font-semibold text-slate-700">Belum ada transaksi kas pada periode / kriteria ini.</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Klik tombol <strong>"Catat Transaksi Kas"</strong> untuk mencatat pemasukan atau pengeluaran baru.
                      </p>
                    </td>
                  </tr>
                ) : (
                  runningEntries.map((entry, idx) => (
                    <tr key={entry.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3.5 text-center font-mono text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-3.5 font-mono text-slate-700 whitespace-nowrap">
                        {entry.tanggal}
                      </td>
                      <td className="py-3 px-3.5 font-mono text-xs text-slate-600">
                        {entry.buktiRef ? (
                          <span className="bg-slate-100 px-2 py-0.5 rounded font-mono text-[11px] text-slate-700">
                            {entry.buktiRef}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-3.5">
                        <div className="font-semibold text-slate-900">
                          {entry.keterangan}
                        </div>
                      </td>
                      <td className="py-3 px-3.5">
                        <span className="inline-block bg-slate-100 px-2.5 py-0.5 rounded-full text-[10px] font-semibold text-slate-700 whitespace-nowrap">
                          {entry.kategori.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-slate-600 whitespace-nowrap text-[11px]">
                        {entry.kabKota ? (
                          <span className="text-amber-800 font-medium">PC {entry.kabKota.replace('Kab. ', '').replace('Kota ', '')}</span>
                        ) : (
                          <span className="text-emerald-800 font-medium">PW Sulsel</span>
                        )}
                      </td>
                      <td className="py-3 px-3.5 text-right font-mono font-bold text-emerald-700 whitespace-nowrap">
                        {entry.jenis === 'MASUK' ? formatRupiah(entry.nominal) : '-'}
                      </td>
                      <td className="py-3 px-3.5 text-right font-mono font-bold text-rose-700 whitespace-nowrap">
                        {entry.jenis === 'KELUAR' ? formatRupiah(entry.nominal) : '-'}
                      </td>
                      <td className="py-3 px-3.5 text-right font-mono font-bold text-slate-900 whitespace-nowrap bg-slate-50/60">
                        {formatRupiah(entry.saldo || 0)}
                      </td>
                      <td className="py-3 px-3.5 text-slate-600 text-xs">
                        {entry.penanggungJawab}
                      </td>
                      {onDeleteEntry && (
                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={() => {
                              if (window.confirm(`Hapus catatan transaksi: "${entry.keterangan}"?`)) {
                                onDeleteEntry(entry.id);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                            title="Hapus transaksi"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
              {runningEntries.length > 0 && (
                <tfoot className="bg-slate-100/80 font-bold border-t border-slate-200">
                  <tr>
                    <td colSpan={6} className="py-3 px-3.5 text-right text-slate-700">
                      TOTAL PERIODE INI:
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono text-emerald-800">
                      {formatRupiah(totalMasuk)}
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono text-rose-800">
                      {formatRupiah(totalKeluar)}
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono text-slate-900">
                      {formatRupiah(saldoBerjalan)}
                    </td>
                    <td colSpan={onDeleteEntry ? 2 : 1}></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: ANALISIS POS ANGGARAN & REALISASI */}
      {reportSubTab === 'ANALISIS_POS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Pos Penerimaan Kas */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Rincian Sumber Penerimaan Kas
                </h3>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-800">
                {formatRupiah(totalMasuk)}
              </span>
            </div>

            {Object.keys(categoryBreakdown.masukMap).length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">
                Belum ada data penerimaan pada periode ini.
              </p>
            ) : (
              <div className="space-y-3">
                {Object.entries(categoryBreakdown.masukMap).map(([category, amount]) => {
                  const pct = totalMasuk > 0 ? Math.round((amount / totalMasuk) * 100) : 0;
                  return (
                    <div key={category} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-slate-800">{category}</span>
                        <div className="flex items-center gap-2 font-mono">
                          <span className="font-bold text-emerald-800">{formatRupiah(amount)}</span>
                          <span className="text-slate-400 text-[11px]">({pct}%)</span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div 
                          className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pos Pengeluaran Kas */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Rincian Alokasi Belanja & Pengeluaran
                </h3>
              </div>
              <span className="text-xs font-mono font-bold text-rose-800">
                {formatRupiah(totalKeluar)}
              </span>
            </div>

            {Object.keys(categoryBreakdown.keluarMap).length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">
                Belum ada data pengeluaran pada periode ini.
              </p>
            ) : (
              <div className="space-y-3">
                {Object.entries(categoryBreakdown.keluarMap).map(([category, amount]) => {
                  const pct = totalKeluar > 0 ? Math.round((amount / totalKeluar) * 100) : 0;
                  return (
                    <div key={category} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-slate-800">{category}</span>
                        <div className="flex items-center gap-2 font-mono">
                          <span className="font-bold text-rose-800">{formatRupiah(amount)}</span>
                          <span className="text-slate-400 text-[11px]">({pct}%)</span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div 
                          className="bg-rose-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}

      {/* SUB-TAB 3: DISTRIBUSI AD/ART (60% PC, 25% PW, 15% PP) */}
      {reportSubTab === 'DISTRIBUSI_ADART' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Rekonsiliasi Distribusi Iuran Berdasarkan AD/ART & PO APRI
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Setiap iuran bulanan wajib sebesar Rp 50.000 secara otomatis dibagi secara proporsional ke 3 tingkatan organisasi:
            </p>
          </div>

          {/* 3 Pillars of Distribution */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            <div className="border border-emerald-300 bg-emerald-50/50 rounded-xl p-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-emerald-900 uppercase tracking-wide">
                  1. Pengurus Cabang (PC)
                </span>
                <span className="text-xs font-black bg-emerald-800 text-white px-2 py-0.5 rounded-full font-mono">
                  60%
                </span>
              </div>
              <div className="text-lg font-bold font-mono text-emerald-950 mt-2">
                Rp 30.000 <span className="text-xs font-normal text-slate-500">/ anggota / bulan</span>
              </div>
              <p className="text-[11px] text-slate-600 mt-2">
                Digunakan untuk operasional sekretariat cabang, Rakercab, Bimtek lokal KUA, dan santunan sosial duka cita anggota.
              </p>
              <div className="mt-3 pt-3 border-t border-emerald-200 text-xs flex justify-between font-mono">
                <span className="text-slate-500">Terkumpul Periode Ini:</span>
                <strong className="text-emerald-900">{formatRupiah(adArtStats.porsiPC)}</strong>
              </div>
            </div>

            <div className="border border-teal-300 bg-teal-50/50 rounded-xl p-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-teal-900 uppercase tracking-wide">
                  2. Pengurus Wilayah (PW)
                </span>
                <span className="text-xs font-black bg-teal-800 text-white px-2 py-0.5 rounded-full font-mono">
                  25%
                </span>
              </div>
              <div className="text-lg font-bold font-mono text-teal-950 mt-2">
                Rp 12.500 <span className="text-xs font-normal text-slate-500">/ anggota / bulan</span>
              </div>
              <p className="text-[11px] text-slate-600 mt-2">
                Digunakan untuk operasional PW Sulsel, Rakerwil, Bimtek Kepenghuluan Tingkat Provinsi, dan Advokasi Hukum.
              </p>
              <div className="mt-3 pt-3 border-t border-teal-200 text-xs flex justify-between font-mono">
                <span className="text-slate-500">Terkumpul Periode Ini:</span>
                <strong className="text-teal-900">{formatRupiah(adArtStats.porsiPW)}</strong>
              </div>
            </div>

            <div className="border border-slate-300 bg-slate-50/80 rounded-xl p-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  3. Pengurus Pusat (PP)
                </span>
                <span className="text-xs font-black bg-slate-800 text-white px-2 py-0.5 rounded-full font-mono">
                  15%
                </span>
              </div>
              <div className="text-lg font-bold font-mono text-slate-950 mt-2">
                Rp 7.500 <span className="text-xs font-normal text-slate-500">/ anggota / bulan</span>
              </div>
              <p className="text-[11px] text-slate-600 mt-2">
                Kewajiban setoran rutin ke rekening Pengurus Pusat (PP) APRI di Jakarta untuk agenda nasional (Munas, Rakernas).
              </p>
              <div className="mt-3 pt-3 border-t border-slate-200 text-xs flex justify-between font-mono">
                <span className="text-slate-500">Kewajiban Setoran:</span>
                <strong className="text-slate-900">{formatRupiah(adArtStats.porsiPP)}</strong>
              </div>
            </div>

          </div>

          {/* Regional Table (for Wilayah) or Member List (for Cabang) */}
          <div className="mt-4">
            <h4 className="text-xs font-bold text-slate-800 mb-3">
              {isCabang 
                ? `Daftar Kontribusi Iuran Anggota PC ${branchKabKota} Periode ${selectedBulan > 0 ? NAMA_BULAN[selectedBulan - 1] : ''} ${selectedTahun}`
                : `Tabel Rekonsiliasi Per Cabang 24 Kabupaten / Kota Se-Sulawesi Selatan`}
            </h4>

            {isCabang ? (
              <div className="border border-slate-200 rounded-xl overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">No</th>
                      <th className="py-2.5 px-3">Nama Penghulu</th>
                      <th className="py-2.5 px-3">KUA Kecamatan</th>
                      <th className="py-2.5 px-3 text-right">Iuran (100%)</th>
                      <th className="py-2.5 px-3 text-right text-emerald-800">Hak Cabang (60%)</th>
                      <th className="py-2.5 px-3 text-right text-teal-800">Hak Wilayah (25%)</th>
                      <th className="py-2.5 px-3 text-right text-slate-800">Setor Pusat (15%)</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paidRecordsInPeriod.filter(r => r.kabKota === branchKabKota).length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-6 text-center text-slate-400">
                          Belum ada pembayaran lunas dari anggota cabang {branchKabKota} pada periode ini.
                        </td>
                      </tr>
                    ) : (
                      paidRecordsInPeriod.filter(r => r.kabKota === branchKabKota).map((r, i) => (
                        <tr key={r.id} className="hover:bg-slate-50/70">
                          <td className="py-2.5 px-3 font-mono text-slate-400">{i + 1}</td>
                          <td className="py-2.5 px-3 font-semibold text-slate-900">{r.memberNama}</td>
                          <td className="py-2.5 px-3 text-slate-600">{r.kuaKecamatan}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-semibold">{formatRupiah(r.nominal)}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                            {formatRupiah(Math.round(r.nominal * 0.60))}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-teal-700">
                            {formatRupiah(Math.round(r.nominal * 0.25))}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                            {formatRupiah(Math.round(r.nominal * 0.15))}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-bold">
                              LUNAS
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">No</th>
                      <th className="py-2.5 px-3">Kabupaten / Kota</th>
                      <th className="py-2.5 px-3 text-center">Anggota Lunas</th>
                      <th className="py-2.5 px-3 text-right">Total Bruto (100%)</th>
                      <th className="py-2.5 px-3 text-right text-emerald-800">Hak Cabang (60%)</th>
                      <th className="py-2.5 px-3 text-right text-teal-800">Hak Wilayah (25%)</th>
                      <th className="py-2.5 px-3 text-right text-slate-800">Hak PP Pusat (15%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {KAB_KOTA_SULSEL.map((kab, idx) => {
                      const kabLunas = paidRecordsInPeriod.filter(r => r.kabKota === kab);
                      const totalBruto = kabLunas.reduce((acc, r) => acc + r.nominal, 0);
                      const pc = Math.round(totalBruto * 0.60);
                      const pw = Math.round(totalBruto * 0.25);
                      const pp = Math.round(totalBruto * 0.15);

                      return (
                        <tr key={kab} className="hover:bg-slate-50/70">
                          <td className="py-2 px-3 font-mono text-slate-400">{idx + 1}</td>
                          <td className="py-2 px-3 font-semibold text-slate-800">{kab}</td>
                          <td className="py-2 px-3 text-center font-mono">
                            <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px] font-semibold">
                              {kabLunas.length}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-semibold">
                            {formatRupiah(totalBruto)}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700">
                            {formatRupiah(pc)}
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-teal-700">
                            {formatRupiah(pw)}
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-slate-600">
                            {formatRupiah(pp)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
};
