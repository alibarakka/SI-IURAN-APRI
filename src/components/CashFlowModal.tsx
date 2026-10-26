import React, { useState, useEffect } from 'react';
import { X, PlusCircle, ArrowDownCircle, ArrowUpCircle, Building2, MapPin } from 'lucide-react';
import { CashFlowEntry, ExpenseCategory, TransactionType, AuthUser } from '../types';
import { KAB_KOTA_SULSEL } from '../data/mockData';

interface CashFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddEntry: (entry: CashFlowEntry) => void;
  currentBulan: number;
  currentTahun: number;
  currentUser?: AuthUser | null;
  defaultKabKota?: string;
}

export const CashFlowModal: React.FC<CashFlowModalProps> = ({
  isOpen,
  onClose,
  onAddEntry,
  currentBulan,
  currentTahun,
  currentUser,
  defaultKabKota
}) => {
  const isBranchAdmin = currentUser?.role === 'BENDAHARA_CABANG';
  const branchKabKota = currentUser?.kabKota || defaultKabKota || 'Kota Makassar';

  const [jenis, setJenis] = useState<TransactionType>('KELUAR');
  const [entityType, setEntityType] = useState<'PW_WILAYAH' | 'PC_CABANG' | 'PP_PUSAT'>(
    isBranchAdmin ? 'PC_CABANG' : 'PW_WILAYAH'
  );
  const [selectedKabKota, setSelectedKabKota] = useState<string>(
    isBranchAdmin ? branchKabKota : (defaultKabKota && defaultKabKota !== 'SEMUA' ? defaultKabKota : 'Kota Makassar')
  );
  const [kategori, setKategori] = useState<ExpenseCategory>(
    isBranchAdmin ? 'OPERASIONAL_CABANG' : 'OPERASIONAL_SEKRETARIAT'
  );
  const [nominal, setNominal] = useState<string>('500000');
  const [keterangan, setKeterangan] = useState<string>('');
  const [penanggungJawab, setPenanggungJawab] = useState<string>(
    currentUser?.namaLengkap || (isBranchAdmin ? `Bendahara PC APRI ${branchKabKota}` : 'Bendahara PW APRI Sulsel')
  );
  const [buktiRef, setBuktiRef] = useState<string>('');
  const [tanggal, setTanggal] = useState<string>(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (isOpen) {
      if (isBranchAdmin) {
        setEntityType('PC_CABANG');
        setSelectedKabKota(branchKabKota);
        setPenanggungJawab(currentUser?.namaLengkap || `Bendahara PC APRI ${branchKabKota}`);
        setKategori('OPERASIONAL_CABANG');
      } else {
        setPenanggungJawab(currentUser?.namaLengkap || 'Drs. H. Muhammad Asyik, M.Ag.');
      }
    }
  }, [isOpen, isBranchAdmin, branchKabKota, currentUser]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(nominal);
    if (isNaN(num) || num <= 0) return;

    const assignedKabKota = entityType === 'PC_CABANG' 
      ? (isBranchAdmin ? branchKabKota : selectedKabKota)
      : undefined;

    const newEntry: CashFlowEntry = {
      id: `BKU-${currentTahun}-${Date.now().toString().slice(-5)}`,
      tanggal: tanggal || new Date().toISOString().split('T')[0],
      jenis,
      kategori,
      nominal: num,
      keterangan: keterangan || (jenis === 'MASUK' ? 'Penerimaan Kas Organisasi' : 'Pengeluaran Kas Organisasi'),
      buktiRef: buktiRef || `KWT-${Date.now().toString().slice(-6)}`,
      penanggungJawab: penanggungJawab || (isBranchAdmin ? `Bendahara PC ${branchKabKota}` : 'Bendahara PW APRI'),
      periodeBulan: currentBulan,
      periodeTahun: currentTahun,
      kabKota: assignedKabKota,
      entityType
    };

    onAddEntry(newEntry);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-emerald-800" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Pencatatan Buku Kas Umum (BKU)
              </h3>
              <p className="text-[11px] text-slate-500">
                {isBranchAdmin 
                  ? `Kas Pengurus Cabang (PC) APRI ${branchKabKota}`
                  : 'Kas Pengurus Wilayah (PW) APRI Sulawesi Selatan'}
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          
          {/* Level / Entitas Kas (If Wilayah admin, they can pick PW, PC, or PP) */}
          {!isBranchAdmin && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">
                Tingkat Entitas Kas
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEntityType('PW_WILAYAH');
                    setKategori('OPERASIONAL_SEKRETARIAT');
                  }}
                  className={`py-2 px-2.5 rounded-xl border text-center font-semibold transition-all ${
                    entityType === 'PW_WILAYAH'
                      ? 'border-emerald-700 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5 mx-auto mb-1 text-emerald-700" />
                  <span>PW Sulsel</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEntityType('PC_CABANG');
                    setKategori('OPERASIONAL_CABANG');
                  }}
                  className={`py-2 px-2.5 rounded-xl border text-center font-semibold transition-all ${
                    entityType === 'PC_CABANG'
                      ? 'border-emerald-700 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5 mx-auto mb-1 text-amber-600" />
                  <span>PC Cabang</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEntityType('PP_PUSAT');
                    setJenis('KELUAR');
                    setKategori('SETORAN_PP_PUSAT');
                  }}
                  className={`py-2 px-2.5 rounded-xl border text-center font-semibold transition-all ${
                    entityType === 'PP_PUSAT'
                      ? 'border-emerald-700 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="block font-bold text-xs mb-1">15%</span>
                  <span>Setor PP Pusat</span>
                </button>
              </div>

              {entityType === 'PC_CABANG' && (
                <div className="mt-2.5">
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Pilih Cabang Kabupaten / Kota
                  </label>
                  <select
                    value={selectedKabKota}
                    onChange={(e) => setSelectedKabKota(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs text-slate-800 font-semibold focus:outline-emerald-600"
                  >
                    {KAB_KOTA_SULSEL.map(k => (
                      <option key={k} value={k}>{k}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Jenis Arus Kas */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">
              Jenis Arus Kas
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setJenis('MASUK');
                  setKategori(isBranchAdmin ? 'BAGI_HASIL_PC_CABANG' : 'IURAN_ANGGOTA');
                }}
                className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-2 font-semibold transition-all ${
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
                onClick={() => {
                  setJenis('KELUAR');
                  setKategori(isBranchAdmin ? 'OPERASIONAL_CABANG' : 'OPERASIONAL_SEKRETARIAT');
                }}
                className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-2 font-semibold transition-all ${
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

          {/* Kategori Pos Anggaran */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Kategori Pos Anggaran
            </label>
            <select
              value={kategori}
              onChange={(e) => setKategori(e.target.value as ExpenseCategory)}
              className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 font-semibold focus:outline-emerald-600"
            >
              {jenis === 'MASUK' ? (
                <>
                  {isBranchAdmin ? (
                    <>
                      <option value="BAGI_HASIL_PC_CABANG">Hak Iuran Bulanan Cabang (60% AD/ART)</option>
                      <option value="IURAN_ANGGOTA">Penerimaan Iuran Langsung Anggota Cabang</option>
                      <option value="IURAN_SUKARELA">Infaq / Sumbangan Sukarela Anggota</option>
                      <option value="OPERASIONAL_CABANG">Saldo Awal / Dana Kas Cabang</option>
                      <option value="LAIN_LAIN">Pemasukan Lain-Lain Sah Cabang</option>
                    </>
                  ) : (
                    <>
                      <option value="IURAN_ANGGOTA">Iuran Wajib Bulanan Anggota (100% Bruto Gateway)</option>
                      <option value="BAGI_HASIL_PW_WILAYAH">Penerimaan Bagian Wilayah (25% AD/ART)</option>
                      <option value="IURAN_PANGKAL">Iuran Pangkal Pendaftaran Anggota Baru (Rp 100.000)</option>
                      <option value="IURAN_SUKARELA">Infaq / Hibah Organisasi Sukarela</option>
                      <option value="OPERASIONAL_SEKRETARIAT">Saldo Kas Wilayah / Bantuan Resmi</option>
                      <option value="LAIN_LAIN">Penerimaan Lain-Lain Sah</option>
                    </>
                  )}
                </>
              ) : (
                <>
                  {isBranchAdmin ? (
                    <>
                      <option value="OPERASIONAL_CABANG">Operasional & Administrasi Sekretariat Cabang</option>
                      <option value="RAKERCAB_APRI">Rapat Kerja Cabang (Rakercab) / Pertemuan Rutin</option>
                      <option value="BIMTEK_PENGHULU">Bimtek / Pelatihan Kepenghuluan Cabang</option>
                      <option value="SANTUNAN_DUKA">Santunan Duka Cita & Bantuan Sosial Anggota</option>
                      <option value="ADVOKASI_HUKUM">Perlindungan Profesi & Advokasi Lokal</option>
                      <option value="LAIN_LAIN">Pengeluaran Lainnya PC Cabang</option>
                    </>
                  ) : (
                    <>
                      <option value="SETORAN_PP_PUSAT">Setoran Kewajiban Pengurus Pusat PP (15% AD/ART)</option>
                      <option value="BAGI_HASIL_PC_CABANG">Penyaluran Bagi Hasil PC Cabang (60% AD/ART)</option>
                      <option value="OPERASIONAL_SEKRETARIAT">Operasional & Sekretariat PW Sulsel</option>
                      <option value="BIMTEK_PENGHULU">Bimtek Kepenghuluan & Pengembangan SDM Sulsel</option>
                      <option value="RAKERWIL_APRI">Rakerwil & Rakorwil APRI Sulawesi Selatan</option>
                      <option value="SANTUNAN_DUKA">Santunan Sosial & Duka Cita Penghulu Sulsel</option>
                      <option value="ADVOKASI_HUKUM">Advokasi Perlindungan Hukum & Profesi Penghulu</option>
                      <option value="LAIN_LAIN">Pengeluaran Lain-Lain Organisasi</option>
                    </>
                  )}
                </>
              )}
            </select>
          </div>

          {/* Tanggal & Nominal */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Tanggal Transaksi
              </label>
              <input
                type="date"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 font-mono focus:outline-emerald-600"
                required
              />
            </div>
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
              placeholder={isBranchAdmin 
                ? `Contoh: Pengadaan ATK dan konsumsi Rakercab PC APRI ${branchKabKota}`
                : "Contoh: Pembiayaan modul Bimtek Kepenghuluan PW APRI Sulsel"}
              className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-emerald-600"
              required
            />
          </div>

          {/* Penanggung Jawab & Bukti Ref */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Penanggung Jawab / PIC
              </label>
              <input
                type="text"
                value={penanggungJawab}
                onChange={(e) => setPenanggungJawab(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-emerald-600"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                No. Bukti / Nota Kas
              </label>
              <input
                type="text"
                value={buktiRef}
                onChange={(e) => setBuktiRef(e.target.value)}
                placeholder="Contoh: BKK-10/2026/01"
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 font-mono focus:outline-emerald-600"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 text-xs font-medium cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              Simpan ke Buku Kas
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
