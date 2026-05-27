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
  User,
  Store, 
  Download, 
  Calendar, 
  Loader2, 
  TrendingUp, 
  DollarSign,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ChartViewer from "@/components/charts/ChartViewer";

interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: any;
}

export default function LaporanPage() {
  const pathname = usePathname();

  // State Management
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState({ full_name: "Memuat...", role: "..." });
  
  // Chart Data
  const [monthlySalesData, setMonthlySalesData] = useState<ChartDataPoint[]>([]);
  const [productPerformanceData, setProductPerformanceData] = useState<ChartDataPoint[]>([]);
  const [inventoryStatusData, setInventoryStatusData] = useState<ChartDataPoint[]>([]);
  const [salesTypeData, setSalesTypeData] = useState<ChartDataPoint[]>([]);
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    totalTransactions: 0,
    avgTransactionValue: 0,
    totalProducts: 0,
    lowStockItems: 0,
  });

  // Fetch Data
  useEffect(() => {
    const fetchReportData = async () => {
      setIsLoading(true);
      try {
        // Validasi Sesi
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          window.location.href = "/login";
          return;
        }

        // Ambil Profil
        const { data: profile } = await supabase
          .from("users")
          .select("full_name, role")
          .eq("id", user.id)
          .single();
            
        if (profile) setUserProfile(profile);

        // Ambil Semua Transaksi
        const { data: allTransactions } = await supabase
          .from("transactions")
          .select("id, created_at, total_amount, transaction_type")
          .order("created_at", { ascending: false });

        if (allTransactions) {
          processReportData(allTransactions as any);
        }

        // Ambil data produk
        const { data: productsData } = await supabase
          .from("products")
          .select("id, name, stock_quantity, price")
          .order("stock_quantity", { ascending: true });

        if (productsData) {
          // Inventory Status
          const inventoryMap: { [key: string]: number } = {
            "Aman": 0,
            "Rawan": 0,
            "Kritis": 0,
          };

          productsData.forEach((product: any) => {
            if (product.stock_quantity > 20) inventoryMap["Aman"]++;
            else if (product.stock_quantity > 5) inventoryMap["Rawan"]++;
            else inventoryMap["Kritis"]++;
          });

          setInventoryStatusData(
            Object.entries(inventoryMap).map(([name, value]) => ({ name, value }))
          );

          // Product Performance
          setProductPerformanceData(
            productsData.slice(0, 5).map((p: any) => ({
              name: p.name?.substring(0, 15) || "Product",
              value: p.price,
            }))
          );

          setMetrics(prev => ({
            ...prev,
            totalProducts: productsData.length,
            lowStockItems: productsData.filter((p: any) => p.stock_quantity <= 5).length,
          }));
        }

      } catch (error: any) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    // Process transaction data
    const processReportData = (transactions: any[]) => {
      const totalRevenue = transactions.reduce((sum, t) => sum + t.total_amount, 0);
      const totalTransactions = transactions.length;

      // Monthly Sales
      const monthlySales: { [key: string]: number } = {};
      
      transactions.forEach(t => {
        const monthYear = new Date(t.created_at).toLocaleDateString('id-ID', { 
          year: '2-digit',
          month: 'short'
        });
        monthlySales[monthYear] = (monthlySales[monthYear] || 0) + t.total_amount;
      });

      setMonthlySalesData(
        Object.entries(monthlySales)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => new Date(a.name).getTime() - new Date(b.name).getTime())
      );

      // Sales Type Distribution
      const typeCount: { [key: string]: number } = {};
      
      transactions.forEach(t => {
        const type = t.transaction_type === 'sale' ? 'Penjualan' : 'Pembelian';
        typeCount[type] = (typeCount[type] || 0) + t.total_amount;
      });

      setSalesTypeData(
        Object.entries(typeCount).map(([name, value]) => ({ name, value }))
      );

      setMetrics(prev => ({
        ...prev,
        totalRevenue,
        totalTransactions,
        avgTransactionValue: totalTransactions > 0 ? Math.round(totalRevenue / totalTransactions) : 0,
      }));
    };

    fetchReportData();
  }, []);

  // Format Rupiah
  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0
    }).format(angka);
  };

  return (
    <div className="flex min-h-screen bg-background/50">
      
      {/* SIDEBAR */}
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

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* HEADER */}
        <header className="h-16 border-b border-border bg-card flex items-center justify-between px-8 shrink-0">
          <div>
            <h2 className="font-semibold text-lg">Laporan & Analitik</h2>
            <p className="text-xs text-muted-foreground">Analisis mendalam performa bisnis Anda</p>
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

        {/* CONTENT */}
        <div className="p-8 flex-1 overflow-auto space-y-8">
          
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card className="shadow-sm border-border/60">
              <CardContent className="p-6">
                <div className="flex items-center justify-between space-y-0 pb-2">
                  <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                  <DollarSign className="w-4 h-4 text-primary" />
                </div>
                <h3 className="text-xl font-bold">{formatRupiah(metrics.totalRevenue)}</h3>
                <p className="text-xs text-muted-foreground mt-1">Semua transaksi</p>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-border/60">
              <CardContent className="p-6">
                <div className="flex items-center justify-between space-y-0 pb-2">
                  <p className="text-sm font-medium text-muted-foreground">Transaksi Total</p>
                  <TrendingUp className="w-4 h-4 text-blue-500" />
                </div>
                <h3 className="text-xl font-bold">{metrics.totalTransactions.toLocaleString()}</h3>
                <p className="text-xs text-muted-foreground mt-1">Semua waktu</p>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-border/60">
              <CardContent className="p-6">
                <div className="flex items-center justify-between space-y-0 pb-2">
                  <p className="text-sm font-medium text-muted-foreground">Rata-rata Transaksi</p>
                  <DollarSign className="w-4 h-4 text-green-500" />
                </div>
                <h3 className="text-xl font-bold">{formatRupiah(metrics.avgTransactionValue)}</h3>
                <p className="text-xs text-muted-foreground mt-1">Per transaksi</p>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-border/60">
              <CardContent className="p-6">
                <div className="flex items-center justify-between space-y-0 pb-2">
                  <p className="text-sm font-medium text-muted-foreground">Total Produk</p>
                  <PackagePlus className="w-4 h-4 text-amber-500" />
                </div>
                <h3 className="text-xl font-bold">{metrics.totalProducts}</h3>
                <p className="text-xs text-muted-foreground mt-1">Di katalog</p>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-border/60">
              <CardContent className="p-6">
                <div className="flex items-center justify-between space-y-0 pb-2">
                  <p className="text-sm font-medium text-muted-foreground">Stok Rendah</p>
                  <AlertCircle className="w-4 h-4 text-destructive" />
                </div>
                <h3 className={`text-xl font-bold ${metrics.lowStockItems > 0 ? 'text-destructive' : 'text-green-500'}`}>
                  {metrics.lowStockItems}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">Perlu restock</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {monthlySalesData.length > 0 && (
                <ChartViewer
                  title="📊 Penjualan Bulanan"
                  description="Trend revenue per bulan"
                  data={monthlySalesData}
                  dataKey="value"
                  xAxisDataKey="name"
                  color="#3b82f6"
                />
              )}

              {salesTypeData.length > 0 && (
                <ChartViewer
                  title="💼 Distribusi Jenis Transaksi"
                  description="Penjualan vs Pembelian"
                  data={salesTypeData}
                  dataKey="value"
                  xAxisDataKey="name"
                  color="#10b981"
                />
              )}

              {inventoryStatusData.length > 0 && (
                <ChartViewer
                  title="📦 Status Inventaris"
                  description="Distribusi stok produk"
                  data={inventoryStatusData}
                  dataKey="value"
                  xAxisDataKey="name"
                  color="#f59e0b"
                />
              )}

              {productPerformanceData.length > 0 && (
                <ChartViewer
                  title="🎯 Produk Top 5"
                  description="Produk dengan harga tertinggi"
                  data={productPerformanceData}
                  dataKey="value"
                  xAxisDataKey="name"
                  color="#8b5cf6"
                />
              )}
            </div>
          )}

          {/* Export Section */}
          <Card className="shadow-sm border-border/60 bg-blue-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-blue-900">📥 Export Data Laporan</h3>
                  <p className="text-sm text-blue-700 mt-1">Unduh laporan dalam format PDF atau Excel</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="gap-2">
                    <Download className="w-4 h-4" />
                    Export PDF
                  </Button>
                  <Button className="gap-2">
                    <Download className="w-4 h-4" />
                    Export Excel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </main>
    </div>
  );
}