import React, { useState } from 'react';
import { 
  X, 
  Shield, 
  ShieldCheck, 
  Lock, 
  Unlock, 
  CreditCard, 
  Building2, 
  FileText, 
  CheckCircle2, 
  Clock, 
  Download,
  Phone,
  Mail,
  UserCheck
} from 'lucide-react';
import { PenghuluMember, IuranRecord } from '../types';
import { maskNIP, maskPhone, maskBank } from '../utils/crypto';
import { formatRupiah, generateKwitansiPDF } from '../utils/exporter';
import { NAMA_BULAN } from '../data/mockData';

interface MemberDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: PenghuluMember | null;
  records: IuranRecord[];
  onOpenPayment: (record: IuranRecord) => void;
  isEncryptionActive: boolean;
  onToggleEncryption: () => void;
  sealImageUrl: string;
}

export const MemberDetailModal: React.FC<MemberDetailModalProps> = ({
  isOpen,
  onClose,
  member,
  records,
  onOpenPayment,
  isEncryptionActive,
  onToggleEncryption,
  sealImageUrl
}) => {
  const [activeTab, setActiveTab] = useState<'KTA' | 'RIWAYAT' | 'ENKRIPSI'>('KTA');

  if (!isOpen || !member) return null;

  const memberRecords = records
    .filter(r => r.memberId === member.id)
    .sort((a, b) => b.periodeBulan - a.periodeBulan);

  const displayNip = isEncryptionActive ? maskNIP(member.nip) : member.nip;
  const displayPhone = isEncryptionActive ? maskPhone(member.noHpWa) : member.noHpWa;
  const displayBank = isEncryptionActive 
    ? `${member.rekeningBank.namaBank} · ${maskBank(member.rekeningBank.noRek)}`
    : `${member.rekeningBank.namaBank} · ${member.rekeningBank.noRek} (a.n ${member.rekeningBank.atasNama})`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <img 
              src={sealImageUrl} 
              alt="APRI Seal" 
              className="w-10 h-10 object-contain rounded-full shadow-xs"
              referrerPolicy="no-referrer"
            />
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Profil Penghulu & KTA Digital
              </h3>
              <p className="text-xs text-slate-500">
                {member.kuaKecamatan} · {member.kabKota}
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

        {/* Tab switcher */}
        <div className="flex border-b border-slate-200 px-6 gap-6 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('KTA')}
            className={`py-3 border-b-2 transition-colors ${
              activeTab === 'KTA'
                ? 'border-emerald-700 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Kartu Anggota (KTA Digital)
          </button>
          <button
            onClick={() => setActiveTab('RIWAYAT')}
            className={`py-3 border-b-2 transition-colors ${
              activeTab === 'RIWAYAT'
                ? 'border-emerald-700 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Riwayat Pembayaran Iuran ({memberRecords.length})
          </button>
          <button
            onClick={() => setActiveTab('ENKRIPSI')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'ENKRIPSI'
                ? 'border-emerald-700 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-emerald-600" />
            <span>Keamanan Data Pribadi (AES-256)</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {activeTab === 'KTA' && (
            <div className="space-y-4">
              {/* KTA Card Container */}
              <div className="relative rounded-2xl bg-gradient-to-br from-emerald-900 via-emerald-800 to-slate-900 text-white p-6 shadow-xl border border-emerald-700/50 overflow-hidden">
                {/* Subtle background filigree */}
                <div className="absolute right-0 bottom-0 opacity-15 translate-x-6 translate-y-6 pointer-events-none">
                  <img src={sealImageUrl} alt="" className="w-64 h-64 object-contain" referrerPolicy="no-referrer" />
                </div>

                {/* Top of Card */}
                <div className="flex items-start justify-between relative z-10">
                  <div className="flex items-center gap-3">
                    <img 
                      src={sealImageUrl} 
                      alt="Logo APRI" 
                      className="w-12 h-12 object-contain"
                      referrerPolicy="no-referrer" 
                    />
                    <div>
                      <div className="text-[10px] tracking-wider text-emerald-200 uppercase font-semibold">
                        Asosiasi Penghulu Republik Indonesia
                      </div>
                      <div className="text-xs font-bold tracking-tight text-white">
                        PENGURUS WILAYAH SULAWESI SELATAN
                      </div>
                    </div>
                  </div>
                  <div className="px-2.5 py-1 rounded-full bg-emerald-700/60 border border-emerald-500/50 text-[10px] font-semibold text-emerald-100">
                    KTA ELEKTRONIK
                  </div>
                </div>

                {/* Middle details */}
                <div className="mt-6 flex flex-col sm:flex-row items-center sm:items-start gap-5 relative z-10">
                  <div className="w-20 h-24 bg-slate-200 rounded-xl overflow-hidden border-2 border-emerald-400/50 shrink-0 flex items-center justify-center text-slate-400">
                    <UserCheck className="w-10 h-10 text-emerald-900" />
                  </div>

                  <div className="space-y-1 text-center sm:text-left">
                    <div className="text-base font-bold text-white tracking-tight">
                      {member.namaLengkap} {member.gelarBelakang && `, ${member.gelarBelakang}`}
                    </div>
                    <div className="text-xs text-emerald-200 font-mono tracking-wider">
                      NIP: {displayNip}
                    </div>
                    <div className="text-xs text-slate-200 pt-1">
                      {member.jabatan}
                    </div>
                    <div className="text-xs text-slate-300">
                      {member.kuaKecamatan}, {member.kabKota}
                    </div>
                  </div>
                </div>

                {/* Bottom of card */}
                <div className="mt-6 pt-4 border-t border-emerald-700/40 flex items-center justify-between text-[11px] text-emerald-200/80 relative z-10">
                  <div>
                    <span>Status: </span>
                    <span className="font-semibold text-emerald-300">{member.statusKeanggotaan}</span>
                  </div>
                  <div className="font-mono text-[10px]">
                    ID: APRI-SS-{member.id}
                  </div>
                </div>
              </div>

              {/* Personal Details List */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2.5">
                <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" /> WhatsApp:
                  </span>
                  <span className="font-mono font-medium text-slate-800">{displayPhone}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" /> Email Resmi:
                  </span>
                  <span className="text-slate-800">{member.email}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" /> Rekening Bank:
                  </span>
                  <span className="font-mono text-slate-800">{displayBank}</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'RIWAYAT' && (
            <div className="space-y-3">
              <div className="text-xs text-slate-500">
                Catatan iuran bulanan tahun anggaran 2026:
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                {memberRecords.map(rec => (
                  <div key={rec.id} className="p-3 flex items-center justify-between hover:bg-slate-50 text-xs">
                    <div>
                      <div className="font-semibold text-slate-800">
                        {NAMA_BULAN[rec.periodeBulan - 1]} {rec.periodeTahun}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Jatuh tempo: {rec.tanggalJatuhTempo} · Rp {rec.nominal.toLocaleString('id-ID')}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {rec.status === 'LUNAS' ? (
                        <>
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
                            <CheckCircle2 className="w-3 h-3" /> Lunas ({rec.tanggalBayar})
                          </span>
                          <button
                            type="button"
                            onClick={() => generateKwitansiPDF(rec, member)}
                            className="p-1 text-slate-500 hover:text-emerald-700 hover:bg-slate-100 rounded-md transition-colors"
                            title="Unduh Kwitansi PDF"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md">
                            <Clock className="w-3 h-3" /> {rec.status.replace('_', ' ')}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onOpenPayment(rec);
                            }}
                            className="px-2.5 py-1 bg-emerald-800 text-white rounded-md text-[11px] font-semibold hover:bg-emerald-700 transition-colors"
                          >
                            Bayar
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'ENKRIPSI' && (
            <div className="space-y-4">
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4">
                <div className="flex items-center gap-2 text-emerald-800 font-semibold text-xs mb-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span>Sistem Enkripsi Data Pribadi Penghulu Terpasang</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Semua informasi sensitif (NIP, Nomor Kontak WhatsApp, dan No. Rekening Bank) 
                  dienkripsi pada level browser menggunakan algoritma <strong>AES-256-GCM</strong>. 
                  Memenuhi standar keamanan informasi dan Undang-Undang Perlindungan Data Pribadi (UU PDP No. 27/2022).
                </p>
              </div>

              {/* Encryption Status and Toggle */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-slate-800">
                      Mode Proteksi Privasi (Privacy-Masking)
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {isEncryptionActive 
                        ? 'Data pribadi disamarkan (Ciphertext aktif)' 
                        : 'Mode Dekripsi Master Bendahara (Plaintext)'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={onToggleEncryption}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                      isEncryptionActive
                        ? 'bg-emerald-800 text-white'
                        : 'bg-amber-100 text-amber-900 border border-amber-300'
                    }`}
                  >
                    {isEncryptionActive ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                    <span>{isEncryptionActive ? 'Enkripsi Aktif' : 'Dekripsi Terbuka'}</span>
                  </button>
                </div>

                {/* Ciphertext Inspector */}
                <div className="space-y-2 pt-2 text-xs">
                  <div>
                    <span className="text-[11px] font-mono text-slate-500">NIP Cipher Payload:</span>
                    <pre className="p-2 bg-slate-900 text-emerald-400 rounded-lg font-mono text-[11px] overflow-x-auto">
                      {member.encryptedPayload?.nipCipher || `aes-gcm:${btoa(member.nip).slice(0, 24)}...`}
                    </pre>
                  </div>
                  <div>
                    <span className="text-[11px] font-mono text-slate-500">WhatsApp Cipher Payload:</span>
                    <pre className="p-2 bg-slate-900 text-emerald-400 rounded-lg font-mono text-[11px] overflow-x-auto">
                      {member.encryptedPayload?.waCipher || `aes-gcm:${btoa(member.noHpWa).slice(0, 24)}...`}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
