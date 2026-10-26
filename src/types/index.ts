export type MemberStatus = 'Aktif' | 'Cuti' | 'Purna';

export type IuranStatus = 'LUNAS' | 'MENUNGGU_VERIFIKASI' | 'BELUM_BAYAR' | 'TERLAMBAT';

export type PaymentMethod = 'QRIS' | 'VA_SULSELBAR' | 'VA_BSI' | 'VA_MANDIRI' | 'VA_BRI' | 'TRANSFER_MANUAL';

export type TransactionType = 'MASUK' | 'KELUAR';

export type ExpenseCategory = 
  | 'IURAN_ANGGOTA'
  | 'IURAN_SUKARELA'
  | 'BIMTEK_PENGHULU'
  | 'RAKERWIL_APRI'
  | 'SANTUNAN_DUKA'
  | 'ADVOKASI_HUKUM'
  | 'OPERASIONAL_SEKRETARIAT';

export interface PenghuluMember {
  id: string;
  nip: string;
  nipMasked?: string;
  namaLengkap: string;
  gelarDepan?: string;
  gelarBelakang?: string;
  jabatan: 'Penghulu Ahli Pertama' | 'Penghulu Ahli Muda' | 'Penghulu Ahli Madya' | 'Penghulu Ahli Utama' | 'Kepala KUA';
  kuaKecamatan: string;
  kabKota: string;
  noHpWa: string;
  email: string;
  rekeningBank: {
    namaBank: string;
    noRek: string;
    atasNama: string;
  };
  statusKeanggotaan: MemberStatus;
  joinDate: string;
  fotoUrl?: string;
  isDataEncrypted?: boolean;
  encryptedPayload?: {
    nipCipher: string;
    waCipher: string;
    bankCipher: string;
  };
}

export interface IuranRecord {
  id: string;
  memberId: string;
  memberNama: string;
  nip: string;
  kabKota: string;
  kuaKecamatan: string;
  periodeBulan: number; // 1 to 12
  periodeTahun: number; // e.g. 2026
  nominal: number; // default 50000
  nominalSukarela?: number;
  status: IuranStatus;
  tanggalJatuhTempo: string; // YYYY-MM-DD (typically 10th of month)
  tanggalBayar?: string;
  metodePembayaran?: PaymentMethod;
  nomorReferensi?: string; // QRIS ref or VA number
  kodeKwitansi?: string;
  catatan?: string;
}

export interface CashFlowEntry {
  id: string;
  tanggal: string;
  jenis: TransactionType;
  kategori: ExpenseCategory;
  nominal: number;
  keterangan: string;
  buktiRef?: string;
  penanggungJawab: string;
  periodeBulan: number;
  periodeTahun: number;
}

export interface NotificationLog {
  id: string;
  memberId: string;
  memberNama: string;
  noWa: string;
  kabKota: string;
  kuaKecamatan: string;
  periodeBulan: number;
  periodeTahun: number;
  tipe: 'JATUH_TEMPO' | 'PENGINGAT_TUNGGAKAN' | 'KONFIRMASI_LUNAS' | 'BROADCAST_BULANAN';
  channel: 'WhatsApp' | 'Email' | 'WebPush';
  statusKirim: 'Terkirim' | 'Gagal' | 'Dijadwalkan';
  timestamp: string;
  pesan: string;
  tautanBayar?: string;
}

export interface RegionalSummary {
  kabKota: string;
  totalAnggota: number;
  lunasCount: number;
  belumBayarCount: number;
  totalTerkumpul: number;
  persentaseKepatuhan: number;
}
