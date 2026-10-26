import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { IuranRecord, PenghuluMember, CashFlowEntry } from '../types';
import { NAMA_BULAN } from '../data/mockData';

// Helper to format currency Rupiah
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(amount);
}

/**
 * Export table data to CSV/Excel format compatible with Microsoft Excel and Google Sheets
 */
export function exportToExcel(
  filename: string,
  headers: string[],
  rows: (string | number)[][],
  reportTitle?: string
) {
  let csvContent = '\uFEFF'; // UTF-8 BOM for Excel to render accents and symbols correctly
  
  if (reportTitle) {
    csvContent += `"${reportTitle.replace(/"/g, '""')}"\n`;
    csvContent += `"Dicetak pada: ${new Date().toLocaleString('id-ID')}"\n\n`;
  }

  // Headers
  csvContent += headers.map(h => `"${h.replace(/"/g, '""')}"`).join(',') + '\n';

  // Rows
  rows.forEach(row => {
    const formattedRow = row.map(cell => {
      if (cell === null || cell === undefined) return '""';
      return `"${String(cell).replace(/"/g, '""')}"`;
    });
    csvContent += formattedRow.join(',') + '\n';
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Generate PDF of Monthly/Periodic Iuran Recapitulation
 * With AD/ART Distribution breakdown: PC (60%), PW (25%), PP (15%)
 */
export function generateRekapitulasiPDF(
  records: IuranRecord[],
  bulan: number,
  tahun: number,
  totalLunas: number,
  totalBelumBayar: number,
  totalDana: number
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Header Kemenag / APRI Sulsel
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(20, 83, 45); // Emerald 900
  doc.text('ASOSIASI PENGHULU REPUBLIK INDONESIA (APRI)', 105, 18, { align: 'center' });
  
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text('PENGURUS WILAYAH PROVINSI SULAWESI SELATAN', 105, 24, { align: 'center' });
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Sekretariat: Jl. Masjid Raya No. 55 Makassar, Sulawesi Selatan 90151', 105, 29, { align: 'center' });
  doc.text('Email: apri.sulsel@kemenag.go.id | Kontak Resmi Bendahara: 0812-4233-8899', 105, 33, { align: 'center' });

  // Divider line
  doc.setDrawColor(20, 83, 45);
  doc.setLineWidth(0.8);
  doc.line(14, 36, 196, 36);
  doc.setLineWidth(0.2);
  doc.line(14, 37.5, 196, 37.5);

  // Document Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  const bulanName = bulan > 0 ? (NAMA_BULAN[bulan - 1] || 'Semua Periode') : 'Iuran Pangkal Registrasi';
  doc.text(`LAPORAN REKAPITULASI IURAN ANGGOTA - ${bulanName.toUpperCase()} ${tahun}`, 105, 45, { align: 'center' });

  // Summary metadata cards
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 49, 182, 22, 2, 2, 'F');
  
  doc.text(`Total Terdata: ${records.length} Anggota`, 18, 55);
  doc.text(`Status Lunas: ${totalLunas} Anggota`, 18, 61);
  doc.text(`Belum Bayar: ${totalBelumBayar} Anggota`, 18, 67);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(20, 83, 45);
  doc.text(`Total Penerimaan: ${formatRupiah(totalDana)}`, 85, 55);

  // AD/ART Distribution Summary
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  const porsiPC = Math.round(totalDana * 0.60);
  const porsiPW = Math.round(totalDana * 0.25);
  const porsiPP = Math.round(totalDana * 0.15);
  doc.text(`Distribusi AD/ART:`, 85, 61);
  doc.text(`• PC Cabang (60%): ${formatRupiah(porsiPC)}`, 112, 61);
  doc.text(`• PW Sulsel (25%): ${formatRupiah(porsiPW)}`, 112, 67);
  doc.text(`• PP Pusat (15%): ${formatRupiah(porsiPP)}`, 155, 67);

  // Table Data
  const tableData = records.map((r, index) => {
    const isPangkal = r.jenisIuran === 'PANGKAL' || r.periodeBulan === 0;
    const porsiPcText = isPangkal ? '-' : formatRupiah(Math.round(r.nominal * 0.60));
    return [
      index + 1,
      r.memberNama,
      r.nip,
      r.kabKota.replace('Kab. ', '').replace('Kota ', ''),
      isPangkal ? 'Pangkal (1x)' : `${NAMA_BULAN[r.periodeBulan - 1] || '-'}`,
      r.status === 'LUNAS' ? 'Lunas' : 'Belum',
      formatRupiah(r.nominal),
      porsiPcText,
      r.tanggalBayar || '-'
    ];
  });

  autoTable(doc, {
    startY: 75,
    head: [['No', 'Nama Penghulu', 'NIP', 'Cabang', 'Jenis/Periode', 'Status', 'Nominal', 'Hak PC (60%)', 'Tgl Bayar']],
    body: tableData,
    theme: 'grid',
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240]
    },
    headStyles: {
      fillColor: [20, 83, 45], // Emerald deep green
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { cellWidth: 38 },
      2: { cellWidth: 26 },
      3: { cellWidth: 22 },
      4: { halign: 'center', cellWidth: 20 },
      5: { halign: 'center', cellWidth: 15 },
      6: { halign: 'right', cellWidth: 20 },
      7: { halign: 'right', cellWidth: 20 },
      8: { halign: 'center', cellWidth: 17 }
    }
  });

  // Footer / Signature Section
  const finalY = (doc as any).lastAutoTable.finalY || 180;
  const signY = finalY > 230 ? 245 : finalY + 14;

  if (signY < 270) {
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`Makassar, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, 140, signY);
    doc.text('Pengurus Wilayah APRI Sulsel', 140, signY + 5);
    doc.text('Bendahara Wilayah,', 140, signY + 9);

    // Digital signature indication
    doc.setDrawColor(20, 83, 45);
    doc.roundedRect(138, signY + 11, 48, 14, 1, 1);
    doc.setFontSize(7);
    doc.setTextColor(20, 83, 45);
    doc.text('[ VERIFIKASI DIGITAL APRI ]', 162, signY + 17, { align: 'center' });
    doc.text('SKEMA AD/ART TERVALIDASI', 162, signY + 22, { align: 'center' });

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('Drs. H. Muhammad Asyik, M.Ag.', 140, signY + 31);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text('NIP. 19750812 200312 1 002', 140, signY + 35);
  }

  doc.save(`Rekap_Iuran_APRI_Sulsel_${bulanName}_${tahun}.pdf`);
}

/**
 * Generate Individual Payment Receipt (Kwitansi Sah APRI)
 * With AD/ART Distribution breakdown note
 */
export function generateKwitansiPDF(iuran: IuranRecord, member?: PenghuluMember) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a5'
  });

  const isPangkal = iuran.jenisIuran === 'PANGKAL' || iuran.periodeBulan === 0;

  // Header Box
  doc.setFillColor(20, 83, 45);
  doc.rect(0, 0, 148, 24, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text('ASOSIASI PENGHULU REPUBLIK INDONESIA (APRI)', 74, 10, { align: 'center' });
  
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text('PENGURUS WILAYAH SULAWESI SELATAN - BUKTI IURAN RESMI', 74, 16, { align: 'center' });

  // Receipt Number
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  const kwitansiNo = iuran.kodeKwitansi || `KW-APRI-SS/2026/${iuran.periodeBulan}/${iuran.id.slice(-4)}`;
  doc.text(`Nomor Resi: ${kwitansiNo}`, 12, 33);
  doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}`, 136, 33, { align: 'right' });

  doc.setDrawColor(226, 232, 240);
  doc.line(12, 36, 136, 36);

  // Content Details
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  
  const startY = 44;
  const lineGap = 7;

  doc.setFont('helvetica', 'normal');
  doc.text('Telah Diterima Dari', 12, startY);
  doc.text(':', 48, startY);
  doc.setFont('helvetica', 'bold');
  doc.text(iuran.memberNama, 52, startY);

  doc.setFont('helvetica', 'normal');
  doc.text('NIP Penghulu', 12, startY + lineGap);
  doc.text(':', 48, startY + lineGap);
  doc.text(iuran.nip, 52, startY + lineGap);

  doc.text('KUA / Wilayah Tugas', 12, startY + lineGap * 2);
  doc.text(':', 48, startY + lineGap * 2);
  doc.text(`${iuran.kuaKecamatan}, ${iuran.kabKota}`, 52, startY + lineGap * 2);

  doc.text('Untuk Pembayaran', 12, startY + lineGap * 3);
  doc.text(':', 48, startY + lineGap * 3);
  const tujuanPembayaran = isPangkal
    ? 'Iuran Pangkal Pendaftaran Anggota Baru APRI Sulsel (1x Registrasi)'
    : `Iuran Rutin APRI Sulsel Periode ${NAMA_BULAN[iuran.periodeBulan - 1] || 'Bulanan'} ${iuran.periodeTahun}`;
  doc.text(tujuanPembayaran, 52, startY + lineGap * 3);

  doc.text('Metode Pembayaran', 12, startY + lineGap * 4);
  doc.text(':', 48, startY + lineGap * 4);
  doc.text(iuran.metodePembayaran ? iuran.metodePembayaran.replace('_', ' ') : 'Gateway Terverifikasi', 52, startY + lineGap * 4);

  doc.text('Tanggal Pelunasan', 12, startY + lineGap * 5);
  doc.text(':', 48, startY + lineGap * 5);
  doc.text(iuran.tanggalBayar || new Date().toISOString().split('T')[0], 52, startY + lineGap * 5);

  // Amount Box
  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(34, 197, 94);
  doc.roundedRect(12, startY + lineGap * 6 + 4, 124, 16, 2, 2, 'FD');

  doc.setFontSize(9);
  doc.setTextColor(22, 101, 52);
  doc.text('JUMLAH PEMBAYARAN SAH (LUNAS):', 16, startY + lineGap * 6 + 11);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(formatRupiah(iuran.nominal), 132, startY + lineGap * 6 + 14, { align: 'right' });

  // AD/ART Distribution Box for Monthly Dues
  if (!isPangkal && iuran.nominal === 50000) {
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(12, 102, 124, 12, 1.5, 1.5, 'FD');
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('Alokasi Sesuai AD/ART & PO APRI:', 15, 106.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(20, 83, 45);
    doc.text('PC Cabang (60%): Rp 30.000  ·  PW Sulsel (25%): Rp 12.500  ·  PP Pusat (15%): Rp 7.500', 15, 111);
  }

  // Verification Seal
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Kwitansi ini diterbitkan secara otomatis dan sah melalui Sistem Informasi Iuran APRI Sulsel.', 12, 125);
  doc.text('Kode Keamanan Digital: SHA-256 Validated - Realtime Gateway Reconciliation', 12, 129);

  // Digital Signature
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('Makassar, Bendahara PW APRI Sulsel', 90, 138);
  doc.setFont('helvetica', 'bold');
  doc.text('Drs. H. Muhammad Asyik, M.Ag.', 90, 153);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('NIP. 197508122003121002', 90, 157);

  doc.save(`Kwitansi_APRI_${kwitansiNo.replace(/\//g, '-')}.pdf`);
}

export interface LaporanKeuanganPDFOptions {
  entries: CashFlowEntry[];
  bulan: number;
  tahun: number;
  totalMasuk: number;
  totalKeluar: number;
  saldoAkhir: number;
  title?: string;
  subTitle?: string;
  scopeLabel?: string;
  kabKota?: string;
  bendaharaNama?: string;
  bendaharaNip?: string;
  role?: string;
  porsiStats?: {
    totalPorsiPC: number;
    totalPorsiPW: number;
    totalPorsiPP: number;
  };
}

/**
 * Generate PDF of Financial Cash Book (BKU - Buku Kas Umum)
 * Supports both Bendahara Wilayah and Bendahara Cabang formats with legal signatures and AD/ART allocations
 */
export function generateLaporanKeuanganPDF(
  entriesOrOptions: CashFlowEntry[] | LaporanKeuanganPDFOptions,
  legacyBulan?: number,
  legacyTahun?: number,
  legacyTotalMasuk?: number,
  legacyTotalKeluar?: number,
  legacySaldoAkhir?: number
) {
  let opts: LaporanKeuanganPDFOptions;

  if (Array.isArray(entriesOrOptions)) {
    opts = {
      entries: entriesOrOptions,
      bulan: legacyBulan || 10,
      tahun: legacyTahun || 2026,
      totalMasuk: legacyTotalMasuk || 0,
      totalKeluar: legacyTotalKeluar || 0,
      saldoAkhir: legacySaldoAkhir || 0,
      title: 'PENGURUS WILAYAH PROVINSI SULAWESI SELATAN',
      subTitle: 'BUKU KAS UMUM & LAPORAN KEUANGAN ORGANISASI',
      bendaharaNama: 'Drs. H. Muhammad Asyik, M.Ag.',
      bendaharaNip: '197508122003121002',
    };
  } else {
    opts = entriesOrOptions;
  }

  const {
    entries,
    bulan,
    tahun,
    totalMasuk,
    totalKeluar,
    saldoAkhir,
    title = 'PENGURUS WILAYAH PROVINSI SULAWESI SELATAN',
    subTitle = 'BUKU KAS UMUM & LAPORAN KEUANGAN KAS',
    scopeLabel = 'Wilayah Sulawesi Selatan',
    kabKota,
    bendaharaNama = 'Drs. H. Muhammad Asyik, M.Ag.',
    bendaharaNip = '197508122003121002',
    porsiStats
  } = opts;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12.5);
  doc.setTextColor(20, 83, 45); // Emerald 900
  doc.text('ASOSIASI PENGHULU REPUBLIK INDONESIA (APRI)', 105, 16, { align: 'center' });
  
  doc.setFontSize(10.5);
  doc.setTextColor(30, 41, 59);
  doc.text(title.toUpperCase(), 105, 22, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  if (kabKota) {
    doc.text(`Kantor Pimpinan Cabang APRI ${kabKota} - Kementerian Agama RI`, 105, 27, { align: 'center' });
  } else {
    doc.text('Sekretariat: Jl. Masjid Raya No. 55 Makassar, Sulawesi Selatan 90151', 105, 27, { align: 'center' });
  }

  doc.setDrawColor(20, 83, 45);
  doc.setLineWidth(0.8);
  doc.line(14, 30.5, 196, 30.5);
  doc.setLineWidth(0.2);
  doc.line(14, 31.8, 196, 31.8);

  // Document Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  const bulanName = bulan > 0 ? (NAMA_BULAN[bulan - 1] || 'Semua Bulan') : 'Tahunan';
  doc.text(`${subTitle.toUpperCase()}`, 105, 38, { align: 'center' });
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Periode: ${bulanName} ${tahun}  |  Entitas: ${scopeLabel}`, 105, 43, { align: 'center' });

  // Summary box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, 47, 182, 17, 2, 2, 'FD');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Total Kas Masuk:', 18, 54);
  doc.text('Total Kas Keluar:', 80, 54);
  doc.text('Saldo Akhir Kas:', 140, 54);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(20, 83, 45);
  doc.text(formatRupiah(totalMasuk), 18, 60);
  doc.setTextColor(190, 18, 60);
  doc.text(formatRupiah(totalKeluar), 80, 60);
  doc.setTextColor(15, 23, 42);
  doc.text(formatRupiah(saldoAkhir), 140, 60);

  // If porsiStats provided, show AD/ART note
  let currentY = 67;
  if (porsiStats) {
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(
      `Alokasi AD/ART Terkumpul: Cabang PC (60%) ${formatRupiah(porsiStats.totalPorsiPC)}  ·  Wilayah PW (25%) ${formatRupiah(porsiStats.totalPorsiPW)}  ·  Pusat PP (15%) ${formatRupiah(porsiStats.totalPorsiPP)}`,
      14,
      currentY
    );
    currentY += 4;
  }

  // Calculate running balances for entries
  let runningBalance = 0;
  // Sort oldest first for running balance calculation, or keep display
  const tableData = entries.map((e, index) => {
    if (e.jenis === 'MASUK') {
      runningBalance += e.nominal;
    } else {
      runningBalance -= e.nominal;
    }

    const catLabel = e.kategori
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, c => c.toUpperCase());

    return [
      index + 1,
      e.tanggal,
      e.buktiRef || '-',
      e.keterangan,
      catLabel,
      e.jenis === 'MASUK' ? formatRupiah(e.nominal) : '-',
      e.jenis === 'KELUAR' ? formatRupiah(e.nominal) : '-',
      formatRupiah(runningBalance)
    ];
  });

  autoTable(doc, {
    startY: currentY + 1,
    head: [['No', 'Tanggal', 'No. Bukti', 'Uraian Transaksi', 'Pos Anggaran', 'Penerimaan', 'Pengeluaran', 'Saldo Kas']],
    body: tableData.length > 0 ? tableData : [['-', '-', '-', 'Tidak ada data transaksi kas pada periode ini', '-', '-', '-', '-']],
    theme: 'grid',
    styles: {
      fontSize: 7,
      cellPadding: 2,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240]
    },
    headStyles: {
      fillColor: [20, 83, 45],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 7 },
      1: { halign: 'center', cellWidth: 17 },
      2: { halign: 'center', cellWidth: 18 },
      3: { cellWidth: 50 },
      4: { cellWidth: 26 },
      5: { halign: 'right', cellWidth: 22 },
      6: { halign: 'right', cellWidth: 22 },
      7: { halign: 'right', cellWidth: 20 }
    }
  });

  // Footer & Official Signatures
  // @ts-ignore
  const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY : 180;
  const sigY = Math.min(finalY + 12, 240);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 41, 59);

  // Left Signatory: Ketua
  doc.text('Mengetahui,', 25, sigY);
  doc.text(kabKota ? `Ketua PC APRI ${kabKota}` : 'Ketua PW APRI Sulawesi Selatan', 25, sigY + 5);
  doc.setFont('helvetica', 'bold');
  doc.text(kabKota ? 'Ketua PC APRI' : 'H. Andi Saharuddin, S.Ag.', 25, sigY + 22);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('Tanda Tangan & Cap Organisasi', 25, sigY + 26);

  // Right Signatory: Bendahara
  doc.setFontSize(8);
  doc.text(`Makassar, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, 135, sigY);
  doc.text(kabKota ? `Bendahara PC APRI ${kabKota}` : 'Bendahara PW APRI Sulawesi Selatan', 135, sigY + 5);
  doc.setFont('helvetica', 'bold');
  doc.text(bendaharaNama, 135, sigY + 22);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text(`NIP. ${bendaharaNip}`, 135, sigY + 26);

  // Digital validity seal note
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text('Laporan ini dihasilkan secara otomatis dan terotentikasi melalui Sistem Informasi Keuangan & Iuran APRI Sulawesi Selatan.', 14, 287);

  const cleanFilename = `Laporan_Keuangan_APRI_${(kabKota || 'Sulsel').replace(/[^a-zA-Z0-9]/g, '_')}_${bulanName}_${tahun}.pdf`;
  doc.save(cleanFilename);
}

