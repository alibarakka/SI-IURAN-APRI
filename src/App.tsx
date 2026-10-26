import React, { useState, useMemo, useEffect } from 'react';
import { 
  Users, 
  CreditCard, 
  PieChart, 
  BookOpen, 
  Bell, 
  ShieldCheck, 
  Download, 
  FileSpreadsheet, 
  FileText, 
  Smartphone, 
  Laptop, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Plus, 
  Lock, 
  Unlock, 
  Building2, 
  MapPin, 
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Receipt,
  UserCheck,
  LogOut,
  User,
  ShieldAlert,
  RotateCcw
} from 'lucide-react';

import { 
  PenghuluMember, 
  IuranRecord, 
  CashFlowEntry, 
  NotificationLog, 
  RegionalSummary,
  AuthUser 
} from './types';
import { 
  INITIAL_MEMBERS, 
  INITIAL_CASH_FLOW, 
  INITIAL_NOTIFICATIONS, 
  KAB_KOTA_SULSEL, 
  NAMA_BULAN,
  IURAN_WAJIB_DEFAULT 
} from './data/mockData';
import { 
  formatRupiah, 
  exportToExcel, 
  generateRekapitulasiPDF, 
  generateKwitansiPDF, 
  generateLaporanKeuanganPDF 
} from './utils/exporter';
import { maskNIP, maskPhone, maskBank } from './utils/crypto';
import { PaymentModal } from './components/PaymentModal';
import { ReminderModal } from './components/ReminderModal';
import { MemberDetailModal } from './components/MemberDetailModal';
import { CashFlowModal } from './components/CashFlowModal';
import { MobileAppView } from './components/MobileAppView';
import { AuthScreen } from './components/AuthScreen';

const SEAL_IMAGE_URL = '/src/assets/images/apri_sulsel_seal_1792985704534.jpg';

