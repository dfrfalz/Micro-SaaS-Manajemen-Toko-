"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ShieldCheck, UserCircle, Store } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [loginType, setLoginType] = useState<"admin" | "kasir" | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    // Trik: Mengubah input username menjadi format email standar untuk Supabase
    // Contoh: admin_smith -> admin_smith@toko.com
    const formattedEmail = `${username.trim()}@toko.com`;

    const { data, error } = await supabase.auth.signInWithPassword({
      email: formattedEmail,
      password: password,
    });

    if (error) {
      // Menampilkan pesan error spesifik dari Supabase ke layar dan terminal
      console.error("Error Detail:", error.message);
      setErrorMessage(`Gagal: ${error.message}`);
      setIsLoading(false);
    } else {
      // Login sukses, langsung arahkan ke Dashboard
      router.push("/dashboard");
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-background transition-colors duration-300">
      <div className="absolute top-8 flex items-center gap-2 text-primary">
        <Store className="w-6 h-6" />
        <span className="font-semibold text-lg tracking-wider uppercase">Elegant Store</span>
      </div>

      <AnimatePresence mode="wait">
        {!loginType ? (
          <motion.div
            key="selection"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-md"
          >
            <Card className="border-border shadow-sm">
              <CardHeader className="text-center space-y-2">
                <CardTitle className="text-2xl font-bold tracking-tight">Selamat Datang</CardTitle>
                <CardDescription>
                  Silakan pilih akses masuk Anda untuk melanjutkan.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <Button 
                  onClick={() => { setLoginType("admin"); setErrorMessage(""); }}
                  className="h-14 text-md flex items-center justify-start gap-4 px-6 transition-transform hover:scale-[1.02]"
                >
                  <ShieldCheck className="w-5 h-5" />
                  Login sebagai Admin
                </Button>
                
                <Button 
                  variant="secondary"
                  onClick={() => { setLoginType("kasir"); setErrorMessage(""); }}
                  className="h-14 text-md flex items-center justify-start gap-4 px-6 transition-transform hover:scale-[1.02]"
                >
                  <UserCircle className="w-5 h-5" />
                  Login sebagai Kasir
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-md"
          >
            <Card className="border-border shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-primary" />
              
              <CardHeader className="space-y-2">
                <div className="flex items-center gap-3">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => {
                      setLoginType(null);
                      setUsername("");
                      setPassword("");
                      setErrorMessage("");
                    }}
                    className="h-8 w-8 rounded-full -ml-2 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                  <CardTitle className="text-2xl font-bold">
                    Login {loginType === "admin" ? "Admin" : "Kasir"}
                  </CardTitle>
                </div>
                <CardDescription>
                  Masukkan username dan password Anda.
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input 
                      id="username" 
                      type="text" 
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder={loginType === "admin" ? "admin" : "kasir"} 
                      required 
                      disabled={isLoading}
                      className="bg-background/50 focus-visible:ring-primary transition-all"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input 
                      id="password" 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••" 
                      required 
                      disabled={isLoading}
                      className="bg-background/50 focus-visible:ring-primary transition-all"
                    />
                  </div>

                  {/* Pesan Error (Muncul jika password/username salah) */}
                  {errorMessage && (
                    <div className="text-sm text-destructive font-medium bg-destructive/10 p-3 rounded-md">
                      {errorMessage}
                    </div>
                  )}
                  
                  <Button type="submit" disabled={isLoading} className="w-full h-11 text-md mt-4 shadow-sm hover:opacity-90 transition-opacity">
                    {isLoading ? "Memproses..." : "Masuk Sekarang"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}