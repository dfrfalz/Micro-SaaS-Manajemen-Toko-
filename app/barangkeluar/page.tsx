"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { 
  LayoutDashboard, PackagePlus, PackageMinus, FileText, Settings, LogOut, User,
  ShoppingCart, Plus, Minus, Trash2, Search, Loader2, Store, CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// Definisi Tipe Data
interface Product {
  id: string;
  name: string;
  sell_price: number;
  stock_quantity: number;
}

interface CartItem extends Product {
  quantity: number;
}

export default function BarangKeluarPage() {
  const pathname = usePathname();

  // State Management
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Fetch Data Produk yang memiliki stok > 0
  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, sell_price, stock_quantity")
        .order("name", { ascending: true });

      if (error) throw error;
      if (data) setProducts(data);
    } catch (error) {
      console.error("Gagal memuat data produk:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Tambah ke Keranjang
  const addToCart = (product: Product) => {
    const existingItem = cart.find((item) => item.id === product.id);
    
    if (existingItem) {
      if (existingItem.quantity >= product.stock_quantity) return; // Batasi sesuai stok tersedia
      setCart(
        cart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      );
    } else {
      if (product.stock_quantity <= 0) return;
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  // Kurangi Kuantitas di Keranjang
  const updateQuantity = (id: string, delta: number) => {
    const item = cart.find((i) => i.id === id);
    if (!item) return;

    const newQuantity = item.quantity + delta;
    if (newQuantity <= 0) {
      setCart(cart.filter((i) => i.id !== id));
    } else {
      // Cek batas stok maksimum
      const product = products.find((p) => p.id === id);
      if (product && newQuantity > product.stock_quantity) return;

      setCart(cart.map((i) => (i.id === id ? { ...i, quantity: newQuantity } : i)));
    }
  };

  // Hapus dari Keranjang
  const removeFromCart = (id: string) => {
    setCart(cart.filter((item) => item.id !== id));
  };

  // Handle Input Manual Kasir
  const handleQuantityInput = (id: string, value: string) => {
    const product = products.find((p) => p.id === id);
    if (!product) return;

    // Izinkan input kosong sementara (agar kasir bisa menghapus angka 1 untuk mengetik 10)
    if (value === "") {
      setCart(cart.map((i) => (i.id === id ? { ...i, quantity: 0 } : i)));
      return;
    }

    let newQuantity = parseInt(value);
    if (isNaN(newQuantity)) return;

    // Cegah angka melebihi maksimal stok di database
    if (newQuantity > product.stock_quantity) {
      newQuantity = product.stock_quantity;
    }

    setCart(cart.map((i) => (i.id === id ? { ...i, quantity: newQuantity } : i)));
  };

  // Validasi saat kursor keluar dari kotak input
  const handleQuantityBlur = (id: string) => {
    const item = cart.find((i) => i.id === id);
    // Jika kasir mengosongkan input atau mengetik 0, kembalikan ke angka 1
    if (item && item.quantity <= 0) {
      setCart(cart.map((i) => (i.id === id ? { ...i, quantity: 1 } : i)));
    }
  };

  // Hitung Total Belanja
  const totalAmount = cart.reduce((sum, item) => sum + item.sell_price * item.quantity, 0);

  // Proses Simpan Transaksi Penjualan ke Supabase
  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsProcessing(true);

    try {
      // 1. Ambil ID User aktif
      const { data: { user } } = await supabase.auth.getUser();
      
      // TAMBAHAN: Peringatan jika sesi hilang
      if (!user) {
        alert("ERROR: Sesi login terputus. Silakan Keluar Sistem dan Login ulang.");
        setIsProcessing(false);
        return;
      }

      // 2. Insert ke tabel transactions
      const { error: txError } = await supabase.from("transactions").insert([
        {
          user_id: user.id,
          total_amount: totalAmount,
          transaction_type: "sale",
        }
      ]);

      // TAMBAHAN: Peringatan jika database menolak transaksi
      if (txError) {
        alert("ERROR DATABASE: " + txError.message);
        setIsProcessing(false);
        return;
      }

      // 3. Update stok masing-masing produk
      for (const item of cart) {
        const currentProduct = products.find((p) => p.id === item.id);
        if (currentProduct) {
          const newStock = currentProduct.stock_quantity - item.quantity;
          await supabase
            .from("products")
            .update({ stock_quantity: newStock })
            .eq("id", item.id);
        }
      }

      setSuccessMessage("Transaksi berhasil diproses dan disimpan.");
      setCart([]);
      fetchProducts(); 

      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (error: any) {
      alert("SYSTEM ERROR: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Format Rupiah
  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0
    }).format(angka);
  };

  // Filter Produk Berdasarkan Pencarian Kasir
  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            <Button variant={pathname === "/barangkeluar" ? "secondary" : "ghost"} className="w-full justify-start gap-3">
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
            <h2 className="font-semibold text-lg">Transaksi Kasir (Barang Keluar)</h2>
            <p className="text-xs text-muted-foreground">Pencatatan penjualan ritel real-time.</p>
          </div>
        </header>

        {/* NOTIFIKASI SUKSES */}
        {successMessage && (
          <div className="bg-emerald-500/10 border-b border-emerald-500/20 text-emerald-600 px-8 py-3 text-sm flex items-center gap-2 font-medium shrink-0">
            <CheckCircle2 className="w-4 h-4" />
            {successMessage}
          </div>
        )}

        {/* WORKSPACE SPLIT GRID */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          
          {/* LEFT SIDE: PRODUCT SELECTOR (7 Cols) */}
          <div className="lg:col-span-7 p-8 overflow-y-auto border-r border-border/40 flex flex-col gap-6">
            <div className="relative shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Ketik nama produk atau barcode..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-card border-border/60"
              />
            </div>

            <Card className="border-border/60 shadow-sm flex-1 overflow-hidden flex flex-col">
              <CardContent className="p-0 overflow-y-auto">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center p-12 text-muted-foreground">
                    <Loader2 className="w-7 h-7 animate-spin mb-3 text-primary" />
                    <p className="text-sm">Sinkronisasi produk inventaris...</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader className="bg-muted/40 sticky top-0 z-10">
                      <TableRow>
                        <TableHead className="pl-6 text-xs uppercase font-medium">Nama Produk</TableHead>
                        <TableHead className="text-xs uppercase font-medium text-right">Harga Jual</TableHead>
                        <TableHead className="text-xs uppercase font-medium text-center">Stok Sisa</TableHead>
                        <TableHead className="pr-6 text-xs uppercase font-medium text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProducts.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-12 text-muted-foreground text-sm">
                            Katalog produk kosong atau tidak cocok.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredProducts.map((product) => (
                          <TableRow key={product.id} className="hover:bg-muted/20">
                            <TableCell className="pl-6 font-medium">{product.name}</TableCell>
                            <TableCell className="text-right font-medium">{formatRupiah(product.sell_price)}</TableCell>
                            <TableCell className="text-center">
                              <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${product.stock_quantity <= 5 ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground'}`}>
                                {product.stock_quantity}
                              </span>
                            </TableCell>
                            <TableCell className="pr-6 text-right">
                              <Button 
                                size="sm" 
                                variant={product.stock_quantity <= 0 ? "outline" : "default"}
                                disabled={product.stock_quantity <= 0}
                                onClick={() => addToCart(product)}
                                className="h-8 text-xs font-medium"
                              >
                                {product.stock_quantity <= 0 ? "Habis" : "Pilih"}
                              </Button>
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

          {/* RIGHT SIDE: CART SYSTEM (5 Cols) */}
          <div className="lg:col-span-5 p-8 bg-card/40 flex flex-col overflow-hidden">
            <Card className="border-border/60 shadow-sm flex flex-col h-full overflow-hidden bg-card">
              <CardHeader className="border-b border-border/40 pb-4 shrink-0 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-md font-bold flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4 text-primary" /> Keranjang Penjualan
                  </CardTitle>
                  <CardDescription>Daftar barang keluar saat ini.</CardDescription>
                </div>
                {cart.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={() => setCart([])} className="text-xs text-muted-foreground hover:text-destructive">
                    Clear All
                  </Button>
                )}
              </CardHeader>

              {/* CART LIST CONTAINER */}
              <CardContent className="flex-1 p-0 overflow-y-auto divide-y divide-border/40">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center p-8 text-muted-foreground text-center">
                    <ShoppingCart className="w-10 h-10 mb-3 opacity-25" />
                    <p className="text-sm font-medium">Keranjang Kasir Kosong</p>
                    <p className="text-xs max-w-[240px] mt-1">Klik tombol "Pilih" pada produk di panel kiri untuk memulai transaksi.</p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div key={item.id} className="p-4 flex items-center justify-between gap-4 hover:bg-muted/10 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{formatRupiah(item.sell_price)} / item</p>
                      </div>
                      
                      {/* QUANTITY CONTROL CONTROLLER (UPDATED) */}
                      <div className="flex items-center gap-1 border border-border/60 bg-background rounded p-1 shrink-0">
                        <Button variant="ghost" size="icon" onClick={() => updateQuantity(item.id, -1)} className="w-6 h-6 rounded-sm shrink-0">
                          <Minus className="w-3 h-3" />
                        </Button>
                        
                        <input 
                          type="number"
                          value={item.quantity === 0 ? "" : item.quantity}
                          onChange={(e) => handleQuantityInput(item.id, e.target.value)}
                          onBlur={() => handleQuantityBlur(item.id)}
                          className="w-10 h-6 text-center text-xs font-semibold bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-primary rounded p-0 m-0"
                          style={{ appearance: 'textfield', WebkitAppearance: 'none' }}
                        />

                        <Button variant="ghost" size="icon" onClick={() => updateQuantity(item.id, 1)} className="w-6 h-6 rounded-sm shrink-0">
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>

                      {/* INDIVIDUAL SUB-TOTAL */}
                      <div className="text-right w-24 shrink-0">
                        <p className="text-sm font-bold">{formatRupiah(item.sell_price * item.quantity)}</p>
                      </div>

                      <Button variant="ghost" size="icon" onClick={() => removeFromCart(item.id)} className="w-7 h-7 text-muted-foreground hover:text-destructive shrink-0">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))
                )}
              </CardContent>

              {/* TOTAL & BILL SUMMARY CHECKOUT */}
              <div className="p-6 border-t border-border/40 bg-muted/20 shrink-0 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Total Pembayaran:</span>
                  <span className="text-xl font-black text-foreground">{formatRupiah(totalAmount)}</span>
                </div>
                
                <Button 
                  onClick={handleCheckout}
                  disabled={cart.length === 0 || isProcessing}
                  className="w-full h-12 text-md font-medium shadow-sm transition-opacity"
                >
                  {isProcessing ? "Menyimpan Transaksi..." : "Selesaikan & Cetak Nota"}
                </Button>
              </div>

            </Card>
          </div>

        </div>
      </main>
    </div>
  );
}