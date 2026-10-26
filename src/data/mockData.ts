import { PenghuluMember, IuranRecord, CashFlowEntry, NotificationLog } from '../types';

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

export const INITIAL_MEMBERS: PenghuluMember[] = [
  {
    id: 'MEM-001',
    nip: '197508122003121002',
    namaLengkap: 'Drs. H. Muhammad Asyik',
    gelarDepan: 'Drs. H.',
    gelarBelakang: 'M.Ag.',
    jabatan: 'Penghulu Ahli Madya',
    kuaKecamatan: 'KUA Kec. Tamalate',
    kabKota: 'Kota Makassar',
    noHpWa: '081242338899',
    email: 'muhammad.asyik@kemenag.go.id',
    rekeningBank: {
      namaBank: 'Bank Sulselbar Syariah',
      noRek: '5100201099881',
      atasNama: 'Muhammad Asyik'
    },
    statusKeanggotaan: 'Aktif',
    joinDate: '2018-03-15',
    isDataEncrypted: true,
    encryptedPayload: {
      nipCipher: 'aes-gcm:9fa81bc32e88a0f912c4...',
      waCipher: 'aes-gcm:4c2a71e89f01bc4390e1...',
      bankCipher: 'aes-gcm:18d9f0c23a78bf6641e0...'
    }
  },
  {
    id: 'MEM-002',
    nip: '198204152009011014',
    namaLengkap: 'H. Syamsuddin',
    gelarDepan: 'H.',
    gelarBelakang: 'S.Ag., M.H.',
    jabatan: 'Penghulu Ahli Muda',
    kuaKecamatan: 'KUA Kec. Somba Opu',
    kabKota: 'Kab. Gowa',
    noHpWa: '085299441122',
    email: 'syamsuddin.gowa@kemenag.go.id',
    rekeningBank: {
      namaBank: 'Bank Syariah Indonesia (BSI)',
      noRek: '7148920199',
      atasNama: 'Syamsuddin'
    },
    statusKeanggotaan: 'Aktif',
    joinDate: '2019-07-20',
    isDataEncrypted: true,
    encryptedPayload: {
      nipCipher: 'aes-gcm:8da20ff17c24a9e331b2...',
      waCipher: 'aes-gcm:2b4e89f10c34da7712a9...',
      bankCipher: 'aes-gcm:90a3c4f78d12bb9900c3...'
    }
  },
  {
    id: 'MEM-003',
    nip: '197811052005011006',
    namaLengkap: 'Dr. H. Abd. Rahman',
    gelarDepan: 'Dr. H.',
    gelarBelakang: 'Lc., M.H.I.',
    jabatan: 'Kepala KUA',
    kuaKecamatan: 'KUA Kec. Turikale',
    kabKota: 'Kab. Maros',
    noHpWa: '081355667788',
    email: 'abd.rahman.maros@kemenag.go.id',
    rekeningBank: {
      namaBank: 'Bank Sulselbar Syariah',
      noRek: '5100448102931',
      atasNama: 'Abd. Rahman'
    },
    statusKeanggotaan: 'Aktif',
    joinDate: '2017-01-10',
    isDataEncrypted: true
  },
  {
    id: 'MEM-004',
    nip: '198502202011011009',
    namaLengkap: 'Andi Baso Rahmat',
    gelarDepan: '',
    gelarBelakang: 'S.H.I., M.Pd.I.',
    jabatan: 'Penghulu Ahli Muda',
    kuaKecamatan: 'KUA Kec. Tanete Riattang',
    kabKota: 'Kab. Bone',
    noHpWa: '082188990011',
    email: 'andi.baso.bone@kemenag.go.id',
    rekeningBank: {
      namaBank: 'Bank Mandiri',
      noRek: '1520019283940',
      atasNama: 'Andi Baso Rahmat'
    },
    statusKeanggotaan: 'Aktif',
    joinDate: '2020-02-18',
    isDataEncrypted: true
  },
  {
    id: 'MEM-005',
    nip: '198006182008011011',
    namaLengkap: 'H. Ilham Jaya',
    gelarDepan: 'H.',
    gelarBelakang: 'S.Ag.',
    jabatan: 'Penghulu Ahli Pertama',
    kuaKecamatan: 'KUA Kec. Ujung Bulu',
    kabKota: 'Kab. Bulukumba',
    noHpWa: '085342119933',
    email: 'ilham.bulukumba@kemenag.go.id',
    rekeningBank: {
      namaBank: 'Bank BRI',
      noRek: '023401049281502',
      atasNama: 'Ilham Jaya'
    },
    statusKeanggotaan: 'Aktif',
    joinDate: '2019-11-05',
    isDataEncrypted: true
  },
  {
    id: 'MEM-006',
    nip: '197609252006041005',
    namaLengkap: 'H. Ahmad Rauf',
    gelarDepan: 'H.',
    gelarBelakang: 'S.Ag., M.Si.',
    jabatan: 'Penghulu Ahli Madya',
    kuaKecamatan: 'KUA Kec. Tempe',
    kabKota: 'Kab. Wajo',
    noHpWa: '081241556677',
    email: 'ahmad.rauf.wajo@kemenag.go.id',
    rekeningBank: {
      namaBank: 'Bank Sulselbar Syariah',
      noRek: '5100192837465',
      atasNama: 'Ahmad Rauf'
    },
    statusKeanggotaan: 'Aktif',
    joinDate: '2018-05-12',
    isDataEncrypted: true
  },
  {
    id: 'MEM-007',
    nip: '198801142014031002',
    namaLengkap: 'Muhammad Arifin',
    gelarDepan: '',
    gelarBelakang: 'S.H.I.',
    jabatan: 'Penghulu Ahli Pertama',
    kuaKecamatan: 'KUA Kec. Soreang',
    kabKota: 'Kota Parepare',
    noHpWa: '085240998877',
    email: 'arifin.parepare@kemenag.go.id',
    rekeningBank: {
      namaBank: 'Bank Syariah Indonesia (BSI)',
      noRek: '7190283741',
      atasNama: 'Muhammad Arifin'
    },
    statusKeanggotaan: 'Aktif',
    joinDate: '2021-08-14',
    isDataEncrypted: true
  },
  {
    id: 'MEM-008',
    nip: '197903102007011019',
    namaLengkap: 'Drs. H. Rustam Efendi',
    gelarDepan: 'Drs. H.',
    gelarBelakang: 'M.Pd.',
    jabatan: 'Kepala KUA',
    kuaKecamatan: 'KUA Kec. Wara',
    kabKota: 'Kota Palopo',
    noHpWa: '081343778899',
    email: 'rustam.palopo@kemenag.go.id',
    rekeningBank: {
      namaBank: 'Bank Sulselbar Syariah',
      noRek: '5100882910293',
      atasNama: 'Rustam Efendi'
    },
    statusKeanggotaan: 'Aktif',
    joinDate: '2017-09-01',
    isDataEncrypted: true
  },
  {
    id: 'MEM-009',
    nip: '198412012010011020',
    namaLengkap: 'Muh. Yusuf',
    gelarDepan: '',
    gelarBelakang: 'S.Ag., M.Ag.',
    jabatan: 'Penghulu Ahli Muda',
    kuaKecamatan: 'KUA Kec. Maritengngae',
    kabKota: 'Kab. Sidenreng Rappang',
    noHpWa: '082349112233',
    email: 'yusuf.sidrap@kemenag.go.id',
    rekeningBank: {
      namaBank: 'Bank BRI',
      noRek: '019201938472509',
      atasNama: 'Muh. Yusuf'
    },
    statusKeanggotaan: 'Aktif',
    joinDate: '2019-04-10',
    isDataEncrypted: true
  },
  {
    id: 'MEM-010',
    nip: '198105082009121004',
    namaLengkap: 'H. Sudirman',
    gelarDepan: 'H.',
    gelarBelakang: 'S.H.I., M.H.',
    jabatan: 'Penghulu Ahli Muda',
    kuaKecamatan: 'KUA Kec. Watang Sawitto',
    kabKota: 'Kab. Pinrang',
    noHpWa: '085255443322',
    email: 'sudirman.pinrang@kemenag.go.id',
    rekeningBank: {
      namaBank: 'Bank Mandiri',
      noRek: '1520092837461',
      atasNama: 'Sudirman'
    },
    statusKeanggotaan: 'Aktif',
    joinDate: '2018-11-20',
    isDataEncrypted: true
  },
  {
    id: 'MEM-011',
    nip: '197304192000031001',
    namaLengkap: 'Drs. H. Marzuki',
    gelarDepan: 'Drs. H.',
    gelarBelakang: 'M.Ag.',
    jabatan: 'Penghulu Ahli Utama',
    kuaKecamatan: 'KUA Kec. Sinjai Utara',
    kabKota: 'Kab. Sinjai',
    noHpWa: '081244883311',
    email: 'marzuki.sinjai@kemenag.go.id',
    rekeningBank: {
      namaBank: 'Bank Sulselbar Syariah',
      noRek: '5100773910284',
      atasNama: 'Marzuki'
    },
    statusKeanggotaan: 'Aktif',
    joinDate: '2016-01-15',
    isDataEncrypted: true
  },
  {
    id: 'MEM-012',
    nip: '198610112011011008',
    namaLengkap: 'Firman Syah',
    gelarDepan: '',
    gelarBelakang: 'S.Ag., M.H.',
    jabatan: 'Penghulu Ahli Muda',
    kuaKecamatan: 'KUA Kec. Bantaeng',
    kabKota: 'Kab. Bantaeng',
    noHpWa: '085399882211',
    email: 'firman.bantaeng@kemenag.go.id',
    rekeningBank: {
      namaBank: 'Bank Syariah Indonesia (BSI)',
      noRek: '7188291048',
      atasNama: 'Firman Syah'
    },
    statusKeanggotaan: 'Aktif',
    joinDate: '2020-06-25',
    isDataEncrypted: true
  },
  {
    id: 'MEM-013',
    nip: '198307222008011015',
    namaLengkap: 'H. Mansyur',
    gelarDepan: 'H.',
    gelarBelakang: 'S.Ag.',
    jabatan: 'Kepala KUA',
    kuaKecamatan: 'KUA Kec. Binamu',
    kabKota: 'Kab. Jeneponto',
    noHpWa: '082199334455',
    email: 'mansyur.jeneponto@kemenag.go.id',
    rekeningBank: {
      namaBank: 'Bank BRI',
      noRek: '028101928374501',
      atasNama: 'Mansyur'
    },
    statusKeanggotaan: 'Aktif',
    joinDate: '2019-09-18',
    isDataEncrypted: true
  },
  {
    id: 'MEM-014',
    nip: '198703052014021003',
    namaLengkap: 'Zainuddin',
    gelarDepan: '',
    gelarBelakang: 'S.H.I., M.Ag.',
    jabatan: 'Penghulu Ahli Pertama',
    kuaKecamatan: 'KUA Kec. Pattallassang',
    kabKota: 'Kab. Takalar',
    noHpWa: '085298774411',
    email: 'zainuddin.takalar@kemenag.go.id',
    rekeningBank: {
      namaBank: 'Bank Sulselbar Syariah',
      noRek: '5100992817263',
      atasNama: 'Zainuddin'
    },
    statusKeanggotaan: 'Aktif',
    joinDate: '2021-03-12',
    isDataEncrypted: true
  },
  {
    id: 'MEM-015',
    nip: '197805162006041008',
    namaLengkap: 'H. Syahrir',
    gelarDepan: 'H.',
    gelarBelakang: 'S.Ag., M.Si.',
    jabatan: 'Penghulu Ahli Madya',
    kuaKecamatan: 'KUA Kec. Benteng',
    kabKota: 'Kab. Kepulauan Selayar',
    noHpWa: '081342119900',
    email: 'syahrir.selayar@kemenag.go.id',
    rekeningBank: {
      namaBank: 'Bank Sulselbar Syariah',
      noRek: '5100338829101',
      atasNama: 'Syahrir'
    },
    statusKeanggotaan: 'Aktif',
    joinDate: '2018-01-20',
    isDataEncrypted: true
  }
];

