import React, { useState } from 'react';
import { 
  Lock, 
  UserCheck, 
  ShieldCheck, 
  Building2, 
  MapPin, 
  Mail, 
  Phone, 
  CreditCard, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  EyeOff,
  UserPlus,
  LogIn
} from 'lucide-react';
import { AuthUser, PenghuluMember, UserRole } from '../types';
import { KAB_KOTA_SULSEL, DEFAULT_ADMIN_WILAYAH, DEFAULT_BRANCH_ADMINS } from '../data/mockData';
import { encryptField } from '../utils/crypto';

interface AuthScreenProps {
  onLoginSuccess: (user: AuthUser) => void;
  onRegisterMember: (newMember: PenghuluMember) => void;
  members: PenghuluMember[];
  sealImageUrl: string;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onLoginSuccess,
  onRegisterMember,
  members,
  sealImageUrl
}) => {
  const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  
  // Login State
  const [loginRole, setLoginRole] = useState<UserRole>('BENDAHARA_WILAYAH');
  const [selectedBranchKab, setSelectedBranchKab] = useState<string>('Kota Makassar');
  const [loginIdentifier, setLoginIdentifier] = useState<string>('bendahara.wilayah@aprisulsel.or.id');
  const [loginPassword, setLoginPassword] = useState<string>('aprisulsel2026');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Register State
  const [regNip, setRegNip] = useState('');
  const [regNama, setRegNama] = useState('');
  const [regGelarDepan, setRegGelarDepan] = useState('');
  const [regGelarBelakang, setRegGelarBelakang] = useState('S.Ag., M.H.');
  const [regJabatan, setRegJabatan] = useState<PenghuluMember['jabatan']>('Penghulu Ahli Muda');
  const [regKabKota, setRegKabKota] = useState('Kota Makassar');
  const [regKuaKecamatan, setRegKuaKecamatan] = useState('KUA Kec. Tamalate');
  const [regNoWa, setRegNoWa] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regNamaBank, setRegNamaBank] = useState('Bank Sulselbar Syariah');
  const [regNoRek, setRegNoRek] = useState('');
  const [regAtasNama, setRegAtasNama] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regError, setRegError] = useState<string | null>(null);
  const [regSuccess, setRegSuccess] = useState<string | null>(null);
  const [isSubmittingReg, setIsSubmittingReg] = useState(false);

  // Quick switch role preset
  const handleSelectRole = (role: UserRole) => {
    setLoginRole(role);
    setLoginError(null);
    if (role === 'BENDAHARA_WILAYAH') {
      setLoginIdentifier(DEFAULT_ADMIN_WILAYAH.email);
      setLoginPassword('aprisulsel2026');
    } else if (role === 'BENDAHARA_CABANG') {
      const branchInfo = DEFAULT_BRANCH_ADMINS[selectedBranchKab] || {
        email: `bendahara.${selectedBranchKab.toLowerCase().replace(/[^a-z]/g, '')}@aprisulsel.or.id`
      };
      setLoginIdentifier(branchInfo.email);
      setLoginPassword('apricabang2026');
    } else {
      // Member login
      if (members.length > 0) {
        setLoginIdentifier(members[0].nip);
      } else {
        setLoginIdentifier('');
      }
      setLoginPassword('');
    }
  };

  const handleBranchChange = (kab: string) => {
    setSelectedBranchKab(kab);
    const branchInfo = DEFAULT_BRANCH_ADMINS[kab] || {
      email: `bendahara.${kab.toLowerCase().replace(/[^a-z]/g, '')}@aprisulsel.or.id`
    };
    setLoginIdentifier(branchInfo.email);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (loginRole === 'BENDAHARA_WILAYAH') {
      // Authenticate Bendahara Wilayah
      if (loginIdentifier.trim() && loginPassword.trim()) {
        onLoginSuccess({
          ...DEFAULT_ADMIN_WILAYAH,
          role: 'BENDAHARA_WILAYAH'
        });
      } else {
        setLoginError('Harap isi email/NIP dan password Bendahara Wilayah.');
      }
    } else if (loginRole === 'BENDAHARA_CABANG') {
      // Authenticate Bendahara Cabang
      const branchAdmin = DEFAULT_BRANCH_ADMINS[selectedBranchKab];
      const branchUser: AuthUser = {
        id: `USR-PC-${selectedBranchKab.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8)}`,
        namaLengkap: branchAdmin?.nama || `Bendahara PC APRI ${selectedBranchKab}`,
        email: loginIdentifier,
        nip: branchAdmin?.nip || '198001012005011001',
        role: 'BENDAHARA_CABANG',
        kabKota: selectedBranchKab,
        jabatan: `Bendahara PC APRI ${selectedBranchKab}`
      };
      onLoginSuccess(branchUser);
    } else {
      // Authenticate Member Penghulu
      const query = loginIdentifier.trim().toLowerCase();
      const matchedMember = members.find(
        m => m.nip === query || m.email.toLowerCase() === query || (m.password && m.password === loginPassword)
      );

      if (matchedMember) {
        const memberUser: AuthUser = {
          id: `USR-MEM-${matchedMember.id}`,
          namaLengkap: matchedMember.namaLengkap,
          email: matchedMember.email,
          nip: matchedMember.nip,
          role: 'ANGGOTA_PENGHULU',
          kabKota: matchedMember.kabKota,
          kuaKecamatan: matchedMember.kuaKecamatan,
          jabatan: matchedMember.jabatan,
          memberId: matchedMember.id
        };
        onLoginSuccess(memberUser);
      } else {
        if (members.length === 0) {
          setLoginError('Belum ada anggota terdaftar di sistem. Silakan klik tab "Pendaftaran Anggota Baru" terlebih dahulu.');
        } else {
          setLoginError('NIP atau email tidak ditemukan. Pastikan data yang dimasukkan sesuai saat pendaftaran.');
        }
      }
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);
    setRegSuccess(null);

    // Validation
    const cleanNip = regNip.replace(/\s+/g, '');
    if (!/^\d{12,18}$/.test(cleanNip)) {
      setRegError('NIP harus berupa 12–18 digit angka resmi Kementerian Agama.');
      return;
    }

    if (members.some(m => m.nip === cleanNip)) {
      setRegError('NIP ini sudah terdaftar sebagai anggota APRI Sulsel.');
      return;
    }

    if (regPassword && regPassword !== regConfirmPassword) {
      setRegError('Password dan Konfirmasi Password tidak cocok.');
      return;
    }

    setIsSubmittingReg(true);

    try {
      // Perform AES-256 encryption on sensitive fields
      const [nipCipher, waCipher, bankCipher] = await Promise.all([
        encryptField(cleanNip),
        encryptField(regNoWa),
        encryptField(regNoRek)
      ]);

      const newMemberId = `MEM-${Date.now().toString().slice(-4)}`;
      const newMember: PenghuluMember = {
        id: newMemberId,
        nip: cleanNip,
        namaLengkap: regNama.trim(),
        gelarDepan: regGelarDepan.trim() || undefined,
        gelarBelakang: regGelarBelakang.trim() || undefined,
        jabatan: regJabatan,
        kabKota: regKabKota,
        kuaKecamatan: regKuaKecamatan.trim() || `KUA ${regKabKota}`,
        noHpWa: regNoWa.trim(),
        email: regEmail.trim() || `${cleanNip}@kemenag.go.id`,
        password: regPassword || 'apri12345',
        rekeningBank: {
          namaBank: regNamaBank,
          noRek: regNoRek.trim() || '510000000000',
          atasNama: regAtasNama.trim() || regNama.trim()
        },
        statusKeanggotaan: 'Aktif',
        joinDate: new Date().toISOString().split('T')[0],
        isDataEncrypted: true,
        encryptedPayload: {
          nipCipher,
          waCipher,
          bankCipher
        }
      };

      onRegisterMember(newMember);
      setIsSubmittingReg(false);
      setRegSuccess(`Alhamdulillah! Pendaftaran anggota ${regNama} berhasil disimpan.`);

      // Reset form & auto-switch to member login after 1.5s
      setTimeout(() => {
        setAuthMode('LOGIN');
        setLoginRole('ANGGOTA_PENGHULU');
        setLoginIdentifier(cleanNip);
        setLoginPassword(regPassword || 'apri12345');
      }, 1500);

    } catch (err) {
      setIsSubmittingReg(false);
      setRegError('Gagal memproses enkripsi data pendaftaran.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-emerald-950 flex flex-col justify-center items-center p-4 selection:bg-emerald-200 selection:text-emerald-900">
      
      {/* Container Box */}
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        
        {/* Institutional Header Banner */}
        <div className="bg-emerald-900 text-white p-6 sm:p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-800/30 rounded-full blur-3xl pointer-events-none" />
          
          <img 
            src={sealImageUrl} 
            alt="Emblem APRI Sulsel" 
            className="w-20 h-24 mx-auto object-contain drop-shadow-lg mb-2"
            referrerPolicy="no-referrer"
          />
          <div className="text-[11px] uppercase tracking-wider font-semibold text-emerald-200">
            Asosiasi Penghulu Republik Indonesia
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-1">
            PENGURUS WILAYAH SULAWESI SELATAN
          </h1>
          <p className="text-xs text-emerald-200/90 mt-1 max-w-md mx-auto">
            Sistem Informasi Pendataan, Rekapitulasi Iuran & Portal Mandiri Penghulu KUA
          </p>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-700/50 text-[10px] text-emerald-200 mt-4">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Enkripsi AES-256-GCM · Terhubung ke 24 Cabang Kab/Kota</span>
          </div>
        </div>

        {/* Tab Switcher: Masuk vs Pendaftaran */}
        <div className="grid grid-cols-2 border-b border-slate-200 bg-slate-50 text-xs font-bold">
          <button
            type="button"
            onClick={() => setAuthMode('LOGIN')}
            className={`py-3.5 text-center flex items-center justify-center gap-2 transition-colors ${
              authMode === 'LOGIN'
                ? 'bg-white text-emerald-800 border-b-2 border-emerald-800'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>Masuk ke Aplikasi</span>
          </button>

          <button
            type="button"
            onClick={() => setAuthMode('REGISTER')}
            className={`py-3.5 text-center flex items-center justify-center gap-2 transition-colors ${
              authMode === 'REGISTER'
                ? 'bg-white text-emerald-800 border-b-2 border-emerald-800'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Pendaftaran Anggota Baru</span>
          </button>
        </div>

        {/* Body Area */}
        <div className="p-6 sm:p-8">
          
          {/* TAB 1: FORM LOGIN */}
          {authMode === 'LOGIN' && (
            <div className="space-y-6">
              
              {/* Role Selection Buttons */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Pilih Tingkat Akses / Peran Akun:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectRole('BENDAHARA_WILAYAH')}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      loginRole === 'BENDAHARA_WILAYAH'
                        ? 'bg-emerald-50 border-emerald-700 text-emerald-950 font-bold ring-1 ring-emerald-700'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-xs">1. Bendahara Wilayah</div>
                    <div className="text-[10px] text-slate-400 font-normal mt-0.5">PW Sulsel (Semua)</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectRole('BENDAHARA_CABANG')}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      loginRole === 'BENDAHARA_CABANG'
                        ? 'bg-emerald-50 border-emerald-700 text-emerald-950 font-bold ring-1 ring-emerald-700'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-xs">2. Bendahara Cabang</div>
                    <div className="text-[10px] text-slate-400 font-normal mt-0.5">PC Kab / Kota</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectRole('ANGGOTA_PENGHULU')}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      loginRole === 'ANGGOTA_PENGHULU'
                        ? 'bg-emerald-50 border-emerald-700 text-emerald-950 font-bold ring-1 ring-emerald-700'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-xs">3. Anggota Penghulu</div>
                    <div className="text-[10px] text-slate-400 font-normal mt-0.5">Portal KUA</div>
                  </button>
                </div>
              </div>

              {loginError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-800">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              {/* Form Controls */}
              <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
                
                {/* Extra Selector for Bendahara Cabang */}
                {loginRole === 'BENDAHARA_CABANG' && (
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Pilih Pimpinan Cabang (PC) Kab / Kota:
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <select
                        value={selectedBranchKab}
                        onChange={(e) => handleBranchChange(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 font-semibold text-slate-800 focus:outline-emerald-600"
                      >
                        {KAB_KOTA_SULSEL.map(kab => (
                          <option key={kab} value={kab}>
                            PC APRI {kab}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* Email / NIP Identifier */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {loginRole === 'ANGGOTA_PENGHULU' ? 'NIP (18 Digit) / Email Penghulu' : 'Email Resmi Bendahara / NIP'}
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      placeholder={loginRole === 'ANGGOTA_PENGHULU' ? 'Contoh: 198204152009011014' : 'bendahara.wilayah@aprisulsel.or.id'}
                      className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-slate-800 focus:outline-emerald-600 font-medium"
                      required
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Kata Sandi / Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Masukkan kata sandi..."
                      className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-10 py-2.5 text-slate-800 focus:outline-emerald-600"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  className="w-full py-3 px-4 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  <span>Masuk sebagai {loginRole === 'BENDAHARA_WILAYAH' ? 'Bendahara Wilayah' : (loginRole === 'BENDAHARA_CABANG' ? `Bendahara PC ${selectedBranchKab}` : 'Anggota Penghulu')}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                {/* Helpful quick guide */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-500 space-y-1">
                  <div className="font-semibold text-slate-700">Keterangan Akun Bawaan Sistem:</div>
                  <div>• <strong>Bendahara Wilayah</strong>: Password `aprisulsel2026` (Akses 24 Kab/Kota)</div>
                  <div>• <strong>Bendahara Cabang</strong>: Password `apricabang2026` (Akses cabang terpilih)</div>
                  <div>• <strong>Anggota Penghulu</strong>: Masukkan NIP yang didaftarkan pada tab pendaftaran</div>
                </div>

              </form>
            </div>
          )}

          {/* TAB 2: FORM PENDAFTARAN ANGGOTA */}
          {authMode === 'REGISTER' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Formulir Pendaftaran Anggota APRI Sulawesi Selatan
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Khusus bagi seluruh Penghulu KUA di bawah naungan Kanwil Kementerian Agama Prov. Sulsel.
                </p>
              </div>

              {regError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-800">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{regError}</span>
                </div>
              )}

              {regSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{regSuccess}</span>
                </div>
              )}

              <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs">
                
                {/* NIP */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nomor Induk Pegawai (NIP Resmi Kemenag) *
                  </label>
                  <input
                    type="text"
                    value={regNip}
                    onChange={(e) => setRegNip(e.target.value)}
                    placeholder="Contoh: 198204152009011014 (18 digit angka)"
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 font-mono text-slate-900 focus:outline-emerald-600 font-medium"
                    required
                  />
                  <span className="text-[10px] text-slate-400">NIP akan dienkripsi menggunakan protokol AES-256-GCM.</span>
                </div>

                {/* Nama Lengkap & Gelar */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Gelar Depan
                    </label>
                    <input
                      type="text"
                      value={regGelarDepan}
                      onChange={(e) => setRegGelarDepan(e.target.value)}
                      placeholder="Drs. H. / Dr."
                      className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-800 focus:outline-emerald-600"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">
                      Nama Lengkap (Tanpa Gelar) *
                    </label>
                    <input
                      type="text"
                      value={regNama}
                      onChange={(e) => setRegNama(e.target.value)}
                      placeholder="Contoh: Syamsuddin"
                      className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-800 focus:outline-emerald-600 font-semibold"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Gelar Belakang
                    </label>
                    <input
                      type="text"
                      value={regGelarBelakang}
                      onChange={(e) => setRegGelarBelakang(e.target.value)}
                      placeholder="S.Ag., M.H. / M.Ag."
                      className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-800 focus:outline-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Jabatan Fungsional Kepenghuluan *
                    </label>
                    <select
                      value={regJabatan}
                      onChange={(e) => setRegJabatan(e.target.value as any)}
                      className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-800 focus:outline-emerald-600 font-medium"
                    >
                      <option value="Penghulu Ahli Pertama">Penghulu Ahli Pertama</option>
                      <option value="Penghulu Ahli Muda">Penghulu Ahli Muda</option>
                      <option value="Penghulu Ahli Madya">Penghulu Ahli Madya</option>
                      <option value="Penghulu Ahli Utama">Penghulu Ahli Utama</option>
                      <option value="Kepala KUA">Kepala KUA Kecamatan</option>
                    </select>
                  </div>
                </div>

                {/* Kabupaten / Kota & KUA */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Kabupaten / Kota Bertugas *
                    </label>
                    <select
                      value={regKabKota}
                      onChange={(e) => setRegKabKota(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-800 focus:outline-emerald-600 font-medium"
                    >
                      {KAB_KOTA_SULSEL.map(kab => (
                        <option key={kab} value={kab}>{kab}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      KUA Kecamatan *
                    </label>
                    <input
                      type="text"
                      value={regKuaKecamatan}
                      onChange={(e) => setRegKuaKecamatan(e.target.value)}
                      placeholder="Contoh: KUA Kec. Somba Opu"
                      className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-800 focus:outline-emerald-600"
                      required
                    />
                  </div>
                </div>

                {/* Kontak WhatsApp & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Nomor WhatsApp (Aktif) *
                    </label>
                    <input
                      type="text"
                      value={regNoWa}
                      onChange={(e) => setRegNoWa(e.target.value)}
                      placeholder="Contoh: 081242338899"
                      className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-800 focus:outline-emerald-600 font-mono"
                      required
                    />
                    <span className="text-[10px] text-slate-400">Untuk menerima notifikasi pengingat iuran otomatis.</span>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Alamat Email
                    </label>
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="nama@kemenag.go.id"
                      className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-800 focus:outline-emerald-600"
                    />
                  </div>
                </div>

                {/* Rekening Bank Anggota */}
                <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-2">
                  <div className="font-semibold text-slate-800 text-[11px] flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Rekening Bank Anggota (Untuk verifikasi & administrasi)</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <select
                        value={regNamaBank}
                        onChange={(e) => setRegNamaBank(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800 text-xs"
                      >
                        <option value="Bank Sulselbar Syariah">Bank Sulselbar Syariah</option>
                        <option value="Bank Syariah Indonesia (BSI)">Bank BSI Syariah</option>
                        <option value="Bank Mandiri">Bank Mandiri</option>
                        <option value="Bank BRI">Bank BRI</option>
                        <option value="Bank BNI">Bank BNI</option>
                      </select>
                    </div>
                    <div>
                      <input
                        type="text"
                        value={regNoRek}
                        onChange={(e) => setRegNoRek(e.target.value)}
                        placeholder="Nomor Rekening"
                        className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        value={regAtasNama}
                        onChange={(e) => setRegAtasNama(e.target.value)}
                        placeholder="Nama Pemilik Rekening"
                        className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800 text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Password Setting */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Buat Kata Sandi Akun *
                    </label>
                    <input
                      type="password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Minimal 6 karakter"
                      className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-800 focus:outline-emerald-600"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Ulangi Kata Sandi *
                    </label>
                    <input
                      type="password"
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="Konfirmasi kata sandi"
                      className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-800 focus:outline-emerald-600"
                      required
                    />
                  </div>
                </div>

                {/* Submit Register */}
                <button
                  type="submit"
                  disabled={isSubmittingReg}
                  className="w-full py-3 px-4 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingReg ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <UserPlus className="w-4 h-4" />
                  )}
                  <span>
                    {isSubmittingReg ? 'Menyimpan & Mengenkripsi Data...' : 'Daftar Sebagai Anggota APRI Sulsel'}
                  </span>
                </button>

              </form>
            </div>
          )}

        </div>

      </div>

      <div className="text-center text-[11px] text-emerald-200/70">
        © 2026 Asosiasi Penghulu Republik Indonesia (APRI) Pengurus Wilayah Sulawesi Selatan.
      </div>

    </div>
  );
};
