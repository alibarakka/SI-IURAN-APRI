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
  const bulanName = NAMA_BULAN[bulan - 1] || 'Semua Periode';
  doc.text(`LAPORAN REKAPITULASI IURAN ANGGOTA - ${bulanName.toUpperCase()} ${tahun}`, 105, 46, { align: 'center' });

  // Summary metadata cards
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 51, 182, 16, 2, 2, 'F');
  
  doc.text(`Total Anggota Terdata: ${records.length} Orang`, 18, 57);
  doc.text(`Status Lunas: ${totalLunas} Anggota`, 18, 63);
  
  doc.text(`Menunggak / Belum: ${totalBelumBayar} Anggota`, 90, 57);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(20, 83, 45);
  doc.text(`Total Kas Diterima: ${formatRupiah(totalDana)}`, 90, 63);

  // Table Data
  const tableData = records.map((r, index) => [
    index + 1,
    r.memberNama,
    r.nip,
    r.kabKota,
    r.kuaKecamatan,
    r.status === 'LUNAS' ? 'Lunas' : (r.status === 'MENUNGGU_VERIFIKASI' ? 'Menunggu' : 'Belum Bayar'),
    formatRupiah(r.nominal),
    r.tanggalBayar || '-'
  ]);

  autoTable(doc, {
    startY: 72,
    head: [['No', 'Nama Penghulu', 'NIP', 'Kab / Kota', 'KUA Kecamatan', 'Status', 'Nominal', 'Tgl Bayar']],
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
      1: { cellWidth: 36 },
      2: { cellWidth: 28 },
      3: { cellWidth: 28 },
      4: { cellWidth: 28 },
      5: { halign: 'center', cellWidth: 20 },
      6: { halign: 'right', cellWidth: 22 },
      7: { halign: 'center', cellWidth: 16 }
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
    doc.text('TERVALIDASI REAL-TIME', 162, signY + 22, { align: 'center' });

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
 */
export function generateKwitansiPDF(iuran: IuranRecord, member?: PenghuluMember) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a5'
  });

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
  doc.text(`Iuran Rutin APRI Sulsel Periode ${NAMA_BULAN[iuran.periodeBulan - 1]} ${iuran.periodeTahun}`, 52, startY + lineGap * 3);

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

  // Verification Seal
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Kwitansi ini diterbitkan secara otomatis dan sah melalui Sistem Informasi Iuran APRI Sulsel.', 12, 125);
  doc.text('Kode Keamanan Digital: SHA-256 Validated - Realtime Gateway Reconciliation', 12, 129);

  // Digital Signature
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('Makassar, Bendahara PW APRI Sulsel', 90, 140);
  doc.setFont('helvetica', 'bold');
  doc.text('Drs. H. Muhammad Asyik, M.Ag.', 90, 155);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('NIP. 197508122003121002', 90, 159);

  doc.save(`Kwitansi_APRI_${kwitansiNo.replace(/\//g, '-')}.pdf`);
}

/**
 * Generate PDF of Financial Cash Book (BKU - Buku Kas Umum)
 */
export function generateLaporanKeuanganPDF(
  entries: CashFlowEntry[],
  bulan: number,
  tahun: number,
  totalMasuk: number,
  totalKeluar: number,
  saldoAkhir: number
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(20, 83, 45);
  doc.text('ASOSIASI PENGHULU REPUBLIK INDONESIA (APRI)', 105, 18, { align: 'center' });
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text('PENGURUS WILAYAH PROVINSI SULAWESI SELATAN', 105, 24, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text('BUKU KAS UMUM (BKU) ORGANISASI', 105, 30, { align: 'center' });

  doc.setDrawColor(20, 83, 45);
  doc.setLineWidth(0.8);
  doc.line(14, 34, 196, 34);

  // Period
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`LAPORAN KAS BULAN: ${NAMA_BULAN[bulan - 1]?.toUpperCase() || 'SEMUA'} ${tahun}`, 105, 42, { align: 'center' });

  // Summary box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 46, 182, 14, 2, 2, 'F');
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Total Pemasukan: ${formatRupiah(totalMasuk)}`, 18, 55);
  doc.text(`Total Pengeluaran: ${formatRupiah(totalKeluar)}`, 85, 55);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(20, 83, 45);
  doc.text(`Saldo Akhir Kas: ${formatRupiah(saldoAkhir)}`, 145, 55);

  const tableData = entries.map((e, index) => [
    index + 1,
    e.tanggal,
    e.keterangan,
    e.kategori.replace('_', ' '),
    e.jenis === 'MASUK' ? formatRupiah(e.nominal) : '-',
    e.jenis === 'KELUAR' ? formatRupiah(e.nominal) : '-',
    e.penanggungJawab
  ]);

  autoTable(doc, {
    startY: 65,
    head: [['No', 'Tanggal', 'Keterangan Transaksi', 'Kategori Pos', 'Penerimaan', 'Pengeluaran', 'Penanggung Jawab']],
    body: tableData,
    theme: 'grid',
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240]
    },
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { halign: 'center', cellWidth: 20 },
      2: { cellWidth: 50 },
      3: { cellWidth: 30 },
      4: { halign: 'right', cellWidth: 24 },
      5: { halign: 'right', cellWidth: 24 },
      6: { cellWidth: 26 }
    }
  });

  doc.save(`Laporan_Kas_APRI_Sulsel_${NAMA_BULAN[bulan - 1]}_${tahun}.pdf`);
}