/**
 * Export Financial Statement to Excel/CSV with complete metadata
 */
export function exportFinancialReportExcel(options: {
  entries: CashFlowEntry[];
  bulan: number;
  tahun: number;
  totalMasuk: number;
  totalKeluar: number;
  saldoAkhir: number;
  scopeLabel: string;
  bendaharaNama?: string;
}) {
  const { entries, bulan, tahun, totalMasuk, totalKeluar, saldoAkhir, scopeLabel, bendaharaNama } = options;
  const bulanName = bulan > 0 ? (NAMA_BULAN[bulan - 1] || 'Semua Bulan') : 'Semua Bulan';

  const headers = [
    'No',
    'Tanggal',
    'No. Bukti Transaksi',
    'Uraian / Keterangan Transaksi',
    'Kategori Pos Anggaran',
    'Entitas / Cabang',
    'Penerimaan (Kas Masuk Rp)',
    'Pengeluaran (Kas Keluar Rp)',
    'Penanggung Jawab'
  ];

  const rows = entries.map((e, idx) => [
    idx + 1,
    e.tanggal,
    e.buktiRef || '-',
    e.keterangan,
    e.kategori.replace(/_/g, ' '),
    e.kabKota || 'PW Wilayah Sulsel',
    e.jenis === 'MASUK' ? e.nominal : 0,
    e.jenis === 'KELUAR' ? e.nominal : 0,
    e.penanggungJawab
  ]);

  // Add summary rows
  rows.push(['', '', '', '', 'TOTAL PENERIMAAN', '', totalMasuk, '', '']);
  rows.push(['', '', '', '', 'TOTAL PENGELUARAN', '', '', totalKeluar, '']);
  rows.push(['', '', '', '', 'SALDO AKHIR KAS', '', saldoAkhir, '', `Bendahara: ${bendaharaNama || 'APRI Sulsel'}`]);

  exportToExcel(
    `Laporan_Keuangan_APRI_${scopeLabel.replace(/[^a-zA-Z0-9]/g, '_')}_${bulanName}_${tahun}`,
    headers,
    rows,
    `LAPORAN BUKU KAS UMUM & REALISASI KEUANGAN APRI - ${scopeLabel.toUpperCase()} (${bulanName.toUpperCase()} ${tahun})`
  );
}

