"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { 
  LayoutDashboard, PackagePlus, PackageMinus, FileText, Settings, LogOut, User,
  Plus, Search, Edit2, Trash2, Loader2, Store
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";

// Definisi Tipe Data Produk
interface Product {
  id: string;
  name: string;
  buy_price: number;
  sell_price: number;
  stock_quantity: number;
}

export default function BarangMasukPage() {
  const pathname = usePathname();
  
  // State Management
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    buy_price: "",
    sell_price: "",
    stock_quantity: "",
  });

  // Fetch Data Produk
  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (data) setProducts(data);
    } catch (error) {
      console.error("Gagal memuat produk:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Handle Submit Form Tambah Produk
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitLoading(true);

    try {
      const { error } = await supabase.from("products").insert([
        {
          name: formData.name,
          buy_price: parseFloat(formData.buy_price),
          sell_price: parseFloat(formData.sell_price),
          stock_quantity: parseInt(formData.stock_quantity),
        },
      ]);

      if (error) throw error;

      // Reset form dan tutup dialog
      setFormData({ name: "", buy_price: "", sell_price: "", stock_quantity: "" });
      setIsDialogOpen(false);
      
      // Refresh tabel
      fetchProducts();
    } catch (error) {
      console.error("Gagal menambah produk:", error);
    } finally {
      setIsSubmitLoading(false);
    }
  };

  // Format Mata Uang
  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0
    }).format(angka);
  };

  // Filter pencarian
  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-background/50">
      
      {/* SIDEBAR NAVIGATION (Sama seperti Dashboard) */}
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
            <Button variant={pathname === "/barangmasuk" ? "secondary" : "ghost"} className="w-full justify-start gap-3">
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
            <Button variant={pathname === "/setting" ? "secondary" : "ghost"} className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground">
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
            <h2 className="font-semibold text-lg">Manajemen Stok</h2>
            <p className="text-xs text-muted-foreground">Kelola daftar barang dan inventaris toko.</p>
          </div>
        </header>

        {/* CONTENT */}
        <div className="p-8 flex-1 overflow-auto">
          <Card className="border-border/60 shadow-sm flex flex-col h-full">
            
            {/* ACTION BAR (Search & Add Button) */}
            <CardHeader className="flex flex-row items-center justify-between border-b border-border/40 pb-4 shrink-0">
              <div className="relative w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Cari nama barang..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-background/50"
                />
              </div>

              {/* POP-UP FORM TAMBAH BARANG */}
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2 shadow-sm">
                    <Plus className="w-4 h-4" /> Tambah Barang Baru
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Tambah Barang Baru</DialogTitle>
                    <DialogDescription>
                      Masukkan detail produk baru ke dalam inventaris toko.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nama Barang</Label>
                      <Input id="name" required placeholder="Contoh: Kemeja Flanel M"
                        value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="buy_price">Harga Modal (Rp)</Label>
                        <Input id="buy_price" type="number" required placeholder="50000"
                          value={formData.buy_price} onChange={(e) => setFormData({ ...formData, buy_price: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="sell_price">Harga Jual (Rp)</Label>
                        <Input id="sell_price" type="number" required placeholder="75000"
                          value={formData.sell_price} onChange={(e) => setFormData({ ...formData, sell_price: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="stock">Jumlah Stok Awal</Label>
                      <Input id="stock" type="number" required placeholder="10"
                        value={formData.stock_quantity} onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                      />
                    </div>
                    <div className="pt-4 flex justify-end gap-2">
                      <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>Batal</Button>
                      <Button type="submit" disabled={isSubmitLoading}>
                        {isSubmitLoading ? "Menyimpan..." : "Simpan Produk"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>

            {/* DATA TABLE */}
            <CardContent className="p-0 flex-1 overflow-auto">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                  <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
                  <p>Memuat daftar barang...</p>
                </div>
              ) : (
                <Table>
                  <TableHeader className="bg-muted/50 sticky top-0">
                    <TableRow>
                      <TableHead className="pl-6 font-medium uppercase text-xs tracking-wider">Nama Barang</TableHead>
                      <TableHead className="font-medium uppercase text-xs tracking-wider text-right">Harga Modal</TableHead>
                      <TableHead className="font-medium uppercase text-xs tracking-wider text-right">Harga Jual</TableHead>
                      <TableHead className="font-medium uppercase text-xs tracking-wider text-center">Stok</TableHead>
                      <TableHead className="pr-6 font-medium uppercase text-xs tracking-wider text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                          Barang tidak ditemukan.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredProducts.map((product) => (
                        <TableRow key={product.id} className="hover:bg-muted/30">
                          <TableCell className="pl-6 font-medium">{product.name}</TableCell>
                          <TableCell className="text-right text-muted-foreground">{formatRupiah(product.buy_price)}</TableCell>
                          <TableCell className="text-right font-medium text-foreground">{formatRupiah(product.sell_price)}</TableCell>
                          <TableCell className="text-center">
                            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${product.stock_quantity <= 5 ? 'bg-destructive/10 text-destructive' : 'bg-emerald-500/10 text-emerald-600'}`}>
                              {product.stock_quantity}
                            </span>
                          </TableCell>
                          <TableCell className="pr-6 text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>

          </Card>
        </div>
      </main>
    </div>
  );
}