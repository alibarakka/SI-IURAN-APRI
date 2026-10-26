import React, { useState } from 'react';
import { 
  X, 
  Bell, 
  Send, 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  ExternalLink,
  Calendar,
  Settings2
} from 'lucide-react';
import { IuranRecord, NotificationLog } from '../types';
import { NAMA_BULAN } from '../data/mockData';

interface ReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  pendingRecords: IuranRecord[];
  currentBulan: number;
  currentTahun: number;
  onSendBulkReminders: (records: IuranRecord[], templateKey: string) => void;
  notificationLogs: NotificationLog[];
}

export const ReminderModal: React.FC<ReminderModalProps> = ({
  isOpen,
  onClose,
  pendingRecords,
  currentBulan,
  currentTahun,
  onSendBulkReminders,
  notificationLogs
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<'JATUH_TEMPO' | 'PENGINGAT_TUNGGAKAN'>('JATUH_TEMPO');
  const [isSending, setIsSending] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [autoScheduleActive, setAutoScheduleActive] = useState(true);

  if (!isOpen) return null;

  const bulanText = NAMA_BULAN[currentBulan - 1] || 'Bulan Ini';

  const getTemplateMessage = (r: IuranRecord) => {
    if (selectedTemplate === 'JATUH_TEMPO') {
      return `Assalamu'alaikum Wr. Wb. Yth. Bapak ${r.memberNama} (${r.kuaKecamatan}, ${r.kabKota}). Mengingatkan kewajiban iuran rutin PW APRI Sulawesi Selatan periode ${bulanText} ${currentTahun} sebesar Rp 50.000 (Jatuh tempo tgl 10 ${bulanText}). Pembayaran dapat dilakukan via QRIS atau Virtual Account Bank Sulselbar/BSI. Syukron Katsiran. - Bendahara Wilayah APRI Sulsel`;
    } else {
      return `Assalamu'alaikum Wr. Wb. Yth. Bapak ${r.memberNama}. Berdasarkan rekapitulasi sistem iuran PW APRI Sulsel, status iuran periode ${bulanText} ${currentTahun} terpantau belum terverifikasi / melewati jatuh tempo. Mohon kesediaannya melakukan konfirmasi atau pelunasan iuran demi kelancaran program keummatan & kepenghuluan kita bersama. Wassalam.`;
    }
  };

  const handleBroadcast = () => {
    setIsSending(true);
    setTimeout(() => {
      onSendBulkReminders(pendingRecords, selectedTemplate);
      setIsSending(false);
      setSuccessToast(`Berhasil mengirimkan ${pendingRecords.length} notifikasi pengingat via WhatsApp & WebPush!`);
      setTimeout(() => setSuccessToast(null), 4000);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Pusat Pengingat Iuran Otomatis (Notifikasi Jatuh Tempo)
              </h3>
              <p className="text-xs text-slate-500">
                Otomasi Notifikasi WhatsApp & WebPush Anggota APRI Sulsel
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {successToast && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs font-medium text-emerald-800">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successToast}</span>
            </div>
          )}

          {/* Automated Scheduler Settings Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-700" />
                <span className="text-xs font-semibold text-slate-800">
                  Status Engine Pengingat Terjadwal Otomatis
                </span>
              </div>
              <button
                type="button"
                onClick={() => setAutoScheduleActive(!autoScheduleActive)}
                className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${
                  autoScheduleActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                }`}
              >
                {autoScheduleActive ? '● Aktif Otomatis' : '○ Dinonaktifkan'}
              </button>
            </div>
            <div className="text-xs text-slate-600 space-y-1">
              <p>• <strong>H-2 (Tgl 8)</strong>: Notifikasi ramah persiapan iuran bulanan.</p>
              <p>• <strong>Hari H (Tgl 10)</strong>: Notifikasi resmi jatuh tempo iuran wajib Rp 50.000.</p>
              <p>• <strong>H+5 (Tgl 15)</strong>: Rekapitulasi tunggakan bagi anggota yang belum lunas.</p>
            </div>
          </div>

          {/* Template Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Pilih Format Pesan Pengingat
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSelectedTemplate('JATUH_TEMPO')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  selectedTemplate === 'JATUH_TEMPO'
                    ? 'border-emerald-700 bg-emerald-50/70 text-emerald-950 font-medium'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="text-xs font-semibold">1. Pengingat Jatuh Tempo (Tgl 10)</div>
                <div className="text-[11px] text-slate-500 mt-1">Pemberitahuan resmi iuran rutin bulanan.</div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedTemplate('PENGINGAT_TUNGGAKAN')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  selectedTemplate === 'PENGINGAT_TUNGGAKAN'
                    ? 'border-amber-600 bg-amber-50/70 text-amber-950 font-medium'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="text-xs font-semibold">2. Pengingat Keterlambatan / Tunggakan</div>
                <div className="text-[11px] text-slate-500 mt-1">Pemberitahuan follow-up setelah tgl jatuh tempo.</div>
              </button>
            </div>
          </div>

          {/* Pending Members List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-700">
                Anggota yang Belum Lunas ({pendingRecords.length} Penghulu)
              </span>
              <span className="text-[11px] text-slate-500">
                Periode {bulanText} {currentTahun}
              </span>
            </div>

            {pendingRecords.length === 0 ? (
              <div className="p-6 text-center border border-slate-200 rounded-xl bg-slate-50">
                <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-800">Semua Anggota Sudah Lunas</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Tidak ada tanggungan iuran yang tertunda untuk periode ini.</p>
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-56 overflow-y-auto">
                {pendingRecords.map((rec) => {
                  const msg = getTemplateMessage(rec);
                  const waUrl = `https://wa.me/6281242338899?text=${encodeURIComponent(msg)}`;

                  return (
                    <div key={rec.id} className="p-3 flex items-center justify-between hover:bg-slate-50 text-xs">
                      <div className="pr-2">
                        <div className="font-semibold text-slate-800">{rec.memberNama}</div>
                        <div className="text-[11px] text-slate-500">
                          {rec.kuaKecamatan} · {rec.kabKota} · Rp {rec.nominal.toLocaleString('id-ID')}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 rounded-lg text-[11px] font-medium flex items-center gap-1 transition-colors"
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>Kirim WA</span>
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800"
          >
            Tutup
          </button>

          <button
            type="button"
            onClick={handleBroadcast}
            disabled={isSending || pendingRecords.length === 0}
            className="py-2.5 px-5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isSending ? (
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            <span>
              {isSending ? 'Mengirim Broadcast...' : `Kirim Notifikasi ke Semua (${pendingRecords.length} Anggota)`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
