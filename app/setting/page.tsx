"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { 
  LayoutDashboard, PackagePlus, PackageMinus, FileText, Settings, LogOut, User,
  Store, Palette, Receipt, Bell, Moon, Sun, Save, CheckCircle2, Building, MapPin, Phone
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";

export default function SettingPage() {
  const pathname = usePathname();
  
  // State Navigasi Tab Internal
  const [activeTab, setActiveTab] = useState<"umum" | "tampilan" | "struk" | "notifikasi">("umum");
  
  // State Manajemen Status
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Deteksi Dark Mode saat halaman dimuat (SEKARANG MEMBACA MEMORI BROWSER)
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove("dark");
    }
  }, []);

  // Fungsi Toggle Tema Terang/Gelap (SEKARANG MENYIMPAN KE MEMORI)
  const toggleTheme = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setIsDarkMode(true);
    }
  };

  // Simulasi Simpan Pengaturan
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    // Di aplikasi nyata, ini akan meng-update tabel 'store_settings' di Supabase
    setTimeout(() => {
      setIsSaving(false);
      setSuccessMessage("Pengaturan sistem berhasil diperbarui.");
      setTimeout(() => setSuccessMessage(""), 3000);
    }, 1000);
  };

  return (
    <div className="flex min-h-screen bg-background/50">
      
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-64 border-r border-border bg-card hidden md:flex flex-col shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-border text-primary gap-3">
          <Store className="w-6 h-6" />
          <span className="font-bold tracking-widest uppercase text-sm">Elegant Store</span>
        </div>
        
        <nav className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">Menu Utama</div>
          <Link href="/dashboard" className="block">
            <Button variant={pathname === "/dashboard" ? "secondary" : "ghost"} className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground">
              <LayoutDashboard className="w-4 h-4" />
              Dashboard Utama
            </Button>
          </Link>
          <Link href="/barangmasuk" className="block">
            <Button variant={pathname === "/barangmasuk" ? "secondary" : "ghost"} className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground">
              <PackagePlus className="w-4 h-4" />
              Barang Masuk
            </Button>
          </Link>
          <Link href="/barangkeluar" className="block">
            <Button variant={pathname === "/barangkeluar" ? "secondary" : "ghost"} className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground">
              <PackageMinus className="w-4 h-4" />
              Barang Keluar (Kasir)
            </Button>
          </Link>
          <Link href="/laporan" className="block">
            <Button variant={pathname === "/laporan" ? "secondary" : "ghost"} className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground">
              <FileText className="w-4 h-4" />
              Laporan & Analitik
            </Button>
          </Link>

          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-6 mb-2 px-2">Sistem</div>
          <Link href="/profile" className="block">
            <Button variant={pathname === "/profile" ? "secondary" : "ghost"} className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground">
              <User className="w-4 h-4" />
              Profil Akun
            </Button>
          </Link>
          <Link href="/setting" className="block">
            <Button variant={pathname === "/setting" ? "secondary" : "ghost"} className="w-full justify-start gap-3">
              <Settings className="w-4 h-4" />
              Pengaturan
            </Button>
          </Link>
        </nav>

        <div className="p-4 border-t border-border">
          <Button 
            variant="ghost" 
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.href = "/login";
            }}
            className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <LogOut className="w-4 h-4" />
            Keluar Sistem
          </Button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* HEADER */}
        <header className="h-16 border-b border-border bg-card flex items-center justify-between px-8 shrink-0">
          <div>
            <h2 className="font-semibold text-lg">Konfigurasi Sistem</h2>
            <p className="text-xs text-muted-foreground">Kustomisasi operasional dan parameter aplikasi toko.</p>
          </div>
        </header>

        {/* NOTIFIKASI SUKSES */}
        {successMessage && (
          <div className="bg-emerald-500/10 border-b border-emerald-500/20 text-emerald-600 px-8 py-3 text-sm flex items-center gap-2 font-medium shrink-0">
            <CheckCircle2 className="w-4 h-4" />
            {successMessage}
          </div>
        )}

        {/* CONTENT SPLIT LAYOUT */}
        <div className="p-8 flex-1 overflow-auto flex flex-col md:flex-row gap-8 items-start">
          
          {/* LEFT: SETTINGS NAVIGATION MENU */}
          <Card className="w-full md:w-64 border-border/60 shadow-sm shrink-0">
            <CardContent className="p-4 space-y-1">
              <Button 
                variant={activeTab === "umum" ? "secondary" : "ghost"} 
                className="w-full justify-start gap-3"
                onClick={() => setActiveTab("umum")}
              >
                <Building className="w-4 h-4" /> Profil Bisnis
              </Button>
              <Button 
                variant={activeTab === "tampilan" ? "secondary" : "ghost"} 
                className="w-full justify-start gap-3"
                onClick={() => setActiveTab("tampilan")}
              >
                <Palette className="w-4 h-4" /> Tampilan Visual
              </Button>
              <Button 
                variant={activeTab === "struk" ? "secondary" : "ghost"} 
                className="w-full justify-start gap-3"
                onClick={() => setActiveTab("struk")}
              >
                <Receipt className="w-4 h-4" /> Format Struk & Pajak
              </Button>
              <Button 
                variant={activeTab === "notifikasi" ? "secondary" : "ghost"} 
                className="w-full justify-start gap-3"
                onClick={() => setActiveTab("notifikasi")}
              >
                <Bell className="w-4 h-4" /> Peringatan Sistem
              </Button>
            </CardContent>
          </Card>

          {/* RIGHT: SETTINGS FORM PANELS */}
          <div className="flex-1 w-full max-w-3xl">
            <form onSubmit={handleSaveSettings}>
              
              {/* PANEL 1: UMUM (PROFIL BISNIS) */}
              {activeTab === "umum" && (
                <Card className="border-border/60 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <CardHeader className="border-b border-border/40 pb-4">
                    <CardTitle className="text-lg">Profil Identitas Bisnis</CardTitle>
                    <CardDescription>Informasi ini akan tercetak di laporan resmi dan bukti transaksi.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5 p-6">
                    <div className="space-y-2">
                      <Label>Nama Usaha / Toko</Label>
                      <div className="relative">
                        <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input defaultValue="Elegant Store Jakarta" className="pl-9 bg-background/50" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Alamat Lengkap Outlet</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                        <textarea 
                          className="flex min-h-[80px] w-full rounded-md border border-input bg-background/50 px-3 py-2 pl-9 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          defaultValue="Jl. Sudirman No. 45, Kebayoran Baru, Jakarta Selatan, 12190"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Nomor Kontak / WhatsApp</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input defaultValue="0812-3456-7890" className="pl-9 bg-background/50" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* PANEL 2: TAMPILAN VISUAL */}
              {activeTab === "tampilan" && (
                <Card className="border-border/60 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <CardHeader className="border-b border-border/40 pb-4">
                    <CardTitle className="text-lg">Preferensi Antarmuka</CardTitle>
                    <CardDescription>Sesuaikan estetika aplikasi untuk kenyamanan mata selama shift kerja.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6 p-6">
                    <div className="flex items-center justify-between p-4 border border-border/60 rounded-lg bg-background/30">
                      <div className="space-y-0.5">
                        <Label className="text-base font-semibold">Mode Gelap (Dark Mode)</Label>
                        <p className="text-sm text-muted-foreground">Ubah skema warna menjadi gelap elegan untuk mengurangi silau.</p>
                      </div>
                      
                      {/* Custom Toggle Switch */}
                      <button 
                        type="button"
                        onClick={toggleTheme}
                        className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${isDarkMode ? 'bg-primary' : 'bg-input'}`}
                      >
                        <span className={`pointer-events-none flex items-center justify-center h-6 w-6 transform rounded-full bg-background shadow-lg ring-0 transition duration-200 ease-in-out ${isDarkMode ? 'translate-x-5' : 'translate-x-0'}`}>
                          {isDarkMode ? <Moon className="w-3.5 h-3.5 text-primary" /> : <Sun className="w-3.5 h-3.5 text-muted-foreground" />}
                        </span>
                      </button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* PANEL 3: STRUK & PAJAK */}
              {activeTab === "struk" && (
                <Card className="border-border/60 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <CardHeader className="border-b border-border/40 pb-4">
                    <CardTitle className="text-lg">Konfigurasi Kasir & Bukti Pembayaran</CardTitle>
                    <CardDescription>Atur regulasi perpajakan dan detail mesin pencetak termal.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5 p-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label>Pajak Pertambahan Nilai (PPN) %</Label>
                        <Input type="number" defaultValue="11" className="bg-background/50" />
                        <p className="text-xs text-muted-foreground">Standar regulasi pemerintah saat ini.</p>
                      </div>
                      <div className="space-y-2">
                        <Label>Ukuran Kertas Printer Termal</Label>
                        <select className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                          <option value="58mm">58mm (Printer Kasir Mini)</option>
                          <option value="80mm">80mm (Printer Standar Toko)</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-2 pt-2">
                      <Label>Pesan Catatan Kaki (Footer Struk)</Label>
                      <Input defaultValue="Terima kasih telah berbelanja di Elegant Store. Barang yang sudah dibeli tidak dapat ditukar." className="bg-background/50" />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* PANEL 4: NOTIFIKASI */}
              {activeTab === "notifikasi" && (
                <Card className="border-border/60 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <CardHeader className="border-b border-border/40 pb-4">
                    <CardTitle className="text-lg">Peringatan & Otomasi Sistem</CardTitle>
                    <CardDescription>Kendalikan bagaimana sistem memberitahu aktivitas penting toko.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 p-6">
                    <div className="flex items-center justify-between p-4 border border-border/60 rounded-lg bg-background/30">
                      <div className="space-y-0.5 pr-4">
                        <Label className="text-base font-semibold">Peringatan Stok Menipis</Label>
                        <p className="text-sm text-muted-foreground">Tampilkan indikator merah di dashboard jika sisa barang &lt;= 5 unit.</p>
                      </div>
                      <button type="button" className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent bg-primary transition-colors focus:outline-none">
                        <span className="translate-x-5 inline-block h-5 w-5 transform rounded-full bg-background shadow ring-0 transition duration-200 ease-in-out" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between p-4 border border-border/60 rounded-lg bg-background/30">
                      <div className="space-y-0.5 pr-4">
                        <Label className="text-base font-semibold">Otomasi Rekap Harian</Label>
                        <p className="text-sm text-muted-foreground">Sistem akan menyusun file laporan sementara pada pukul 23:59 setiap malam.</p>
                      </div>
                      <button type="button" className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent bg-primary transition-colors focus:outline-none">
                        <span className="translate-x-5 inline-block h-5 w-5 transform rounded-full bg-background shadow ring-0 transition duration-200 ease-in-out" />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* GLOBAL SAVE BUTTON */}
              <div className="mt-6 flex justify-end">
                <Button type="submit" disabled={isSaving} className="gap-2 shadow-sm min-w-[200px]">
                  {isSaving ? "Menerapkan Perubahan..." : "Simpan Konfigurasi"}
                </Button>
              </div>

            </form>
          </div>

        </div>
      </main>
    </div>
  );
}