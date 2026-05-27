"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { 
  LayoutDashboard, 
  PackagePlus, 
  PackageMinus, 
  FileText, 
  Settings, 
  LogOut, 
  TrendingUp, 
  AlertCircle, 
  DollarSign, 
  ArrowUpRight,
  Store,
  User,
  Loader2,
  Calendar,
  BarChart3
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ChartViewer from "@/components/charts/ChartViewer";

// Definisi Tipe Data
interface Transaction {
  id: string;
  created_at: string;
  total_amount: number;
  users: { full_name: string };
}

interface UserProfile {
  full_name: string;
  role: string;
}

interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: any;
}

export default function DashboardPage() {
  const pathname = usePathname();
  
  // State Management
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile>({ full_name: "Memuat...", role: "..." });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [metrics, setMetrics] = useState({
    totalSales: 0,
    transactionCount: 0,
    lowStockCount: 0
  });
  
  // Chart Data
  const [salesByDateData, setSalesByDateData] = useState<ChartDataPoint[]>([]);
  const [productCategoryData, setProductCategoryData] = useState<ChartDataPoint[]>([]);
  const [dailyTrendData, setDailyTrendData] = useState<ChartDataPoint[]>([]);
  const [operatorPerformanceData, setOperatorPerformanceData] = useState<ChartDataPoint[]>([]);

  // Fetch Data dari Supabase saat komponen dimuat
  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        // 1. Validasi Sesi
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          alert("Sesi login terputus. Mengalihkan ke halaman login...");
          window.location.href = "/login";
          return;
        }

        // 2. Ambil Profil
        const { data: profile } = await supabase
          .from("users")
          .select("full_name, role")
          .eq("id", user.id)
          .single();
            
        if (profile) setUserProfile(profile);

        // 3. Ambil Transaksi & Hitung Omzet
        const { data: trxData, error: trxError } = await supabase
          .from("transactions")
          .select("id, created_at, total_amount, users(full_name)")
          .eq("transaction_type", "sale")
          .order("created_at", { ascending: false });

        // TAMBAHAN: Tangkap error jika database gagal dibaca
        if (trxError) {
          alert("GAGAL MEMUAT TRANSAKSI: " + trxError.message);
        } else if (trxData) {
          setTransactions(trxData.slice(0, 5) as any);
          
          const totalOmzet = trxData.reduce((sum, trx) => sum + trx.total_amount, 0);
          
          // Proses data untuk chart
          processSalesData(trxData as any);
          
          const { data: lowStockData } = await supabase
            .from("products")
            .select("id")
            .lte("stock_quantity", 5);

          setMetrics({
            totalSales: totalOmzet,
            transactionCount: trxData.length,
            lowStockCount: lowStockData?.length || 0
          });
        }

      } catch (error: any) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    // Function untuk memproses transaksi data menjadi chart data
    const processSalesData = (trxData: Transaction[]) => {
      // 1. Sales by Date (Per hari)
      const salesByDate: { [key: string]: number } = {};
      
      trxData.forEach(trx => {
        const date = new Date(trx.created_at).toLocaleDateString('id-ID', { 
          month: 'short', 
          day: 'numeric' 
        });
        salesByDate[date] = (salesByDate[date] || 0) + trx.total_amount;
      });
      
      setSalesByDateData(
        Object.entries(salesByDate)
          .map(([name, value]) => ({ name, value }))
          .reverse()
          .slice(-7) // Ambil 7 hari terakhir
      );

      // 2. Daily Trend (Grafik garis trends)
      const dailyTrend = Object.entries(salesByDate)
        .map(([name, value]) => ({ name, value }))
        .reverse()
        .slice(-7);
      
      setDailyTrendData(dailyTrend);

      // 3. Operator Performance (Siapa yang paling banyak jual)
      const operatorSales: { [key: string]: number } = {};
      
      trxData.forEach(trx => {
        const operator = trx.users?.full_name || 'Unknown';
        operatorSales[operator] = (operatorSales[operator] || 0) + trx.total_amount;
      });
      
      setOperatorPerformanceData(
        Object.entries(operatorSales)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 5)
      );

      // 4. Mock data for product category (jika tidak ada di DB, kita buat sample)
      setProductCategoryData([
        { name: 'Kategori A', value: Math.floor(Math.random() * 5000000) + 1000000 },
        { name: 'Kategori B', value: Math.floor(Math.random() * 5000000) + 1000000 },
        { name: 'Kategori C', value: Math.floor(Math.random() * 5000000) + 1000000 },
        { name: 'Kategori D', value: Math.floor(Math.random() * 5000000) + 1000000 },
      ]);
    };

    fetchDashboardData();
  }, []);

  // Format Mata Uang Rupiah
  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0
    }).format(angka);
  };

  // Format Jam
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' }) + " WIB";
  };

  return (
    <div className="flex min-h-screen bg-background/50">
      
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-64 border-r border-border bg-card hidden md:flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-border text-primary gap-3">
          <Store className="w-6 h-6" />
          <span className="font-bold tracking-widest uppercase text-sm">Elegant Store</span>
        </div>
        
        <nav className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">Menu Utama</div>
          
          <Link href="/dashboard" className="block">
            <Button variant={pathname === "/dashboard" ? "secondary" : "ghost"} className="w-full justify-start gap-3">
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
            <h2 className="font-semibold text-lg">Ringkasan Sistem</h2>
            <p className="text-xs text-muted-foreground">Pembaruan data secara real-time</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium capitalize">{userProfile.full_name}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">{userProfile.role}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold uppercase">
              {userProfile.full_name.charAt(0)}
            </div>
          </div>
        </header>

        {/* DASHBOARD WIDGETS */}
        <div className="p-8 flex-1 overflow-auto space-y-8">
          
          {/* Top Row: Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="shadow-sm border-border/60">
              <CardContent className="p-6">
                <div className="flex items-center justify-between space-y-0 pb-2">
                  <p className="text-sm font-medium text-muted-foreground">Total Penjualan</p>
                  <DollarSign className="w-4 h-4 text-primary" />
                </div>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-2xl font-bold">{formatRupiah(metrics.totalSales)}</h3>
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  Menunggu transaksi pertama...
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-border/60">
              <CardContent className="p-6">
                <div className="flex items-center justify-between space-y-0 pb-2">
                  <p className="text-sm font-medium text-muted-foreground">Jumlah Transaksi</p>
                  <PackageMinus className="w-4 h-4 text-primary" />
                </div>
                <h3 className="text-2xl font-bold">{metrics.transactionCount}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Transaksi berhasil hari ini
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-border/60">
              <CardContent className="p-6">
                <div className="flex items-center justify-between space-y-0 pb-2">
                  <p className="text-sm font-medium text-muted-foreground">Peringatan Stok</p>
                  <AlertCircle className="w-4 h-4 text-destructive" />
                </div>
                <h3 className={`text-2xl font-bold ${metrics.lowStockCount > 0 ? 'text-destructive' : 'text-emerald-500'}`}>
                  {metrics.lowStockCount} Item
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Mendekati batas minimum
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-border/60">
              <CardContent className="p-6">
                <div className="flex items-center justify-between space-y-0 pb-2">
                  <p className="text-sm font-medium text-muted-foreground">Status Sistem</p>
                  <TrendingUp className="w-4 h-4 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-emerald-500">Online</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Terhubung ke Database
                </p>
              </CardContent>
            </Card>
          </div>

        {/* Middle Row: Charts & Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sales Trend Chart */}
            {dailyTrendData.length > 0 && (
              <ChartViewer
                title="📈 Trend Penjualan Harian"
                description="7 hari terakhir"
                data={dailyTrendData}
                dataKey="value"
                xAxisDataKey="name"
                color="#3b82f6"
              />
            )}

            {/* Operator Performance Chart */}
            {operatorPerformanceData.length > 0 && (
              <ChartViewer
                title="👥 Performa Operator"
                description="Total penjualan per kasir"
                data={operatorPerformanceData}
                dataKey="value"
                xAxisDataKey="name"
                color="#10b981"
              />
            )}

            {/* Product Category Chart */}
            {productCategoryData.length > 0 && (
              <ChartViewer
                title="📦 Penjualan per Kategori"
                description="Distribusi penjualan"
                data={productCategoryData}
                dataKey="value"
                xAxisDataKey="name"
                color="#f59e0b"
              />
            )}

            {/* Daily Sales Chart */}
            {salesByDateData.length > 0 && (
              <ChartViewer
                title="💰 Total Penjualan Per Hari"
                description="7 hari terakhir"
                data={salesByDateData}
                dataKey="value"
                xAxisDataKey="name"
                color="#8b5cf6"
              />
            )}
          </div>

          {/* Recent Transactions Table */}
          <Card className="shadow-sm border-border/60 flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border/40 pb-4 shrink-0">
              <div>
                <CardTitle className="text-lg">Transaksi Terakhir</CardTitle>
                <CardDescription>Riwayat barang keluar yang diproses oleh kasir.</CardDescription>
              </div>
              <Link href="/barangkeluar">
                <Button variant="outline" size="sm" className="gap-2">
                  Lihat Semua <ArrowUpRight className="w-4 h-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-0 flex-1">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center p-12 text-muted-foreground">
                  <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
                  <p>Memuat data transaksi...</p>
                </div>
              ) : transactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-muted-foreground text-center">
                  <PackageMinus className="w-12 h-12 mb-4 opacity-20" />
                  <p className="font-medium text-foreground">Belum ada transaksi</p>
                  <p className="text-sm">Data akan muncul di sini setelah kasir memproses barang keluar.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground bg-muted/50 uppercase border-b border-border/40">
                      <tr>
                        <th className="px-6 py-4 font-medium">ID Ref</th>
                        <th className="px-6 py-4 font-medium">Waktu</th>
                        <th className="px-6 py-4 font-medium">Operator (Kasir)</th>
                        <th className="px-6 py-4 font-medium text-right">Total Nominal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {transactions.map((trx) => (
                        <tr key={trx.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-6 py-4 font-medium text-xs uppercase">{trx.id.split('-')[0]}...</td>
                          <td className="px-6 py-4 text-muted-foreground">{formatTime(trx.created_at)}</td>
                          <td className="px-6 py-4 capitalize">{trx.users?.full_name || 'Unknown'}</td>
                          <td className="px-6 py-4 text-right font-medium">{formatRupiah(trx.total_amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </main>
    </div>
  );
}