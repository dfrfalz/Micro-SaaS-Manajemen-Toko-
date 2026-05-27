"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { 
  LayoutDashboard, PackagePlus, PackageMinus, FileText, Settings, LogOut, User,
  Store, Mail, Shield, Save, Loader2, CheckCircle2, Camera, Image as ImageIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";

export default function ProfilePage() {
  const pathname = usePathname();

  // Referensi untuk input file tersembunyi
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // State Management
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  
  const [profileData, setProfileData] = useState({
    id: "",
    email: "",
    full_name: "",
    role: "",
    avatar_url: "",
    banner_url: "",
  });

  // State untuk file fisik & preview lokal sebelum di-upload
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [bannerPreview, setBannerPreview] = useState("");

  // Fetch Data Profil
  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) throw new Error("Gagal mengambil sesi pengguna.");

        const { data: userData, error: dbError } = await supabase
          .from("users")
          .select("full_name, role, avatar_url, banner_url")
          .eq("id", user.id)
          .single();

        if (dbError) throw dbError;

        setProfileData({
          id: user.id,
          email: user.email || "",
          full_name: userData.full_name || "",
          role: userData.role || "",
          avatar_url: userData.avatar_url || "",
          banner_url: userData.banner_url || "",
        });
        
        // Set preview awal dari database
        setAvatarPreview(userData.avatar_url || "");
        setBannerPreview(userData.banner_url || "");

      } catch (error) {
        console.error("Error memuat profil:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // Handle Pilih File (Hanya Preview Lokal)
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: "avatar" | "banner") => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const objectUrl = URL.createObjectURL(file);

    if (type === "avatar") {
      setAvatarFile(file);
      setAvatarPreview(objectUrl);
    } else {
      setBannerFile(file);
      setBannerPreview(objectUrl);
    }
  };

  // Fungsi Upload ke Supabase Storage
  const uploadImage = async (file: File, pathFolder: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${profileData.id}-${Date.now()}.${fileExt}`;
    const filePath = `${pathFolder}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("profiles")
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from("profiles").getPublicUrl(filePath);
    return data.publicUrl;
  };

  // Handle Simpan Semua Perubahan
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMessage("");

    try {
      let finalAvatarUrl = profileData.avatar_url;
      let finalBannerUrl = profileData.banner_url;

      // 1. Upload Banner dan TUNGGU sampai dapat URL-nya
      if (bannerFile) {
        finalBannerUrl = await uploadImage(bannerFile, "banners");
      }

      // 2. Upload Avatar dan TUNGGU sampai dapat URL-nya
      if (avatarFile) {
        finalAvatarUrl = await uploadImage(avatarFile, "avatars");
      }

      // 3. SEKARANG update ke database dengan URL yang sudah pasti didapat
      const { error } = await supabase
        .from("users")
        .update({ 
          full_name: profileData.full_name,
          avatar_url: finalAvatarUrl,
          banner_url: finalBannerUrl
        })
        .eq("id", profileData.id);

      if (error) throw error;

      // Update state lokal agar tampilan langsung berubah tanpa refresh
      setProfileData(prev => ({
        ...prev,
        avatar_url: finalAvatarUrl,
        banner_url: finalBannerUrl
      }));

      setSuccessMessage("Profil dan gambar berhasil disimpan permanen.");
      setTimeout(() => setSuccessMessage(""), 3000);
      
    } catch (error: any) {
      alert("Gagal menyimpan: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background/50">
      
      {/* SIDEBAR NAVIGATION (Dipersingkat agar rapi, kode aslinya sama) */}
      <aside className="w-64 border-r border-border bg-card hidden md:flex flex-col shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-border text-primary gap-3">
          <Store className="w-6 h-6" />
          <span className="font-bold tracking-widest uppercase text-sm">Elegant Store</span>
        </div>
        
        <nav className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">Menu Utama</div>
          <Link href="/dashboard"><Button variant={pathname === "/dashboard" ? "secondary" : "ghost"} className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"><LayoutDashboard className="w-4 h-4" />Dashboard Utama</Button></Link>
          <Link href="/barangmasuk"><Button variant={pathname === "/barangmasuk" ? "secondary" : "ghost"} className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"><PackagePlus className="w-4 h-4" />Barang Masuk</Button></Link>
          <Link href="/barangkeluar"><Button variant={pathname === "/barangkeluar" ? "secondary" : "ghost"} className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"><PackageMinus className="w-4 h-4" />Barang Keluar (Kasir)</Button></Link>
          <Link href="/laporan"><Button variant={pathname === "/laporan" ? "secondary" : "ghost"} className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"><FileText className="w-4 h-4" />Laporan & Analitik</Button></Link>

          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-6 mb-2 px-2">Sistem</div>
          <Link href="/profile"><Button variant={pathname === "/profile" ? "secondary" : "ghost"} className="w-full justify-start gap-3"><User className="w-4 h-4" />Profil Akun</Button></Link>
          <Link href="/setting"><Button variant={pathname === "/setting" ? "secondary" : "ghost"} className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"><Settings className="w-4 h-4" />Pengaturan</Button></Link>
        </nav>

        <div className="p-4 border-t border-border">
          <Button variant="ghost" onClick={async () => { await supabase.auth.signOut(); window.location.href = "/login"; }} className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10">
            <LogOut className="w-4 h-4" /> Keluar Sistem
          </Button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 border-b border-border bg-card flex items-center justify-between px-8 shrink-0">
          <div>
            <h2 className="font-semibold text-lg">Profil Pengguna</h2>
            <p className="text-xs text-muted-foreground">Kelola informasi pribadi dan kredensial akses.</p>
          </div>
        </header>

        {successMessage && (
          <div className="bg-emerald-500/10 border-b border-emerald-500/20 text-emerald-600 px-8 py-3 text-sm flex items-center gap-2 font-medium shrink-0">
            <CheckCircle2 className="w-4 h-4" /> {successMessage}
          </div>
        )}

        <div className="p-8 flex-1 overflow-auto flex justify-center items-start">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center mt-32 text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
              <p>Memuat data profil...</p>
            </div>
          ) : (
            <div className="w-full max-w-2xl space-y-6">
              
              <Card className="border-border/60 shadow-sm overflow-hidden">
                
                {/* AREA BANNER (YOUTUBE STYLE) */}
                <div 
                  className="h-32 w-full relative bg-muted group cursor-pointer overflow-hidden border-b border-border/40"
                  onClick={() => bannerInputRef.current?.click()}
                >
                  {bannerPreview ? (
                    <img src={bannerPreview} alt="Banner" className="w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/5" />
                  )}
                  
                  {/* Overlay Hover Banner */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white/90">
                    <ImageIcon className="w-5 h-5" />
                    <span className="text-sm font-medium tracking-wide">Ubah Banner</span>
                  </div>
                  <input type="file" ref={bannerInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileSelect(e, "banner")} />
                </div>

                <CardContent className="px-8 pb-8 pt-0 relative">
                  
                  {/* AREA FOTO PROFIL (AVATAR) */}
                  <div 
                    className="w-28 h-28 rounded-full bg-card border-4 border-card flex items-center justify-center text-primary font-bold text-4xl uppercase shadow-md absolute -top-14 left-8 group cursor-pointer z-10 overflow-hidden"
                    onClick={() => avatarInputRef.current?.click()}
                  >
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                        {profileData.full_name ? profileData.full_name.charAt(0) : <User className="w-12 h-12" />}
                      </div>
                    )}
                    
                    {/* Overlay Hover Avatar */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white/90">
                      <Camera className="w-6 h-6 mb-1" />
                    </div>
                    <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileSelect(e, "avatar")} />
                  </div>
                  
                  <div className="mt-16 flex justify-between items-start">
                    <div>
                      <h3 className="text-2xl font-bold text-foreground capitalize">{profileData.full_name || "Pengguna Baru"}</h3>
                      <p className="text-muted-foreground flex items-center gap-2 mt-1">
                        <Mail className="w-4 h-4" /> {profileData.email}
                      </p>
                    </div>
                    <div className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 border border-primary/20">
                      <Shield className="w-3 h-3" /> {profileData.role}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* FORM PENGATURAN PROFIL */}
              <Card className="border-border/60 shadow-sm">
                <form onSubmit={handleUpdateProfile}>
                  <CardContent className="space-y-6 p-6 pt-8">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Nama Lengkap</Label>
                      <Input id="fullName" value={profileData.full_name} onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })} required className="max-w-md bg-background/50" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emailAuth" className="text-muted-foreground">Email Akun (Hanya Baca)</Label>
                      <Input id="emailAuth" value={profileData.email} disabled className="max-w-md bg-muted/50 cursor-not-allowed text-muted-foreground" />
                    </div>
                  </CardContent>
                  <CardFooter className="border-t border-border/40 p-6 flex justify-end">
                    <Button type="submit" disabled={isSaving || !profileData.full_name.trim()} className="gap-2">
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      {isSaving ? "Menyimpan File..." : "Simpan Perubahan"}
                    </Button>
                  </CardFooter>
                </form>
              </Card>

            </div>
          )}
        </div>
      </main>
    </div>
  );
}