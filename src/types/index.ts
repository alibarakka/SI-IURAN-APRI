export type MemberStatus = 'Aktif' | 'Cuti' | 'Purna';

export type IuranStatus = 'LUNAS' | 'MENUNGGU_VERIFIKASI' | 'BELUM_BAYAR' | 'TERLAMBAT';

export type PaymentMethod = 'QRIS' | 'VA_SULSELBAR' | 'VA_BSI' | 'VA_MANDIRI' | 'VA_BRI' | 'TRANSFER_MANUAL';

export type TransactionType = 'MASUK' | 'KELUAR';

export type ExpenseCategory = 
  | 'IURAN_ANGGOTA'
  | 'IURAN_PANGKAL'
  | 'IURAN_SUKARELA'
  | 'BAGI_HASIL_PC_CABANG'
  | 'BAGI_HASIL_PW_WILAYAH'
  | 'SETORAN_PP_PUSAT'
  | 'BIMTEK_PENGHULU'
  | 'RAKERWIL_APRI'
  | 'RAKERCAB_APRI'
  | 'SANTUNAN_DUKA'
  | 'ADVOKASI_HUKUM'
  | 'OPERASIONAL_SEKRETARIAT'
  | 'OPERASIONAL_CABANG'
  | 'LAIN_LAIN';

export type UserRole = 
  | 'BENDAHARA_WILAYAH'     // Admin Bendahara Wilayah APRI Sulsel (Akses seluruh 24 Kab/Kota)
  | 'BENDAHARA_CABANG'      // Admin Bendahara Pimpinan Cabang APRI Kota/Kabupaten
  | 'ANGGOTA_PENGHULU';     // Anggota Penghulu KUA

export interface AuthUser {
  id: string;
  namaLengkap: string;
  email: string;
  nip?: string;
  role: UserRole;
  kabKota?: string;        // Nama Kab/Kota spesifik untuk Bendahara Cabang & Anggota
  kuaKecamatan?: string;
  jabatan?: string;
  memberId?: string;       // Relasi ke PenghuluMember
}

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
  password?: string;
  rekeningBank: {
    namaBank: string;
    noRek: string;
    atasNama: string;
  };
  statusKeanggotaan: MemberStatus;
  joinDate: string;
  statusIuranPangkal?: 'LUNAS' | 'BELUM_BAYAR';
  fotoUrl?: string;
  isDataEncrypted?: boolean;
  encryptedPayload?: {
    nipCipher: string;
    waCipher: string;
    bankCipher: string;
  };
}

export interface IuranDistribution {
  pp: number; // 15% untuk Pengurus Pusat (Rp 7.500)
  pw: number; // 25% untuk Pengurus Wilayah (Rp 12.500)
  pc: number; // 60% untuk Pengurus Cabang Kab/Kota (Rp 30.000)
  ppNominal?: number;
  pwNominal?: number;
  pcNominal?: number;
}

export interface IuranRecord {
  id: string;
  memberId: string;
  memberNama: string;
  nip: string;
  kabKota: string;
  kuaKecamatan: string;
  periodeBulan: number; // 1 to 12 (0 for Iuran Pangkal)
  periodeTahun: number; // e.g. 2026
  nominal: number; // Rp 50.000 (Bulanan) atau Rp 100.000 (Pangkal)
  nominalSukarela?: number;
  jenisIuran?: 'BULANAN' | 'PANGKAL';
  distribusi?: IuranDistribution;
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
  kabKota?: string; // Dapat diasosiasikan dengan kas cabang atau wilayah
  entityType?: 'PW_WILAYAH' | 'PC_CABANG' | 'PP_PUSAT';
  saldo?: number;
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
  porsiPC: number; // 60% hak cabang
  porsiPW: number; // 25% hak wilayah
  porsiPP: number; // 15% hak pusat
  persentaseKepatuhan: number;
}
