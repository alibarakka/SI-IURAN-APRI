import React, { useState } from 'react';
import { 
  QrCode, 
  CreditCard, 
  Download, 
  Bell, 
  Calendar, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  ChevronRight, 
  User, 
  Smartphone,
  ExternalLink,
  MessageCircle,
  AlertTriangle
} from 'lucide-react';
import { PenghuluMember, IuranRecord, NotificationLog } from '../types';
import { formatRupiah, generateKwitansiPDF } from '../utils/exporter';
import { NAMA_BULAN } from '../data/mockData';

interface MobileAppViewProps {
  members: PenghuluMember[];
  records: IuranRecord[];
  onOpenPayment: (record: IuranRecord) => void;
  onViewMemberDetail: (member: PenghuluMember) => void;
  currentBulan: number;
  currentTahun: number;
  sealImageUrl: string;
}

export const MobileAppView: React.FC<MobileAppViewProps> = ({
  members,
  records,
  onOpenPayment,
  onViewMemberDetail,
  currentBulan,
  currentTahun,
  sealImageUrl
}) => {
  const [selectedMemberId, setSelectedMemberId] = useState<string>(members[0]?.id || 'MEM-001');

  const currentMember = members.find(m => m.id === selectedMemberId) || members[0];
  const memberRecords = records
    .filter(r => r.memberId === currentMember.id)
    .sort((a, b) => b.periodeBulan - a.periodeBulan);

  const currentMonthRecord = memberRecords.find(r => r.periodeBulan === currentBulan && r.periodeTahun === currentTahun);
  const isPaidThisMonth = currentMonthRecord?.status === 'LUNAS';

  return (
    <div className="flex flex-col items-center justify-center py-6 px-4">
      {/* Mobile Frame Header Controls */}
      <div className="w-full max-w-sm mb-4 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-emerald-700" />
          <span className="font-semibold text-slate-700">Preview Aplikasi Mobile KUA Penghulu</span>
        </div>
        
        {/* Member selector for simulator */}
        <select
          value={selectedMemberId}
          onChange={(e) => setSelectedMemberId(e.target.value)}
          className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-800 font-medium focus:outline-emerald-600"
        >
          {members.map(m => (
            <option key={m.id} value={m.id}>
              {m.namaLengkap} ({m.kabKota.replace('Kab. ', '').replace('Kota ', '')})
            </option>
          ))}
        </select>
      </div>

      {/* Realistic Mobile Device Container */}
      <div className="w-full max-w-sm bg-slate-900 rounded-[40px] p-3 shadow-2xl border-4 border-slate-700">
        <div className="w-full bg-slate-50 rounded-[32px] overflow-hidden min-h-[680px] flex flex-col relative text-slate-900">
          
          {/* Mobile Status Bar */}
          <div className="bg-emerald-900 text-white px-6 pt-3 pb-2 flex items-center justify-between text-[11px] font-mono">
            <span>09:41</span>
            <div className="w-20 h-4 bg-black/40 rounded-full mx-auto" />
            <div className="flex items-center gap-1.5 text-[10px]">
              <span>4G</span>
              <span>100%</span>
            </div>
          </div>

          {/* App Topbar */}
          <div className="bg-emerald-900 text-white px-5 pb-5 pt-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <img 
                  src={sealImageUrl} 
                  alt="APRI" 
                  className="w-9 h-9 object-contain rounded-full bg-white/10 p-0.5"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <div className="text-[10px] tracking-wide text-emerald-200 uppercase font-medium">
                    APRI Sulsel Mobile
                  </div>
                  <div className="text-sm font-bold text-white leading-tight">
                    Portal Iuran Penghulu
                  </div>
                </div>
              </div>
              <button 
                onClick={() => onViewMemberDetail(currentMember)}
                className="w-8 h-8 rounded-full bg-emerald-800 flex items-center justify-center text-white border border-emerald-600"
              >
                <User className="w-4 h-4" />
              </button>
            </div>

            {/* Member Card Bar */}
            <div className="mt-4 bg-white/10 backdrop-blur-xs rounded-xl p-3 border border-white/15 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-white">
                  {currentMember.namaLengkap}
                </div>
                <div className="text-[10px] text-emerald-200">
                  {currentMember.kuaKecamatan} · {currentMember.kabKota}
                </div>
              </div>
              <button
                onClick={() => onViewMemberDetail(currentMember)}
                className="text-[10px] bg-emerald-700 hover:bg-emerald-600 px-2 py-1 rounded text-white font-medium"
              >
                KTA Digital
              </button>
            </div>
          </div>

          {/* Main Mobile Scrollable View */}
          <div className="p-4 space-y-4 flex-1 overflow-y-auto">
            {/* Current Dues Card */}
            <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Iuran {NAMA_BULAN[currentBulan - 1]} {currentTahun}
                </span>
                {isPaidThisMonth ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3 h-3" /> LUNAS
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                    <Clock className="w-3 h-3" /> JATUH TEMPO
                  </span>
                )}
              </div>

              <div className="my-3">
                <div className="text-2xl font-bold font-mono text-slate-900">
                  {formatRupiah(currentMonthRecord?.nominal || 50000)}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Jatuh tempo setiap tanggal 10 {NAMA_BULAN[currentBulan - 1]}
                </div>
              </div>

              {isPaidThisMonth ? (
                <div className="space-y-2">
                  <div className="p-2.5 bg-emerald-50 rounded-xl text-xs text-emerald-900 font-medium flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Lunas pada {currentMonthRecord?.tanggalBayar}</span>
                  </div>
                  <button
                    onClick={() => currentMonthRecord && generateKwitansiPDF(currentMonthRecord, currentMember)}
                    className="w-full py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Unduh Kwitansi Sah APRI (PDF)</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <button
                    onClick={() => currentMonthRecord && onOpenPayment(currentMonthRecord)}
                    className="w-full py-3 px-4 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>Bayar via QRIS / Virtual Account</span>
                  </button>
                  <p className="text-[10px] text-slate-400 text-center">
                    Verifikasi instan otomatis · BSI, Bank Sulselbar, Mandiri, BRI
                  </p>
                </div>
              )}
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => onViewMemberDetail(currentMember)}
                className="p-3 bg-white border border-slate-200 rounded-xl text-left hover:border-emerald-600 transition-colors"
              >
                <CreditCard className="w-4 h-4 text-emerald-700 mb-1.5" />
                <div className="text-xs font-semibold text-slate-800">KTA Elektronik</div>
                <div className="text-[10px] text-slate-500">Lihat kartu identitas</div>
              </button>

              <a
                href="https://wa.me/6281242338899?text=Assalamu%27alaikum%20Bendahara%20PW%20APRI%20Sulsel%2C%20saya%20ingin%20konfirmasi%20iuran"
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 bg-white border border-slate-200 rounded-xl text-left hover:border-emerald-600 transition-colors block"
              >
                <MessageCircle className="w-4 h-4 text-emerald-700 mb-1.5" />
                <div className="text-xs font-semibold text-slate-800">Kontak Bendahara</div>
                <div className="text-[10px] text-slate-500">Bantuan via WA resmi</div>
              </a>
            </div>

            {/* Recent Payment History */}
            <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-800">Riwayat Iuran 2026</span>
                <span className="text-[10px] text-slate-500">Tahun Ini</span>
              </div>

              <div className="divide-y divide-slate-100">
                {memberRecords.slice(0, 4).map(rec => (
                  <div key={rec.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-slate-800">
                        {NAMA_BULAN[rec.periodeBulan - 1]} 2026
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {rec.status === 'LUNAS' ? `Lunas: ${rec.tanggalBayar}` : 'Belum Terbayar'}
                      </div>
                    </div>
                    <div>
                      {rec.status === 'LUNAS' ? (
                        <button
                          onClick={() => generateKwitansiPDF(rec, currentMember)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-[11px] font-medium text-slate-700 flex items-center gap-1"
                        >
                          <Download className="w-3 h-3" /> Kwitansi
                        </button>
                      ) : (
                        <button
                          onClick={() => onOpenPayment(rec)}
                          className="px-2 py-1 bg-emerald-800 text-white rounded text-[11px] font-medium"
                        >
                          Bayar
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Security Badge */}
            <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
              <div className="text-[10px] text-emerald-950">
                Data KUA terenkripsi AES-256 dan dilindungi UU PDP No. 27/2022.
              </div>
            </div>
          </div>

          {/* Bottom Bar Simulator */}
          <div className="bg-white border-t border-slate-200 px-6 py-2.5 flex items-center justify-around text-slate-600">
            <div className="flex flex-col items-center text-emerald-800">
              <Calendar className="w-4 h-4" />
              <span className="text-[9px] font-semibold mt-0.5">Iuran</span>
            </div>
            <div 
              onClick={() => onViewMemberDetail(currentMember)}
              className="flex flex-col items-center hover:text-emerald-800 cursor-pointer"
            >
              <User className="w-4 h-4" />
              <span className="text-[9px] font-medium mt-0.5">Profil</span>
            </div>
            <div 
              onClick={() => onViewMemberDetail(currentMember)}
              className="flex flex-col items-center hover:text-emerald-800 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span className="text-[9px] font-medium mt-0.5">Privasi</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