// Generate 2026 iuran records for all members
export function generateInitialIuranRecords(members: PenghuluMember[]): IuranRecord[] {
  const records: IuranRecord[] = [];
  const currentMonth = 10; // Oktober 2026

  members.forEach(m => {
    for (let month = 1; month <= 10; month++) {
      const monthStr = month < 10 ? `0${month}` : `${month}`;
      const isPastMonth = month < currentMonth;
      
      let status: 'LUNAS' | 'BELUM_BAYAR' | 'MENUNGGU_VERIFIKASI' | 'TERLAMBAT' = 'LUNAS';
      let tglBayar = `2026-${monthStr}-05`;
      let metode: any = 'QRIS';
      let refNo: string | undefined = `QRIS-APRISS-${m.id}-${monthStr}`;

      if (month === 10) {
        // Current month variety
        if (['MEM-004', 'MEM-007', 'MEM-013'].includes(m.id)) {
          status = 'BELUM_BAYAR';
          tglBayar = '';
          metode = undefined;
          refNo = undefined;
        } else if (['MEM-005', 'MEM-012'].includes(m.id)) {
          status = 'MENUNGGU_VERIFIKASI';
          tglBayar = `2026-10-18`;
          metode = 'TRANSFER_MANUAL';
          refNo = `TF-MAN-${m.id}-10`;
        } else {
          status = 'LUNAS';
          metode = m.id === 'MEM-002' ? 'VA_BSI' : (m.id === 'MEM-001' ? 'VA_SULSELBAR' : 'QRIS');
        }
      } else if (month === 9) {
        if (['MEM-004', 'MEM-013'].includes(m.id)) {
          status = 'TERLAMBAT';
          tglBayar = '';
          metode = undefined;
          refNo = undefined;
        }
      }

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
        status,
        tanggalJatuhTempo: `2026-${monthStr}-10`,
        tanggalBayar: tglBayar || undefined,
        metodePembayaran: metode,
        nomorReferensi: refNo,
        kodeKwitansi: status === 'LUNAS' ? `KW-APRI-SS/2026/${monthStr}/${m.id.replace('MEM-', '')}` : undefined,
        catatan: status === 'LUNAS' ? 'Iuran Wajib Bulanan APRI Wilayah Sulsel' : undefined
      });
    }
  });

  return records;
}

