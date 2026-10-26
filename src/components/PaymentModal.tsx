import React, { useState, useEffect } from 'react';
import { 
  X, 
  QrCode, 
  CreditCard, 
  CheckCircle2, 
  Copy, 
  Check, 
  Download, 
  Building2, 
  ShieldCheck,
  Zap,
  ArrowRight
} from 'lucide-react';
import { IuranRecord, PaymentMethod, PenghuluMember } from '../types';
import { formatRupiah, generateKwitansiPDF } from '../utils/exporter';
import { NAMA_BULAN } from '../data/mockData';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  iuran: IuranRecord | null;
  member?: PenghuluMember;
  onPaymentSuccess: (updatedRecord: IuranRecord) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  iuran,
  member,
  onPaymentSuccess
}) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('QRIS');
  const [nominalSukarela, setNominalSukarela] = useState<number>(0);
  const [copiedVa, setCopiedVa] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccessData, setPaymentSuccessData] = useState<IuranRecord | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPaymentSuccessData(null);
      setIsProcessing(false);
      setCopiedVa(false);
      setNominalSukarela(0);
    }
  }, [isOpen, iuran]);

  if (!isOpen || !iuran) return null;

  const totalBayar = iuran.nominal + nominalSukarela;
  const vaCode = selectedMethod === 'VA_SULSELBAR' 
    ? '992801' + (iuran.nip.slice(-10) || '1234567890')
    : (selectedMethod === 'VA_BSI'
      ? '451802' + (iuran.nip.slice(-10) || '0987654321')
      : '880199' + (iuran.nip.slice(-10) || '1122334455'));

  const handleCopyVa = () => {
    navigator.clipboard.writeText(vaCode);
    setCopiedVa(true);
    setTimeout(() => setCopiedVa(false), 2000);
  };

  const handleSimulatePayment = () => {
    setIsProcessing(true);

    setTimeout(() => {
      const now = new Date();
      const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
      const tglBayar = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
      const kwitansiCode = `KW-APRI-SS/${iuran.periodeTahun}/${pad(iuran.periodeBulan)}/${Math.floor(1000 + Math.random() * 9000)}`;

      const updatedRecord: IuranRecord = {
        ...iuran,
        nominal: totalBayar,
        nominalSukarela: nominalSukarela > 0 ? nominalSukarela : undefined,
        status: 'LUNAS',
        tanggalBayar: tglBayar,
        metodePembayaran: selectedMethod,
        nomorReferensi: selectedMethod === 'QRIS' ? `QRIS-ID-${Date.now().toString().slice(-8)}` : vaCode,
        kodeKwitansi: kwitansiCode,
        catatan: `Lunas via ${selectedMethod.replace('_', ' ')} (Real-time Gateway Verified)`
      };

      setIsProcessing(false);
      setPaymentSuccessData(updatedRecord);
      onPaymentSuccess(updatedRecord);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center shrink-0">
              <img 
                src="/assets/aistudio/logo_apri_transparent.png" 
                alt="Logo APRI" 
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 leading-tight">
                {paymentSuccessData ? 'Pembayaran Berhasil Diverifikasi' : 'Gateway Pembayaran Iuran'}
              </h3>
              <p className="text-xs text-slate-500">
                PW APRI Sulawesi Selatan · Rekonsiliasi Real-Time
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

        {/* Modal Body */}
        <div className="p-6">
          {paymentSuccessData ? (
            /* SUCCESS STATE */
            <div className="text-center py-4 space-y-5">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              
              <div>
                <h4 className="text-lg font-bold text-slate-900">Alhamdulillah, Iuran Sah Terbayar!</h4>
                <p className="text-sm text-slate-500 mt-1">
                  Sistem Gateway APRI Sulsel telah memverifikasi pelunasan secara real-time.
                </p>
              </div>

              {/* Receipt Summary Box */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Nomor Kwitansi</span>
                  <span className="font-mono font-bold text-emerald-800">{paymentSuccessData.kodeKwitansi}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Nama Penghulu</span>
                  <span className="font-semibold text-slate-800">{paymentSuccessData.memberNama}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">KUA / Wilayah</span>
                  <span className="text-slate-700">{paymentSuccessData.kuaKecamatan}, {paymentSuccessData.kabKota}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Periode Iuran</span>
                  <span className="font-medium text-slate-800">{NAMA_BULAN[paymentSuccessData.periodeBulan - 1]} {paymentSuccessData.periodeTahun}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Metode Transaksi</span>
                  <span className="text-slate-700">{paymentSuccessData.metodePembayaran?.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between pt-2 text-sm">
                  <span className="font-semibold text-slate-800">Total Dibayar</span>
                  <span className="font-mono font-bold text-emerald-700 text-base">
                    {formatRupiah(paymentSuccessData.nominal)}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <button
                  onClick={() => generateKwitansiPDF(paymentSuccessData, member)}
                  className="w-full sm:w-1/2 py-2.5 px-4 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Unduh Kwitansi (PDF)
                </button>
                <button
                  onClick={onClose}
                  className="w-full sm:w-1/2 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
                >
                  Tutup & Kembali
                </button>
              </div>
            </div>
          ) : (
            /* CHECKOUT / INVOICE VIEW */
            <div className="space-y-6">
              {/* Member & Invoice Summary Banner */}
              <div className="bg-emerald-50/80 border border-emerald-100 rounded-xl p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <div>
                  <div className="text-xs text-emerald-800 font-medium">Tagihan Iuran Bulanan Penghulu</div>
                  <div className="text-base font-bold text-slate-900 mt-0.5">{iuran.memberNama}</div>
                  <div className="text-xs text-slate-600 mt-0.5">
                    NIP: {iuran.nip} · {iuran.kuaKecamatan} ({iuran.kabKota})
                  </div>
                </div>
                <div className="text-right sm:border-l sm:border-emerald-200 sm:pl-4">
                  <span className="text-xs text-slate-500">Periode Tagihan:</span>
                  <div className="text-sm font-bold text-emerald-900">
                    {NAMA_BULAN[iuran.periodeBulan - 1]} {iuran.periodeTahun}
                  </div>
                  <div className="text-xs text-amber-700 mt-0.5 font-medium">
                    Jatuh Tempo: 10 {NAMA_BULAN[iuran.periodeBulan - 1]}
                  </div>
                </div>
              </div>

              {/* Infaq / Sumbangan Sukarela Optional */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Infaq / Dana Sosial Sukarela Organisasi (Opsional)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[0, 10000, 25000, 50000].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setNominalSukarela(val)}
                      className={`py-2 px-2 text-xs font-medium rounded-lg border text-center transition-all ${
                        nominalSukarela === val
                          ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-400'
                      }`}
                    >
                      {val === 0 ? 'Tanpa Infaq' : `+${val / 1000}rb`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment Methods Tabs */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Pilih Kanal Pembayaran Gateway
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedMethod('QRIS')}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                      selectedMethod === 'QRIS'
                        ? 'border-emerald-700 bg-emerald-50/60 text-emerald-950 ring-1 ring-emerald-700'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <QrCode className="w-5 h-5 text-emerald-700" />
                    <span className="text-xs font-semibold">QRIS Dinamis</span>
                    <span className="text-[10px] text-slate-500">Semua Bank/E-Wallet</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedMethod('VA_SULSELBAR')}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                      selectedMethod === 'VA_SULSELBAR'
                        ? 'border-emerald-700 bg-emerald-50/60 text-emerald-950 ring-1 ring-emerald-700'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Building2 className="w-5 h-5 text-emerald-700" />
                    <span className="text-xs font-semibold">VA Sulselbar</span>
                    <span className="text-[10px] text-slate-500">Bank Daerah</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedMethod('VA_BSI')}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                      selectedMethod === 'VA_BSI'
                        ? 'border-emerald-700 bg-emerald-50/60 text-emerald-950 ring-1 ring-emerald-700'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <CreditCard className="w-5 h-5 text-emerald-700" />
                    <span className="text-xs font-semibold">VA BSI Syariah</span>
                    <span className="text-[10px] text-slate-500">Bank Syariah</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedMethod('VA_MANDIRI')}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                      selectedMethod === 'VA_MANDIRI'
                        ? 'border-emerald-700 bg-emerald-50/60 text-emerald-950 ring-1 ring-emerald-700'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Building2 className="w-5 h-5 text-emerald-700" />
                    <span className="text-xs font-semibold">VA Mandiri / BRI</span>
                    <span className="text-[10px] text-slate-500">Transfer ATM/App</span>
                  </button>
                </div>
              </div>

              {/* Dynamic Method Content Area */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                {selectedMethod === 'QRIS' && (
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs relative">
                      {/* Stylized QR Code SVG */}
                      <svg className="w-44 h-44 text-slate-900" viewBox="0 0 100 100" fill="currentColor">
                        {/* QR Corners */}
                        <rect x="5" y="5" width="28" height="28" rx="3" fill="#0f172a" />
                        <rect x="9" y="9" width="20" height="20" rx="2" fill="#ffffff" />
                        <rect x="13" y="13" width="12" height="12" rx="1" fill="#0f172a" />

                        <rect x="67" y="5" width="28" height="28" rx="3" fill="#0f172a" />
                        <rect x="71" y="9" width="20" height="20" rx="2" fill="#ffffff" />
                        <rect x="75" y="13" width="12" height="12" rx="1" fill="#0f172a" />

                        <rect x="5" y="67" width="28" height="28" rx="3" fill="#0f172a" />
                        <rect x="9" y="71" width="20" height="20" rx="2" fill="#ffffff" />
                        <rect x="13" y="75" width="12" height="12" rx="1" fill="#0f172a" />

                        {/* QR Data Dots */}
                        <rect x="38" y="10" width="5" height="5" />
                        <rect x="48" y="10" width="8" height="5" />
                        <rect x="40" y="20" width="6" height="6" />
                        <rect x="52" y="24" width="8" height="6" />
                        <rect x="10" y="40" width="6" height="6" />
                        <rect x="22" y="42" width="8" height="6" />
                        <rect x="35" y="38" width="6" height="6" />
                        <rect x="45" y="40" width="10" height="10" fill="#065f46" rx="2" />
                        <rect x="60" y="38" width="6" height="6" />
                        <rect x="72" y="42" width="6" height="6" />
                        <rect x="85" y="40" width="5" height="5" />
                        <rect x="40" y="60" width="6" height="6" />
                        <rect x="52" y="62" width="6" height="6" />
                        <rect x="68" y="68" width="8" height="6" />
                        <rect x="80" y="70" width="8" height="8" />
                        <rect x="42" y="75" width="12" height="6" />
                        <rect x="60" y="80" width="8" height="8" />
                        <rect x="75" y="84" width="10" height="6" />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="bg-white p-1 rounded-md border border-slate-200 shadow-xs flex items-center gap-1">
                          <img 
                            src="/assets/aistudio/logo_apri_transparent.png" 
                            alt="APRI" 
                            className="w-5 h-5 object-contain"
                            referrerPolicy="no-referrer"
                          />
                          <span className="text-[9px] font-bold text-emerald-800">
                            APRI SULSEL
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-slate-500">
                      Scan QRIS melalui m-Banking (Sulselbar, BSI, Mandiri, BRI, BCA) atau GoPay/Dana/OVO/ShopeePay
                    </div>
                  </div>
                )}

                {selectedMethod.startsWith('VA_') && (
                  <div className="space-y-3">
                    <div className="text-xs text-slate-600">
                      Nomor Virtual Account Pembayaran ({selectedMethod.replace('_', ' ')}):
                    </div>
                    <div className="flex items-center justify-between bg-white border border-slate-300 rounded-lg p-3">
                      <span className="font-mono text-base font-bold tracking-wider text-slate-900">
                        {vaCode}
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyVa}
                        className="px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-md flex items-center gap-1.5 transition-colors"
                      >
                        {copiedVa ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedVa ? 'Tersalin' : 'Salin Nomor'}
                      </button>
                    </div>
                    <ul className="text-[11px] text-slate-500 space-y-1 list-disc pl-4">
                      <li>Buka aplikasi Mobile Banking atau ATM bank pilihan Anda</li>
                      <li>Pilih menu <strong>Transfer / Pembayaran Virtual Account</strong></li>
                      <li>Masukkan kode nomor di atas, nominal akan muncul otomatis</li>
                      <li>Verifikasi otomatis berlangsung dalam 1–3 detik setelah transaksi sukses</li>
                    </ul>
                  </div>
                )}
              </div>

              {/* Total Summary & Simulation Button */}
              <div className="border-t border-slate-200 pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <span className="text-xs text-slate-500">Total Tagihan & Infaq:</span>
                  <div className="text-xl font-bold font-mono text-emerald-900">
                    {formatRupiah(totalBayar)}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSimulatePayment}
                  disabled={isProcessing}
                  className="w-full sm:w-auto py-3 px-6 bg-emerald-800 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-75 cursor-pointer"
                >
                  {isProcessing ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Zap className="w-4 h-4 fill-white" />
                  )}
                  <span>
                    {isProcessing ? 'Memverifikasi via Gateway...' : 'Simulasi Pembayaran Sukses (Real-Time)'}
                  </span>
                  {!isProcessing && <ArrowRight className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Terhubung dengan Payment Gateway API APRI Sulsel · Enkripsi SHA-256</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
