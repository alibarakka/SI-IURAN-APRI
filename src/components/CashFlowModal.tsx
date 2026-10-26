import React, { useState } from 'react';
import { X, PlusCircle, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { CashFlowEntry, ExpenseCategory, TransactionType } from '../types';

interface CashFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddEntry: (entry: CashFlowEntry) => void;
  currentBulan: number;
  currentTahun: number;
}

export const CashFlowModal: React.FC<CashFlowModalProps> = ({
  isOpen,
  onClose,
  onAddEntry,
  currentBulan,
  currentTahun
}) => {
  const [jenis, setJenis] = useState<TransactionType>('KELUAR');
  const [kategori, setKategori] = useState<ExpenseCategory>('OPERASIONAL_SEKRETARIAT');
  const [nominal, setNominal] = useState<string>('500000');
  const [keterangan, setKeterangan] = useState<string>('');
  const [penanggungJawab, setPenanggungJawab] = useState<string>('Bendahara Wilayah');
  const [buktiRef, setBuktiRef] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(nominal);
    if (isNaN(num) || num <= 0) return;

    const newEntry: CashFlowEntry = {
      id: `BKU-${currentTahun}-${Date.now().toString().slice(-4)}`,
      tanggal: new Date().toISOString().split('T')[0],
      jenis,
      kategori,
      nominal: num,
      keterangan: keterangan || (jenis === 'MASUK' ? 'Penerimaan Kas Organisasi' : 'Pengeluaran Kas Organisasi'),
      buktiRef: buktiRef || `KWT-${Date.now().toString().slice(-6)}`,
      penanggungJawab: penanggungJawab || 'Bendahara PW APRI',
      periodeBulan: currentBulan,
      periodeTahun: currentTahun
    };

    onAddEntry(newEntry);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-emerald-800" />
            <h3 className="text-base font-semibold text-slate-900">
              Catat Transaksi Buku Kas Umum (BKU)
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Jenis Transaksi */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">
              Jenis Arus Kas
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setJenis('MASUK')}
                className={`py-2.5 px-3 rounded-xl border flex items-center justify-center gap-2 font-semibold transition-all ${
                  jenis === 'MASUK'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-600'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <ArrowDownCircle className="w-4 h-4 text-emerald-600" />
                <span>Penerimaan (Kas Masuk)</span>
              </button>

              <button
                type="button"
                onClick={() => setJenis('KELUAR')}
                className={`py-2.5 px-3 rounded-xl border flex items-center justify-center gap-2 font-semibold transition-all ${
                  jenis === 'KELUAR'
                    ? 'border-rose-600 bg-rose-50 text-rose-800 ring-1 ring-rose-600'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <ArrowUpCircle className="w-4 h-4 text-rose-600" />
                <span>Pengeluaran (Kas Keluar)</span>
              </button>
            </div>
          </div>

          {/* Kategori Pos */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Kategori Pos Anggaran
            </label>
            <select
              value={kategori}
              onChange={(e) => setKategori(e.target.value as ExpenseCategory)}
              className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 font-medium focus:outline-emerald-600"
            >
              {jenis === 'MASUK' ? (
                <>
                  <option value="IURAN_ANGGOTA">Iuran Wajib Anggota APRI</option>
                  <option value="IURAN_SUKARELA">Infaq / Sumbangan Sukarela</option>
                  <option value="OPERASIONAL_SEKRETARIAT">Dana Hibah / Saldo Kas</option>
                </>
              ) : (
                <>
                  <option value="BIMTEK_PENGHULU">Bimtek / Pelatihan Kepenghuluan</option>
                  <option value="RAKERWIL_APRI">Rakerwil & Rapat Koordinasi PW APRI</option>
                  <option value="SANTUNAN_DUKA">Santunan Sosial & Duka Cita Anggota</option>
                  <option value="ADVOKASI_HUKUM">Advokasi Perlindungan Hukum Penghulu</option>
                  <option value="OPERASIONAL_SEKRETARIAT">Operasional Sekretariat & Administrasi</option>
                </>
              )}
            </select>
          </div>

          {/* Nominal */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Nominal Transaksi (Rp)
            </label>
            <input
              type="number"
              value={nominal}
              onChange={(e) => setNominal(e.target.value)}
              placeholder="Contoh: 1500000"
              className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-mono font-bold text-slate-900 focus:outline-emerald-600"
              required
            />
          </div>

          {/* Keterangan */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Uraian / Keterangan Transaksi
            </label>
            <textarea
              rows={2}
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              placeholder="Contoh: Pembelian perlengkapan ATK sekretariat PW APRI Sulsel"
              className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-emerald-600"
              required
            />
          </div>

          {/* Penanggung Jawab & Bukti Ref */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Penanggung Jawab
              </label>
              <input
                type="text"
                value={penanggungJawab}
                onChange={(e) => setPenanggungJawab(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-emerald-600"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                No. Nota / Bukti Kas
              </label>
              <input
                type="text"
                value={buktiRef}
                onChange={(e) => setBuktiRef(e.target.value)}
                placeholder="Contoh: NOTA-10/26"
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-emerald-600"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 text-xs font-medium"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
            >
              Simpan ke Buku Kas
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
