import { PenghuluMember, IuranRecord, CashFlowEntry, NotificationLog, AuthUser } from '../types';

export const KAB_KOTA_SULSEL = [
  'Kota Makassar',
  'Kab. Gowa',
  'Kab. Maros',
  'Kab. Pangkajene dan Kepulauan',
  'Kab. Barru',
  'Kota Parepare',
  'Kab. Pinrang',
  'Kab. Sidenreng Rappang',
  'Kab. Enrekang',
  'Kab. Tana Toraja',
  'Kab. Toraja Utara',
  'Kab. Luwu',
  'Kota Palopo',
  'Kab. Luwu Utara',
  'Kab. Luwu Timur',
  'Kab. Wajo',
  'Kab. Soppeng',
  'Kab. Bone',
  'Kab. Sinjai',
  'Kab. Bulukumba',
  'Kab. Bantaeng',
  'Kab. Jeneponto',
  'Kab. Takalar',
  'Kab. Kepulauan Selayar',
];

export const NAMA_BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const IURAN_WAJIB_DEFAULT = 50000; // Rp 50.000 / bulan

// Default Admin Accounts
export const DEFAULT_ADMIN_WILAYAH: AuthUser = {
  id: 'USR-PW-001',
  namaLengkap: 'Drs. H. Muhammad Asyik, M.Ag.',
  email: 'bendahara.wilayah@aprisulsel.or.id',
  nip: '197508122003121002',
  role: 'BENDAHARA_WILAYAH',
  jabatan: 'Bendahara PW APRI Sulawesi Selatan'
};

// Preset sample branch admins for quick selection
export const DEFAULT_BRANCH_ADMINS: Record<string, { nama: string; nip: string; email: string }> = {
  'Kota Makassar': {
    nama: 'H. Syarifuddin, S.Ag., M.H.',
    nip: '197805122005011004',
    email: 'bendahara.makassar@aprisulsel.or.id'
  },
  'Kab. Gowa': {
    nama: 'H. Syamsuddin, S.Ag., M.H.',
    nip: '198204152009011014',
    email: 'bendahara.gowa@aprisulsel.or.id'
  },
  'Kab. Maros': {
    nama: 'H. Abd. Rahman, Lc., M.H.I.',
    nip: '197811052005011006',
    email: 'bendahara.maros@aprisulsel.or.id'
  },
  'Kab. Bone': {
    nama: 'Andi Baso Rahmat, S.H.I.',
    nip: '198502202011011009',
    email: 'bendahara.bone@aprisulsel.or.id'
  },
  'Kab. Bulukumba': {
    nama: 'H. Ilham Jaya, S.Ag.',
    nip: '198006182008011011',
    email: 'bendahara.bulukumba@aprisulsel.or.id'
  },
  'Kota Parepare': {
    nama: 'Muhammad Arifin, S.H.I.',
    nip: '198801142014031002',
    email: 'bendahara.parepare@aprisulsel.or.id'
  },
  'Kota Palopo': {
    nama: 'Drs. H. Rustam Efendi, M.Pd.',
    nip: '197903102007011019',
    email: 'bendahara.palopo@aprisulsel.or.id'
  }
};

/**
 * DATA BAWAAN DIKOSONGKAN SESUAI PERMINTAAN USER:
 * Anggota, Iuran, Kas, dan Notifikasi dimulai dari array kosong.
 */
export const INITIAL_MEMBERS: PenghuluMember[] = [];

export const INITIAL_CASH_FLOW: CashFlowEntry[] = [];

export const INITIAL_NOTIFICATIONS: NotificationLog[] = [];

export function generateInitialIuranRecords(members: PenghuluMember[]): IuranRecord[] {
  if (!members || members.length === 0) return [];

  const records: IuranRecord[] = [];
  const currentMonth = 10; // Oktober 2026

  members.forEach(m => {
    for (let month = 1; month <= currentMonth; month++) {
      const monthStr = month < 10 ? `0${month}` : `${month}`;
      records.push({
        id: `IUR-2026-${monthStr}-${m.id}`,
        memberId: m.id,
        memberNama: m.namaLengkap,
        nip: m.nip,
        kabKota: m.kabKota,
        kuaKecamatan: m.kuaKecamatan,
        periodeBulan: month,
        periodeTahun: 2026,
        nominal: IURAN_WAJIB_DEFAULT,
        status: 'BELUM_BAYAR',
        tanggalJatuhTempo: `2026-${monthStr}-10`
      });
    }
  });

  return records;
}