export const INITIAL_CASH_FLOW: CashFlowEntry[] = [
  {
    id: 'BKU-2026-001',
    tanggal: '2026-01-02',
    jenis: 'MASUK',
    kategori: 'OPERASIONAL_SEKRETARIAT',
    nominal: 15450000,
    keterangan: 'Saldo Awal Kas Organisasi PW APRI Sulsel Tahun Anggaran 2026',
    penanggungJawab: 'Bendahara Wilayah (Ust. Ali Barakka)',
    periodeBulan: 1,
    periodeTahun: 2026
  },
  {
    id: 'BKU-2026-002',
    tanggal: '2026-02-15',
    jenis: 'MASUK',
    kategori: 'IURAN_ANGGOTA',
    nominal: 7250000,
    keterangan: 'Rekapitulasi Penerimaan Iuran Wajib Periode Januari-Februari 2026',
    penanggungJawab: 'Bendahara Wilayah',
    periodeBulan: 2,
    periodeTahun: 2026
  },
  {
    id: 'BKU-2026-003',
    tanggal: '2026-03-20',
    jenis: 'KELUAR',
    kategori: 'BIMTEK_PENGHULU',
    nominal: 3500000,
    keterangan: 'Konsumsi & Modul Pelatihan Penguatan Fiqih Munakahat Penghulu di Asrama Haji Sudiang',
    penanggungJawab: 'Bidang Pengembangan Kepenghuluan',
    buktiRef: 'KWT-BIMTEK-03/26',
    periodeBulan: 3,
    periodeTahun: 2026
  },
  {
    id: 'BKU-2026-004',
    tanggal: '2026-05-10',
    jenis: 'KELUAR',
    kategori: 'SANTUNAN_DUKA',
    nominal: 2000000,
    keterangan: 'Santunan Duka Cita Penghulu Berpulang (Alm. H. Basir, KUA Tanete Rilau Barru)',
    penanggungJawab: 'Bidang Sosial & Kesejahteraan',
    buktiRef: 'STN-DUKA-05/26',
    periodeBulan: 5,
    periodeTahun: 2026
  },
  {
    id: 'BKU-2026-005',
    tanggal: '2026-08-25',
    jenis: 'KELUAR',
    kategori: 'RAKERWIL_APRI',
    nominal: 4200000,
    keterangan: 'Penyelenggaraan Pra-Rakerwil APRI Sulsel di Hotel Grand Asia Makassar',
    penanggungJawab: 'Sekretariat Panitia Rakerwil',
    buktiRef: 'KWT-RAKER-08/26',
    periodeBulan: 8,
    periodeTahun: 2026
  },
  {
    id: 'BKU-2026-006',
    tanggal: '2026-10-12',
    jenis: 'MASUK',
    kategori: 'IURAN_ANGGOTA',
    nominal: 6150000,
    keterangan: 'Penerimaan Iuran Anggota Terverifikasi Otomatis via QRIS & Virtual Account (Oktober 2026)',
    penanggungJawab: 'Sistem Gateway APRI',
    periodeBulan: 10,
    periodeTahun: 2026
  }
];