export default function App() {
  // Authentication State
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem('apri_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Master Data state (Default empty as requested)
  const [members, setMembers] = useState<PenghuluMember[]>(() => {
    const saved = localStorage.getItem('apri_members_v2');
    return saved ? JSON.parse(saved) : INITIAL_MEMBERS;
  });

  const [records, setRecords] = useState<IuranRecord[]>(() => {
    const saved = localStorage.getItem('apri_records_v2');
    return saved ? JSON.parse(saved) : [];
  });

  const [cashFlow, setCashFlow] = useState<CashFlowEntry[]>(() => {
    const saved = localStorage.getItem('apri_cashflow_v2');
    return saved ? JSON.parse(saved) : INITIAL_CASH_FLOW;
  });

  const [notifications, setNotifications] = useState<NotificationLog[]>(() => {
    const saved = localStorage.getItem('apri_notifications_v2');
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  // UI state
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'ANGGOTA' | 'REKAPITULASI' | 'KEUANGAN' | 'PENGINGAT'>('DASHBOARD');
  const [deviceMode, setDeviceMode] = useState<'DESKTOP' | 'MOBILE'>('DESKTOP');
  const [isEncryptionActive, setIsEncryptionActive] = useState(true);

  // Filters
  const [selectedBulan, setSelectedBulan] = useState<number>(10); // Oktober 2026
  const [selectedTahun, setSelectedTahun] = useState<number>(2026);
  const [selectedKabKota, setSelectedKabKota] = useState<string>('SEMUA');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('SEMUA');

  // Modals state
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [activePaymentRecord, setActivePaymentRecord] = useState<IuranRecord | null>(null);
  const [reminderModalOpen, setReminderModalOpen] = useState(false);
  const [memberDetailModalOpen, setMemberDetailModalOpen] = useState(false);
  const [activeMemberDetail, setActiveMemberDetail] = useState<PenghuluMember | null>(null);
  const [cashFlowModalOpen, setCashFlowModalOpen] = useState(false);

  // Synchronize authentication and role adjustments
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('apri_current_user', JSON.stringify(currentUser));
      // If branch admin, lock or scope default filter to their branch
      if (currentUser.role === 'BENDAHARA_CABANG' && currentUser.kabKota) {
        setSelectedKabKota(currentUser.kabKota);
      }
      // If member, switch to mobile mode by default
      if (currentUser.role === 'ANGGOTA_PENGHULU') {
        setDeviceMode('MOBILE');
      }
    } else {
      localStorage.removeItem('apri_current_user');
    }
  }, [currentUser]);

  // Sync data to localStorage
  useEffect(() => {
    localStorage.setItem('apri_members_v2', JSON.stringify(members));
  }, [members]);

  useEffect(() => {
    localStorage.setItem('apri_records_v2', JSON.stringify(records));
  }, [records]);

  useEffect(() => {
    localStorage.setItem('apri_cashflow_v2', JSON.stringify(cashFlow));
  }, [cashFlow]);

  useEffect(() => {
    localStorage.setItem('apri_notifications_v2', JSON.stringify(notifications));
  }, [notifications]);

  // Handle new member registration
  const handleRegisterMember = (newMember: PenghuluMember) => {
    // 1. Add to members
    const updatedMembers = [newMember, ...members];
    setMembers(updatedMembers);

    // 2. Generate monthly iuran records for this member for 2026 (Januari s/d Oktober)
    const newRecords: IuranRecord[] = [];
    for (let month = 1; month <= 10; month++) {
      const monthStr = month < 10 ? `0${month}` : `${month}`;
      newRecords.push({
        id: `IUR-2026-${monthStr}-${newMember.id}`,
        memberId: newMember.id,
        memberNama: newMember.namaLengkap,
        nip: newMember.nip,
        kabKota: newMember.kabKota,
        kuaKecamatan: newMember.kuaKecamatan,
        periodeBulan: month,
        periodeTahun: 2026,
        nominal: IURAN_WAJIB_DEFAULT,
        status: 'BELUM_BAYAR',
        tanggalJatuhTempo: `2026-${monthStr}-10`
      });
    }

    setRecords(prev => [...newRecords, ...prev]);

    // 3. Emit registration welcome log
    const welcomeNotif: NotificationLog = {
      id: `NOTIF-REG-${Date.now()}`,
      memberId: newMember.id,
      memberNama: newMember.namaLengkap,
      noWa: newMember.noHpWa,
      kabKota: newMember.kabKota,
      kuaKecamatan: newMember.kuaKecamatan,
      periodeBulan: 10,
      periodeTahun: 2026,
      tipe: 'BROADCAST_BULANAN',
      channel: 'WhatsApp',
      statusKirim: 'Terkirim',
      timestamp: new Date().toLocaleString('id-ID'),
      pesan: `Ahlan wa Sahlan Bapak Penghulu ${newMember.namaLengkap} di APRI Sulawesi Selatan. KTA Digital dan akun portal iuran Anda telah aktif.`
    };

    setNotifications(prev => [welcomeNotif, ...prev]);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  // Filter records based on role, period, kab/kota, search
  const currentPeriodRecords = useMemo(() => {
    return records.filter(r => r.periodeBulan === selectedBulan && r.periodeTahun === selectedTahun);
  }, [records, selectedBulan, selectedTahun]);

  const filteredRecords = useMemo(() => {
    return currentPeriodRecords.filter(r => {
      // If branch admin, enforce their branch
      if (currentUser?.role === 'BENDAHARA_CABANG' && currentUser.kabKota) {
        if (r.kabKota !== currentUser.kabKota) return false;
      } else if (selectedKabKota !== 'SEMUA') {
        if (r.kabKota !== selectedKabKota) return false;
      }

      // If logged in as member, show only their own records in member view
      if (currentUser?.role === 'ANGGOTA_PENGHULU' && currentUser.nip) {
        if (r.nip !== currentUser.nip) return false;
      }

      const matchStatus = statusFilter === 'SEMUA' || r.status === statusFilter;
      const query = searchQuery.toLowerCase().trim();
      const matchQuery = !query || 
        r.memberNama.toLowerCase().includes(query) || 
        r.nip.includes(query) ||
        r.kuaKecamatan.toLowerCase().includes(query);
      return matchStatus && matchQuery;
    });
  }, [currentPeriodRecords, currentUser, selectedKabKota, statusFilter, searchQuery]);

  // Statistics calculation
  const stats = useMemo(() => {
    const scopeRecords = currentUser?.role === 'BENDAHARA_CABANG' && currentUser.kabKota
      ? currentPeriodRecords.filter(r => r.kabKota === currentUser.kabKota)
      : currentPeriodRecords;

    const totalRecordsInPeriod = scopeRecords.length;
    const lunasRecords = scopeRecords.filter(r => r.status === 'LUNAS');
    const belumBayarRecords = scopeRecords.filter(r => r.status === 'BELUM_BAYAR' || r.status === 'TERLAMBAT');
    const waitingRecords = scopeRecords.filter(r => r.status === 'MENUNGGU_VERIFIKASI');

    const totalDanaTerkumpul = lunasRecords.reduce((acc, curr) => acc + curr.nominal, 0);
    const totalTunggakan = belumBayarRecords.reduce((acc, curr) => acc + curr.nominal, 0);
    const persentaseKepatuhan = totalRecordsInPeriod > 0 
      ? Math.round((lunasRecords.length / totalRecordsInPeriod) * 100) 
      : 0;

    const totalPemasukanBKU = cashFlow
      .filter(c => c.jenis === 'MASUK')
      .reduce((acc, curr) => acc + curr.nominal, 0);
    const totalPengeluaranBKU = cashFlow
      .filter(c => c.jenis === 'KELUAR')
      .reduce((acc, curr) => acc + curr.nominal, 0);
    const saldoKasSaatIni = totalPemasukanBKU - totalPengeluaranBKU;

    return {
      totalRecordsInPeriod,
      lunasCount: lunasRecords.length,
      belumBayarCount: belumBayarRecords.length,
      waitingCount: waitingRecords.length,
      totalDanaTerkumpul,
      totalTunggakan,
      persentaseKepatuhan,
      saldoKasSaatIni,
      totalPemasukanBKU,
      totalPengeluaranBKU,
      pendingMembers: belumBayarRecords
    };
  }, [currentPeriodRecords, cashFlow, currentUser]);

  // Regional breakdown
  const regionalSummaries: RegionalSummary[] = useMemo(() => {
    return KAB_KOTA_SULSEL.map(kab => {
      const kabRecords = currentPeriodRecords.filter(r => r.kabKota === kab);
      const total = kabRecords.length;
      const lunas = kabRecords.filter(r => r.status === 'LUNAS').length;
      const belum = kabRecords.filter(r => r.status === 'BELUM_BAYAR' || r.status === 'TERLAMBAT').length;
      const terkumpul = kabRecords.filter(r => r.status === 'LUNAS').reduce((sum, r) => sum + r.nominal, 0);
      const pct = total > 0 ? Math.round((lunas / total) * 100) : 0;

      return {
        kabKota: kab,
        totalAnggota: total,
        lunasCount: lunas,
        belumBayarCount: belum,
        totalTerkumpul: terkumpul,
        persentaseKepatuhan: pct
      };
    }).sort((a, b) => b.persentaseKepatuhan - a.persentaseKepatuhan);
  }, [currentPeriodRecords]);

  // Payment success handler
  const handlePaymentSuccess = (updatedRecord: IuranRecord) => {
    setRecords(prev => prev.map(r => r.id === updatedRecord.id ? updatedRecord : r));

    const newCashEntry: CashFlowEntry = {
      id: `BKU-${selectedTahun}-${Date.now().toString().slice(-4)}`,
      tanggal: updatedRecord.tanggalBayar || new Date().toISOString().split('T')[0],
      jenis: 'MASUK',
      kategori: 'IURAN_ANGGOTA',
      nominal: updatedRecord.nominal,
      keterangan: `Penerimaan Iuran ${NAMA_BULAN[updatedRecord.periodeBulan - 1]} ${updatedRecord.periodeTahun} - ${updatedRecord.memberNama} (${updatedRecord.metodePembayaran})`,
      buktiRef: updatedRecord.kodeKwitansi,
      penanggungJawab: currentUser?.namaLengkap || 'Gateway Otomatis APRI Sulsel',
      periodeBulan: updatedRecord.periodeBulan,
      periodeTahun: updatedRecord.periodeTahun,
      kabKota: updatedRecord.kabKota
    };
    setCashFlow(prev => [newCashEntry, ...prev]);

    const newNotif: NotificationLog = {
      id: `NOTIF-${Date.now().toString().slice(-4)}`,
      memberId: updatedRecord.memberId,
      memberNama: updatedRecord.memberNama,
      noWa: '081242338899',
      kabKota: updatedRecord.kabKota,
      kuaKecamatan: updatedRecord.kuaKecamatan,
      periodeBulan: updatedRecord.periodeBulan,
      periodeTahun: updatedRecord.periodeTahun,
      tipe: 'KONFIRMASI_LUNAS',
      channel: 'WhatsApp',
      statusKirim: 'Terkirim',
      timestamp: new Date().toLocaleString('id-ID'),
      pesan: `Alhamdulillah, pembayaran iuran PW APRI Sulsel sebesar ${formatRupiah(updatedRecord.nominal)} telah diverifikasi sah secara real-time. No. Kwitansi: ${updatedRecord.kodeKwitansi}.`
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  // Bulk reminder dispatch
  const handleSendBulkReminders = (pendingList: IuranRecord[], templateKey: string) => {
    const timestamp = new Date().toLocaleString('id-ID');
    const newLogs: NotificationLog[] = pendingList.map((rec, idx) => ({
      id: `NOTIF-BULK-${Date.now()}-${idx}`,
      memberId: rec.memberId,
      memberNama: rec.memberNama,
      noWa: '081242338899',
      kabKota: rec.kabKota,
      kuaKecamatan: rec.kuaKecamatan,
      periodeBulan: rec.periodeBulan,
      periodeTahun: rec.periodeTahun,
      tipe: templateKey as any,
      channel: 'WhatsApp',
      statusKirim: 'Terkirim',
      timestamp,
      pesan: `Assalamu'alaikum Wr. Wb. Yth. Bapak ${rec.memberNama}. Mengingatkan kewajiban iuran rutin PW APRI Sulawesi Selatan periode ${NAMA_BULAN[rec.periodeBulan - 1]} ${rec.periodeTahun} sebesar Rp 50.000. Mohon kesediaannya untuk verifikasi/bayar via QRIS/VA APRI Sulsel. Syukron Katsiran.`
    }));

    setNotifications(prev => [...newLogs, ...prev]);
  };

  const handleAddCashEntry = (entry: CashFlowEntry) => {
    setCashFlow(prev => [entry, ...prev]);
  };

  // Excel exports
  const handleExportIuranExcel = () => {
    const headers = ['No', 'Nama Penghulu', 'NIP', 'Kabupaten / Kota', 'KUA Kecamatan', 'Periode', 'Nominal', 'Status', 'Metode', 'Tgl Bayar', 'No. Resi'];
    const rows = filteredRecords.map((r, i) => [
      i + 1,
      r.memberNama,
      r.nip,
      r.kabKota,
      r.kuaKecamatan,
      `${NAMA_BULAN[r.periodeBulan - 1]} ${r.periodeTahun}`,
      r.nominal,
      r.status,
      r.metodePembayaran || '-',
      r.tanggalBayar || '-',
      r.kodeKwitansi || '-'
    ]);
    exportToExcel(
      `Rekap_Iuran_APRI_Sulsel_${NAMA_BULAN[selectedBulan - 1]}_${selectedTahun}`,
      headers,
      rows,
      `REKAPITULASI IURAN ANGGOTA APRI SULAWESI SELATAN - ${NAMA_BULAN[selectedBulan - 1].toUpperCase()} ${selectedTahun}`
    );
  };

  const handleExportMembersExcel = () => {
    const headers = ['No', 'Nama Lengkap & Gelar', 'NIP', 'Jabatan', 'KUA Kecamatan', 'Kabupaten/Kota', 'No. WhatsApp', 'Email', 'Bank', 'No. Rekening', 'Status'];
    const rows = members.map((m, i) => [
      i + 1,
      m.namaLengkap,
      isEncryptionActive ? maskNIP(m.nip) : m.nip,
      m.jabatan,
      m.kuaKecamatan,
      m.kabKota,
      isEncryptionActive ? maskPhone(m.noHpWa) : m.noHpWa,
      m.email,
      m.rekeningBank.namaBank,
      isEncryptionActive ? maskBank(m.rekeningBank.noRek) : m.rekeningBank.noRek,
      m.statusKeanggotaan
    ]);
    exportToExcel('Data_Anggota_Penghulu_APRI_Sulsel', headers, rows, 'MASTER DATA ANGGOTA PENGHULU APRI SULAWESI SELATAN');
  };

  const handleExportCashFlowExcel = () => {
    const headers = ['No', 'Tanggal', 'Jenis', 'Kategori Pos', 'Uraian', 'Nominal (Rp)', 'Bukti Ref', 'Penanggung Jawab'];
    const rows = cashFlow.map((c, i) => [
      i + 1,
      c.tanggal,
      c.jenis === 'MASUK' ? 'Pemasukan' : 'Pengeluaran',
      c.kategori.replace('_', ' '),
      c.keterangan,
      c.nominal,
      c.buktiRef || '-',
      c.penanggungJawab
    ]);
    exportToExcel('Buku_Kas_Umum_APRI_Sulsel_2026', headers, rows, 'BUKU KAS UMUM (BKU) PW APRI SULAWESI SELATAN TAHUN 2026');
  };

  // If user is not authenticated, show AuthScreen
  if (!currentUser) {
    return (
      <AuthScreen
        onLoginSuccess={(user) => setCurrentUser(user)}
        onRegisterMember={handleRegisterMember}
        members={members}
        sealImageUrl={SEAL_IMAGE_URL}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 selection:bg-emerald-100 selection:text-emerald-900">
      
      {/* 
        ========================================================================
        TOP BAR CONTRACT:
        Zone 1: Single text wordmark
        Zone 2: 4-5 concise single-line nav links
        Zone 3: 1 primary action
        ========================================================================
      */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-8 h-16">
          
          {/* Zone 1: Single element brand wordmark */}
          <div className="flex items-center gap-3 whitespace-nowrap shrink-0">
            <img 
              src={SEAL_IMAGE_URL} 
              alt="APRI Sulsel" 
              className="w-9 h-9 object-contain rounded-full shadow-xs"
              referrerPolicy="no-referrer"
            />
            <span className="text-base font-bold tracking-tight text-slate-900">
              SI-IURAN APRI Sulsel
            </span>
          </div>

          {/* Zone 2: 4-5 clean single-line nav links */}
          <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold text-slate-600">
            <button
              onClick={() => setActiveTab('DASHBOARD')}
              className={`hover:text-emerald-800 transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'DASHBOARD' ? 'text-emerald-800 font-bold' : ''
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('REKAPITULASI')}
              className={`hover:text-emerald-800 transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'REKAPITULASI' ? 'text-emerald-800 font-bold' : ''
              }`}
            >
              Rekapitulasi Iuran
            </button>
            <button
              onClick={() => setActiveTab('ANGGOTA')}
              className={`hover:text-emerald-800 transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'ANGGOTA' ? 'text-emerald-800 font-bold' : ''
              }`}
            >
              Data Anggota ({members.length})
            </button>
            <button
              onClick={() => setActiveTab('KEUANGAN')}
              className={`hover:text-emerald-800 transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'KEUANGAN' ? 'text-emerald-800 font-bold' : ''
              }`}
            >
              Buku Kas (BKU)
            </button>
            <button
              onClick={() => setActiveTab('PENGINGAT')}
              className={`hover:text-emerald-800 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                activeTab === 'PENGINGAT' ? 'text-emerald-800 font-bold' : ''
              }`}
            >
              <span>Notifikasi Jatuh Tempo</span>
              {stats.belumBayarCount > 0 && (
                <span className="text-[10px] font-mono px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded-full">
                  {stats.belumBayarCount}
                </span>
              )}
            </button>
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setReminderModalOpen(true)}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Kirim Pengingat ({stats.belumBayarCount})</span>
            </button>

            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="p-2 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl border border-slate-200 transition-colors"
              title="Keluar dari akun"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>
      </header>

      {/* Secondary Workspace Toolbar */}
      <div className="bg-slate-100/80 border-b border-slate-200 px-4 sm:px-6 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          
          {/* User Role Badge & Breadcrumb */}
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
              currentUser.role === 'BENDAHARA_WILAYAH'
                ? 'bg-emerald-800 text-white'
                : (currentUser.role === 'BENDAHARA_CABANG' ? 'bg-amber-600 text-white' : 'bg-slate-700 text-white')
            }`}>
              {currentUser.role === 'BENDAHARA_WILAYAH' 
                ? 'ADMIN BENDAHARA WILAYAH (PW SULSEL)' 
                : (currentUser.role === 'BENDAHARA_CABANG' 
                    ? `ADMIN BENDAHARA PC (${currentUser.kabKota})` 
                    : 'ANGGOTA PENGHULU KUA')}
            </span>
            <span className="text-slate-500 hidden sm:inline">|</span>
            <span className="font-semibold text-slate-800 hidden sm:inline">
              {currentUser.namaLengkap}
            </span>
          </div>

          {/* Tools & View Switchers */}
          <div className="flex items-center gap-2">
            
            {/* View Switcher: Web vs Mobile App */}
            <div className="flex items-center p-0.5 bg-slate-200/80 rounded-lg">
              <button
                onClick={() => setDeviceMode('DESKTOP')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                  deviceMode === 'DESKTOP'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Laptop className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Web Admin</span>
              </button>
              <button
                onClick={() => setDeviceMode('MOBILE')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                  deviceMode === 'MOBILE'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Mobile Penghulu</span>
              </button>
            </div>

            {/* AES-256 Privacy Toggle */}
            <button
              onClick={() => setIsEncryptionActive(!isEncryptionActive)}
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors ${
                isEncryptionActive
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                  : 'border-slate-300 bg-white text-slate-700'
              }`}
              title="Kepatuhan UU Perlindungan Data Pribadi (AES-256-GCM)"
            >
              {isEncryptionActive ? <Lock className="w-3 h-3 text-emerald-700" /> : <Unlock className="w-3 h-3" />}
              <span>{isEncryptionActive ? 'Enkripsi Data: Aktif' : 'Enkripsi: Dibuka'}</span>
            </button>

          </div>

        </div>
      </div>

      {/* Main Body View */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        
        {/* If Mobile App mode is chosen */}
        {deviceMode === 'MOBILE' ? (
          <MobileAppView
            members={members.length > 0 ? members : [
              {
                id: 'MEM-000',
                nip: currentUser.nip || '198001012005011001',
                namaLengkap: currentUser.namaLengkap,
                jabatan: (currentUser.jabatan as any) || 'Penghulu Ahli Muda',
                kuaKecamatan: currentUser.kuaKecamatan || 'KUA Kecamatan',
                kabKota: currentUser.kabKota || 'Kota Makassar',
                noHpWa: '081242338899',
                email: currentUser.email,
                rekeningBank: {
                  namaBank: 'Bank Sulselbar Syariah',
                  noRek: '510000000000',
                  atasNama: currentUser.namaLengkap
                },
                statusKeanggotaan: 'Aktif',
                joinDate: '2026-01-01'
              }
            ]}
            records={records}
            onOpenPayment={(r) => {
              setActivePaymentRecord(r);
              setPaymentModalOpen(true);
            }}
            onViewMemberDetail={(m) => {
              setActiveMemberDetail(m);
              setMemberDetailModalOpen(true);
            }}
            currentBulan={selectedBulan}
            currentTahun={selectedTahun}
            sealImageUrl={SEAL_IMAGE_URL}
          />
        ) : (
          /* DESKTOP WEB ADMIN PORTAL */
          <div className="space-y-6">

            {/* Navigation Tab pills for Mobile / Tablet screens */}
            <div className="flex lg:hidden overflow-x-auto gap-2 pb-2">
              {[
                { id: 'DASHBOARD', label: 'Dashboard' },
                { id: 'REKAPITULASI', label: 'Rekapitulasi Iuran' },
                { id: 'ANGGOTA', label: `Data Anggota (${members.length})` },
                { id: 'KEUANGAN', label: 'Buku Kas (BKU)' },
                { id: 'PENGINGAT', label: `Pengingat (${stats.belumBayarCount})` },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-emerald-800 text-white'
                      : 'bg-white border border-slate-200 text-slate-600'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Empty State Banner if no members yet */}
            {members.length === 0 && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-3">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto">
                  <UserCheck className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Data Bawaan Telah Dikosongkan (Sistem Siap Digunakan)
                </h3>
                <p className="text-xs text-slate-600 max-w-lg mx-auto leading-relaxed">
                  Data anggota telah bersih dari data bawaan. Anggota penghulu KUA se-Sulawesi Selatan dapat mendaftarkan diri secara mandiri melalui tombol pendaftaran di bawah atau halaman login.
                </p>
                <div className="pt-2 flex items-center justify-center gap-3">
                  <button
                    onClick={() => handleLogout()}
                    className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
                  >
                    Buka Formulir Pendaftaran Anggota
                  </button>
                </div>
              </div>
            )}

            {/* TAB 1: DASHBOARD UTAMA */}
            {activeTab === 'DASHBOARD' && (
              <div className="space-y-6">
                
                {/* 4-KPI Metric Strip */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  
                  {/* KPI 1: Total Iuran Masuk Periode Ini */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                      <span>Iuran Masuk ({NAMA_BULAN[selectedBulan - 1]})</span>
                      <span className="text-emerald-700 font-semibold">{stats.lunasCount}/{stats.totalRecordsInPeriod} Lunas</span>
                    </div>
                    <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
                      {formatRupiah(stats.totalDanaTerkumpul)}
                    </div>
                    <div className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                      <span className="text-emerald-700 font-semibold">{stats.persentaseKepatuhan}%</span>
                      <span>Kepatuhan bayar bulan ini</span>
                    </div>
                  </div>

                  {/* KPI 2: Tunggakan Belum Bayar */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                      <span>Tunggakan Dues</span>
                      <span className="text-amber-700 font-semibold">{stats.belumBayarCount} Penghulu</span>
                    </div>
                    <div className="text-2xl font-bold font-mono tabular-nums text-amber-700">
                      {formatRupiah(stats.totalTunggakan)}
                    </div>
                    <div className="text-xs text-slate-500 mt-2">
                      Jatuh tempo setiap tanggal 10
                    </div>
                  </div>

                  {/* KPI 3: Saldo Kas Organisasi APRI (BKU) */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                      <span>Saldo Kas Organisasi</span>
                      <TrendingUp className="w-4 h-4 text-emerald-700" />
                    </div>
                    <div className="text-2xl font-bold font-mono tabular-nums text-emerald-800">
                      {formatRupiah(stats.saldoKasSaatIni)}
                    </div>
                    <div className="text-xs text-slate-500 mt-2">
                      {currentUser.role === 'BENDAHARA_CABANG' ? `Kas Cabang ${currentUser.kabKota}` : 'Kas Wilayah APRI Sulsel'}
                    </div>
                  </div>

                  {/* KPI 4: Total Anggota Terdaftar */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                      <span>Anggota Terdaftar</span>
                      <Users className="w-4 h-4 text-emerald-700" />
                    </div>
                    <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
                      {members.length} Penghulu
                    </div>
                    <div className="text-xs text-slate-500 mt-2">
                      KUA se-Sulawesi Selatan
                    </div>
                  </div>

                </div>

                {/* Split 2-Column: Quick Gateway Reconciliation & Regional Leaderboard */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Left 2 Cols: Real-time Gateway Transactions */}
                  <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-base font-bold text-slate-900">
                          Rekapitulasi Iuran Anggota Bulan {NAMA_BULAN[selectedBulan - 1]} {selectedTahun}
                        </h3>
                        <p className="text-xs text-slate-500">
                          Status verifikasi otomatis via Payment Gateway QRIS & Virtual Account Bank Sulselbar / BSI
                        </p>
                      </div>

                      <button
                        onClick={() => setActiveTab('REKAPITULASI')}
                        className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 flex items-center gap-1"
                      >
                        Lihat Semua Rekap <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Table of records */}
                    <div className="border border-slate-200 rounded-xl overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                          <tr>
                            <th className="py-2.5 px-3">Penghulu</th>
                            <th className="py-2.5 px-3">KUA / Wilayah</th>
                            <th className="py-2.5 px-3 text-right">Nominal</th>
                            <th className="py-2.5 px-3 text-center">Status</th>
                            <th className="py-2.5 px-3 text-right">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredRecords.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="py-8 text-center text-slate-400">
                                Belum ada data iuran pada periode ini. Data akan otomatis muncul ketika anggota terdaftar.
                              </td>
                            </tr>
                          ) : (
                            filteredRecords.slice(0, 6).map((rec) => {
                              const member = members.find(m => m.id === rec.memberId);
                              return (
                                <tr key={rec.id} className="hover:bg-slate-50/70 transition-colors">
                                  <td className="py-2.5 px-3">
                                    <div className="font-semibold text-slate-900">{rec.memberNama}</div>
                                    <div className="text-[11px] font-mono text-slate-400">
                                      NIP: {isEncryptionActive ? maskNIP(rec.nip) : rec.nip}
                                    </div>
                                  </td>
                                  <td className="py-2.5 px-3 text-slate-600">
                                    <div>{rec.kuaKecamatan}</div>
                                    <div className="text-[11px] text-slate-400">{rec.kabKota}</div>
                                  </td>
                                  <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900">
                                    {formatRupiah(rec.nominal)}
                                  </td>
                                  <td className="py-2.5 px-3 text-center">
                                    {rec.status === 'LUNAS' ? (
                                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                                        <CheckCircle2 className="w-3 h-3" /> Lunas
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                                        <Clock className="w-3 h-3" /> {rec.status.replace('_', ' ')}
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-2.5 px-3 text-right">
                                    {rec.status === 'LUNAS' ? (
                                      <button
                                        onClick={() => generateKwitansiPDF(rec, member)}
                                        className="px-2.5 py-1 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md text-[11px] font-medium transition-colors"
                                        title="Cetak Kwitansi PDF"
                                      >
                                        Kwitansi
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => {
                                          setActivePaymentRecord(rec);
                                          setPaymentModalOpen(true);
                                        }}
                                        className="px-2.5 py-1 text-white bg-emerald-800 hover:bg-emerald-700 rounded-md text-[11px] font-semibold transition-colors"
                                      >
                                        Bayar Gateway
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>

                    <div className="pt-2 flex items-center justify-between text-xs text-slate-500">
                      <span>Menampilkan rekapitulasi periode {NAMA_BULAN[selectedBulan - 1]}</span>
                      <div className="flex gap-2">
                        <button
                          onClick={handleExportIuranExcel}
                          disabled={filteredRecords.length === 0}
                          className="px-3 py-1.5 border border-slate-300 rounded-lg hover:bg-slate-50 font-medium text-slate-700 flex items-center gap-1.5 transition-colors disabled:opacity-50"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Ekspor Excel</span>
                        </button>
                        <button
                          onClick={() => generateRekapitulasiPDF(
                            currentPeriodRecords, 
                            selectedBulan, 
                            selectedTahun, 
                            stats.lunasCount, 
                            stats.belumBayarCount, 
                            stats.totalDanaTerkumpul
                          )}
                          disabled={currentPeriodRecords.length === 0}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Cetak Rekap PDF</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Right 1 Col: Regional Compliance Ranking (24 Kab/Kota Sulsel) */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-base font-bold text-slate-900">
                          Kepatuhan Per Wilayah
                        </h3>
                        <span className="text-xs font-bold text-emerald-800 font-mono">
                          {stats.persentaseKepatuhan}% Total
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mb-4">
                        Peringkat kepatuhan pembayaran iuran per cabang Kab/Kota
                      </p>

                      <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                        {regionalSummaries.slice(0, 8).map((reg, idx) => (
                          <div key={reg.kabKota} className="text-xs">
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-semibold text-slate-800">
                                {idx + 1}. {reg.kabKota.replace('Kab. ', '').replace('Kota ', '')}
                              </span>
                              <span className="font-mono text-slate-500">
                                {reg.lunasCount}/{reg.totalAnggota} ({reg.persentaseKepatuhan}%)
                              </span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all duration-500 ${
                                  reg.persentaseKepatuhan >= 80 
                                    ? 'bg-emerald-600' 
                                    : (reg.persentaseKepatuhan >= 50 ? 'bg-amber-500' : 'bg-slate-400')
                                }`}
                                style={{ width: `${reg.persentaseKepatuhan}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
                      Sistem rekapitulasi memperbarui data pembayaran real-time setiap transaksi diverifikasi.
                    </div>
                  </div>

                </div>

              </div>
            )}

            {/* TAB 2: REKAPITULASI IURAN ANGGOTA */}
            {activeTab === 'REKAPITULASI' && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
                
                {/* Header & Controls */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      Rekapitulasi Iuran Anggota APRI Sulsel
                    </h3>
                    <p className="text-xs text-slate-500">
                      Pemantauan dan verifikasi pembayaran iuran wajib Rp 50.000 / bulan
                    </p>
                  </div>

                  {/* Period and Export Buttons */}
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={selectedBulan}
                      onChange={(e) => setSelectedBulan(Number(e.target.value))}
                      className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-emerald-600"
                    >
                      {NAMA_BULAN.map((bulan, idx) => (
                        <option key={bulan} value={idx + 1}>
                          {bulan}
                        </option>
                      ))}
                    </select>

                    <select
                      value={selectedTahun}
                      onChange={(e) => setSelectedTahun(Number(e.target.value))}
                      className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-emerald-600"
                    >
                      <option value={2026}>2026</option>
                      <option value={2025}>2025</option>
                    </select>

                    <button
                      onClick={handleExportIuranExcel}
                      disabled={filteredRecords.length === 0}
                      className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>Ekspor Excel</span>
                    </button>

                    <button
                      onClick={() => generateRekapitulasiPDF(
                        filteredRecords,
                        selectedBulan,
                        selectedTahun,
                        stats.lunasCount,
                        stats.belumBayarCount,
                        stats.totalDanaTerkumpul
                      )}
                      disabled={filteredRecords.length === 0}
                      className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Cetak PDF Resmi</span>
                    </button>
                  </div>
                </div>

                {/* Filter & Search Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="Cari nama penghulu, NIP, atau KUA..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 focus:outline-emerald-600"
                    />
                  </div>

                  <select
                    value={selectedKabKota}
                    onChange={(e) => setSelectedKabKota(e.target.value)}
                    disabled={currentUser.role === 'BENDAHARA_CABANG'}
                    className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-emerald-600 disabled:opacity-75"
                  >
                    {currentUser.role === 'BENDAHARA_WILAYAH' && (
                      <option value="SEMUA">Semua 24 Kab / Kota di Sulsel</option>
                    )}
                    {KAB_KOTA_SULSEL.map(k => (
                      <option key={k} value={k}>{k}</option>
                    ))}
                  </select>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-emerald-600"
                  >
                    <option value="SEMUA">Semua Status Pembayaran</option>
                    <option value="LUNAS">Lunas</option>
                    <option value="BELUM_BAYAR">Belum Bayar</option>
                    <option value="MENUNGGU_VERIFIKASI">Menunggu Verifikasi</option>
                    <option value="TERLAMBAT">Terlambat</option>
                  </select>
                </div>

                {/* Records Table */}
                <div className="border border-slate-200 rounded-xl overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4">No</th>
                        <th className="py-3 px-4">Nama Penghulu & NIP</th>
                        <th className="py-3 px-4">KUA Kecamatan / Kab-Kota</th>
                        <th className="py-3 px-4 text-center">Jatuh Tempo</th>
                        <th className="py-3 px-4 text-right">Nominal</th>
                        <th className="py-3 px-4 text-center">Status</th>
                        <th className="py-3 px-4 text-center">Tgl Bayar & Saluran</th>
                        <th className="py-3 px-4 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredRecords.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-slate-500">
                            Tidak ditemukan data iuran dengan kriteria pencarian di atas.
                          </td>
                        </tr>
                      ) : (
                        filteredRecords.map((rec, index) => {
                          const member = members.find(m => m.id === rec.memberId);
                          return (
                            <tr key={rec.id} className="hover:bg-slate-50/70 transition-colors">
                              <td className="py-3 px-4 font-mono text-slate-400">{index + 1}</td>
                              <td className="py-3 px-4">
                                <div 
                                  onClick={() => {
                                    if (member) {
                                      setActiveMemberDetail(member);
                                      setMemberDetailModalOpen(true);
                                    }
                                  }}
                                  className="font-bold text-slate-900 hover:text-emerald-800 cursor-pointer"
                                >
                                  {rec.memberNama}
                                </div>
                                <div className="text-[11px] font-mono text-slate-400">
                                  NIP: {isEncryptionActive ? maskNIP(rec.nip) : rec.nip}
                                </div>
                              </td>
                              <td className="py-3 px-4 text-slate-600">
                                <div>{rec.kuaKecamatan}</div>
                                <div className="text-[11px] text-slate-400">{rec.kabKota}</div>
                              </td>
                              <td className="py-3 px-4 text-center font-mono text-slate-600">
                                {rec.tanggalJatuhTempo}
                              </td>
                              <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                                {formatRupiah(rec.nominal)}
                              </td>
                              <td className="py-3 px-4 text-center">
                                {rec.status === 'LUNAS' && (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
                                    <CheckCircle2 className="w-3 h-3" /> Lunas
                                  </span>
                                )}
                                {rec.status === 'BELUM_BAYAR' && (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md">
                                    <Clock className="w-3 h-3" /> Belum Bayar
                                  </span>
                                )}
                                {rec.status === 'MENUNGGU_VERIFIKASI' && (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md">
                                    <Clock className="w-3 h-3" /> Verifikasi
                                  </span>
                                )}
                                {rec.status === 'TERLAMBAT' && (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-800 bg-rose-100 px-2.5 py-1 rounded-md">
                                    <AlertCircle className="w-3 h-3" /> Terlambat
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-center text-slate-600">
                                {rec.tanggalBayar ? (
                                  <div>
                                    <span className="font-mono">{rec.tanggalBayar}</span>
                                    <div className="text-[10px] text-slate-400">
                                      {rec.metodePembayaran?.replace('_', ' ')}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-slate-400">-</span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-right">
                                {rec.status === 'LUNAS' ? (
                                  <button
                                    onClick={() => generateKwitansiPDF(rec, member)}
                                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ml-auto"
                                    title="Unduh Kwitansi PDF Sah"
                                  >
                                    <Receipt className="w-3.5 h-3.5 text-emerald-700" />
                                    <span>Kwitansi</span>
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => {
                                      setActivePaymentRecord(rec);
                                      setPaymentModalOpen(true);
                                    }}
                                    className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center gap-1 ml-auto"
                                  >
                                    <CreditCard className="w-3.5 h-3.5" />
                                    <span>Bayar / Verifikasi</span>
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

              </div>
            )}

            {/* TAB 3: DATA ANGGOTA PENGHULU */}
            {activeTab === 'ANGGOTA' && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      Master Data Anggota Penghulu APRI Sulawesi Selatan
                    </h3>
                    <p className="text-xs text-slate-500">
                      Total {members.length} anggota penghulu KUA aktif terdaftar di sistem
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleExportMembersExcel}
                      disabled={members.length === 0}
                      className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>Ekspor Excel</span>
                    </button>
                  </div>
                </div>

                {/* Members Grid / Cards */}
                {members.length === 0 ? (
                  <div className="py-12 text-center text-slate-400">
                    <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="font-semibold text-slate-700">Belum ada anggota terdaftar.</p>
                    <p className="text-xs text-slate-400 mt-1">Data akan terisi ketika penghulu melakukan pendaftaran.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {members.map(member => (
                      <div 
                        key={member.id} 
                        className="border border-slate-200 rounded-xl p-4 hover:border-emerald-500/60 transition-all bg-white hover:shadow-xs flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-start justify-between">
                            <div>
                              <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-800">
                                {member.jabatan}
                              </span>
                              <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                                {member.namaLengkap} {member.gelarBelakang && `, ${member.gelarBelakang}`}
                              </h4>
                              <div className="text-xs text-slate-500 mt-0.5">
                                {member.kuaKecamatan} · {member.kabKota}
                              </div>
                            </div>
                            <span className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 text-xs font-bold">
                              {member.id.replace('MEM-', '')}
                            </span>
                          </div>

                          <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs">
                            <div className="flex justify-between">
                              <span className="text-slate-400">NIP:</span>
                              <span className="font-mono text-slate-700">
                                {isEncryptionActive ? maskNIP(member.nip) : member.nip}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">WhatsApp:</span>
                              <span className="font-mono text-slate-700">
                                {isEncryptionActive ? maskPhone(member.noHpWa) : member.noHpWa}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Rekening:</span>
                              <span className="font-mono text-slate-700 truncate max-w-[170px]">
                                {member.rekeningBank.namaBank} · {isEncryptionActive ? maskBank(member.rekeningBank.noRek) : member.rekeningBank.noRek}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                            {member.statusKeanggotaan}
                          </span>
                          <button
                            onClick={() => {
                              setActiveMemberDetail(member);
                              setMemberDetailModalOpen(true);
                            }}
                            className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                          >
                            <span>Lihat KTA</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: BUKU KAS UMUM (BKU) */}
            {activeTab === 'KEUANGAN' && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      Buku Kas Umum (BKU) & Laporan Keuangan Organisasi
                    </h3>
                    <p className="text-xs text-slate-500">
                      Penerimaan iuran, kas operasional sekretariat, dana santunan, dan kegiatan Bimtek Penghulu
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCashFlowModalOpen(true)}
                      className="px-3.5 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Catat Transaksi Kas</span>
                    </button>
                    <button
                      onClick={handleExportCashFlowExcel}
                      disabled={cashFlow.length === 0}
                      className="px-3.5 py-2 border border-slate-300 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Ekspor Excel</span>
                    </button>
                    <button
                      onClick={() => generateLaporanKeuanganPDF(
                        cashFlow,
                        selectedBulan,
                        selectedTahun,
                        stats.totalPemasukanBKU,
                        stats.totalPengeluaranBKU,
                        stats.saldoKasSaatIni
                      )}
                      disabled={cashFlow.length === 0}
                      className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Cetak Laporan PDF</span>
                    </button>
                  </div>
                </div>

                {/* Financial Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-4">
                    <span className="text-xs text-emerald-800 font-semibold flex items-center gap-1">
                      <ArrowDownLeft className="w-4 h-4 text-emerald-700" /> Total Penerimaan Kas
                    </span>
                    <div className="text-xl font-bold font-mono text-emerald-900 mt-1">
                      {formatRupiah(stats.totalPemasukanBKU)}
                    </div>
                  </div>

                  <div className="bg-rose-50/60 border border-rose-200 rounded-xl p-4">
                    <span className="text-xs text-rose-800 font-semibold flex items-center gap-1">
                      <ArrowUpRight className="w-4 h-4 text-rose-700" /> Total Pengeluaran Kas
                    </span>
                    <div className="text-xl font-bold font-mono text-rose-900 mt-1">
                      {formatRupiah(stats.totalPengeluaranBKU)}
                    </div>
                  </div>

                  <div className="bg-slate-900 text-white rounded-xl p-4">
                    <span className="text-xs text-slate-300 font-semibold">
                      Saldo Kas Organisasi
                    </span>
                    <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
                      {formatRupiah(stats.saldoKasSaatIni)}
                    </div>
                  </div>
                </div>

                {/* Cash flow entries table */}
                <div className="border border-slate-200 rounded-xl overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Tanggal</th>
                        <th className="py-2.5 px-3">Uraian / Keterangan Transaksi</th>
                        <th className="py-2.5 px-3">Pos Anggaran</th>
                        <th className="py-2.5 px-3 text-right">Kas Masuk (Rp)</th>
                        <th className="py-2.5 px-3 text-right">Kas Keluar (Rp)</th>
                        <th className="py-2.5 px-3">Penanggung Jawab</th>
                        <th className="py-2.5 px-3">No. Bukti</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {cashFlow.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-slate-400">
                            Belum ada catatan buku kas umum. Klik tombol "Catat Transaksi Kas" untuk menambahkan.
                          </td>
                        </tr>
                      ) : (
                        cashFlow.map(entry => (
                          <tr key={entry.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-2.5 px-3 font-mono text-slate-600">{entry.tanggal}</td>
                            <td className="py-2.5 px-3 font-medium text-slate-900">{entry.keterangan}</td>
                            <td className="py-2.5 px-3 text-slate-500">
                              <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px] font-medium text-slate-700">
                                {entry.kategori.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-semibold text-emerald-700">
                              {entry.jenis === 'MASUK' ? formatRupiah(entry.nominal) : '-'}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-semibold text-rose-700">
                              {entry.jenis === 'KELUAR' ? formatRupiah(entry.nominal) : '-'}
                            </td>
                            <td className="py-2.5 px-3 text-slate-600">{entry.penanggungJawab}</td>
                            <td className="py-2.5 px-3 font-mono text-slate-400">{entry.buktiRef || '-'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

              </div>
            )}

            {/* TAB 5: NOTIFIKASI & PENGINGAT JATUH TEMPO */}
            {activeTab === 'PENGINGAT' && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      Log Notifikasi & Pengingat Iuran Jatuh Tempo
                    </h3>
                    <p className="text-xs text-slate-500">
                      Riwayat pesan WhatsApp dan pengingat otomatis jatuh tempo iuran bulanan
                    </p>
                  </div>

                  <button
                    onClick={() => setReminderModalOpen(true)}
                    className="px-4 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors"
                  >
                    <Bell className="w-4 h-4" />
                    <span>Buka Engine Pengingat ({stats.belumBayarCount} Tunggakan)</span>
                  </button>
                </div>

                {/* Notifications timeline list */}
                <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-slate-400">
                      Belum ada log notifikasi terkirim. Gunakan tombol "Buka Engine Pengingat" untuk mengirimkan notifikasi.
                    </div>
                  ) : (
                    notifications.map(notif => (
                      <div key={notif.id} className="p-4 hover:bg-slate-50/70 transition-colors text-xs flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              notif.tipe === 'KONFIRMASI_LUNAS'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {notif.tipe.replace('_', ' ')}
                            </span>
                            <span className="font-semibold text-slate-800">{notif.memberNama}</span>
                            <span className="text-slate-400">· {notif.kuaKecamatan} ({notif.kabKota})</span>
                          </div>
                          <p className="text-slate-600 max-w-3xl leading-relaxed">
                            "{notif.pesan}"
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-[11px] text-slate-400 font-mono">
                            {notif.timestamp}
                          </div>
                          <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                            {notif.channel} · {notif.statusKirim}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

              </div>
            )}

          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 px-4 sm:px-6 mt-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img 
              src={SEAL_IMAGE_URL} 
              alt="APRI" 
              className="w-6 h-6 object-contain rounded-full" 
              referrerPolicy="no-referrer"
            />
            <span>
              © 2026 Pengurus Wilayah Asosiasi Penghulu Republik Indonesia (APRI) Sulawesi Selatan.
            </span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Sekretariat: Jl. Masjid Raya No. 55 Makassar</span>
            <span>·</span>
            <span>Enkripsi AES-256-GCM Sesuai UU PDP No. 27/2022</span>
          </div>
        </div>
      </footer>

      {/* Payment Gateway Modal */}
      <PaymentModal
        isOpen={paymentModalOpen}
        onClose={() => {
          setPaymentModalOpen(false);
          setActivePaymentRecord(null);
        }}
        iuran={activePaymentRecord}
        member={members.find(m => m.id === activePaymentRecord?.memberId)}
        onPaymentSuccess={handlePaymentSuccess}
      />

      {/* Automated Reminder Modal */}
      <ReminderModal
        isOpen={reminderModalOpen}
        onClose={() => setReminderModalOpen(false)}
        pendingRecords={stats.pendingMembers}
        currentBulan={selectedBulan}
        currentTahun={selectedTahun}
        onSendBulkReminders={handleSendBulkReminders}
        notificationLogs={notifications}
      />

      {/* Member Profile & KTA Modal */}
      <MemberDetailModal
        isOpen={memberDetailModalOpen}
        onClose={() => {
          setMemberDetailModalOpen(false);
          setActiveMemberDetail(null);
        }}
        member={activeMemberDetail}
        records={records}
        onOpenPayment={(rec) => {
          setActivePaymentRecord(rec);
          setPaymentModalOpen(true);
        }}
        isEncryptionActive={isEncryptionActive}
        onToggleEncryption={() => setIsEncryptionActive(!isEncryptionActive)}
        sealImageUrl={SEAL_IMAGE_URL}
      />

      {/* Cash Flow Entry Modal */}
      <CashFlowModal
        isOpen={cashFlowModalOpen}
        onClose={() => setCashFlowModalOpen(false)}
        onAddEntry={handleAddCashEntry}
        currentBulan={selectedBulan}
        currentTahun={selectedTahun}
      />

    </div>
  );
}