export const INITIAL_NOTIFICATIONS: NotificationLog[] = [
  {
    id: 'NOTIF-001',
    memberId: 'MEM-004',
    memberNama: 'Andi Baso Rahmat',
    noWa: '082188990011',
    kabKota: 'Kab. Bone',
    kuaKecamatan: 'KUA Kec. Tanete Riattang',
    periodeBulan: 10,
    periodeTahun: 2026,
    tipe: 'JATUH_TEMPO',
    channel: 'WhatsApp',
    statusKirim: 'Terkirim',
    timestamp: '2026-10-08 08:30:15',
    pesan: 'Assalamu\'alaikum Wr. Wb. Yth. Bapak Andi Baso Rahmat, S.H.I., M.Pd.I. (KUA Tanete Riattang Bone). Mengingatkan iuran rutin PW APRI Sulsel periode Oktober 2026 sebesar Rp 50.000 jatuh tempo tgl 10 Oktober 2026. Mohon konfirmasi atau bayar instan via QRIS/VA APRI Sulsel. Syukron Katsiran.',
    tautanBayar: 'https://apri-sulsel.id/pay/IUR-2026-10-MEM-004'
  },
  {
    id: 'NOTIF-002',
    memberId: 'MEM-007',
    memberNama: 'Muhammad Arifin',
    noWa: '085240998877',
    kabKota: 'Kota Parepare',
    kuaKecamatan: 'KUA Kec. Soreang',
    periodeBulan: 10,
    periodeTahun: 2026,
    tipe: 'JATUH_TEMPO',
    channel: 'WhatsApp',
    statusKirim: 'Terkirim',
    timestamp: '2026-10-08 08:30:20',
    pesan: 'Assalamu\'alaikum Wr. Wb. Yth. Bapak Muhammad Arifin, S.H.I. (KUA Soreang Parepare). Mengingatkan iuran rutin PW APRI Sulsel periode Oktober 2026 sebesar Rp 50.000 jatuh tempo tgl 10 Oktober 2026. Pembayaran instan via QRIS/VA telah tersedia di aplikasi.',
    tautanBayar: 'https://apri-sulsel.id/pay/IUR-2026-10-MEM-007'
  },
  {
    id: 'NOTIF-003',
    memberId: 'MEM-001',
    memberNama: 'Drs. H. Muhammad Asyik',
    noWa: '081242338899',
    kabKota: 'Kota Makassar',
    kuaKecamatan: 'KUA Kec. Tamalate',
    periodeBulan: 10,
    periodeTahun: 2026,
    tipe: 'KONFIRMASI_LUNAS',
    channel: 'WhatsApp',
    statusKirim: 'Terkirim',
    timestamp: '2026-10-05 14:10:02',
    pesan: 'Alhamdulillah, pembayaran iuran PW APRI Sulsel periode Oktober 2026 sebesar Rp 50.000 telah BERHASIL diverifikasi (No. Kwitansi: KW-APRI-SS/2026/10/001). Terima kasih atas kedisiplinan dan kontribusinya.',
    tautanBayar: 'https://apri-sulsel.id/kwitansi/KW-APRI-SS-2026-10-001'
  }
];
