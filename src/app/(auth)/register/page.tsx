"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const fromGoogle = searchParams.get("from") === "google";
  const prefillEmail = searchParams.get("email") ?? "";
  const prefillName = searchParams.get("name") ?? "";

  const [name, setName] = useState(prefillName);
  const [email, setEmail] = useState(prefillEmail);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setName(prefillName);
    setEmail(prefillEmail);
  }, [prefillName, prefillEmail]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Gagal mendaftar, coba lagi");
      setLoading(false);
      return;
    }

    const loginRes = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (loginRes?.error) {
      router.push("/login");
    } else {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Buat Akun</h1>
        <p className="text-sm text-muted-foreground">
          {fromGoogle
            ? "Set password untuk menyelesaikan pendaftaran"
            : "Daftar untuk mulai melacak aset kamu"}
        </p>
      </div>

      {fromGoogle && (
        <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-md px-3.5 py-2.5">
          <svg width="16" height="16" viewBox="0 0 24 24" className="shrink-0">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <p className="text-sm text-blue-700">Mendaftar via Google</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nama</Label>
          <Input
            id="name"
            type="text"
            placeholder="Nama kamu"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="kamu@email.com"
            value={email}
            onChange={(e) => !fromGoogle && setEmail(e.target.value)}
            readOnly={fromGoogle}
            required
            autoComplete="email"
            className={fromGoogle ? "bg-muted text-muted-foreground cursor-not-allowed" : ""}
          />
          {fromGoogle && (
            <p className="text-xs text-muted-foreground">Email dikunci ke akun Google kamu</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">
            Password
            {fromGoogle && (
              <span className="text-muted-foreground font-normal ml-1 text-xs">
                (untuk aktifkan login email juga)
              </span>
            )}
          </Label>
          <Input
            id="password"
            type="password"
            placeholder="Minimal 8 karakter"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            minLength={8}
          />
        </div>

        {error && (
          <p className="text-sm text-red-500 text-center">{error}</p>
        )}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Memproses..." : "Daftar"}
        </Button>
      </form>

      {!fromGoogle && (
        <p className="text-center text-sm text-muted-foreground">
          Sudah punya akun?{" "}
          <Link href="/login" className="font-medium underline underline-offset-4 hover:text-primary">
            Masuk
          </Link>
        </p>
      )}
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
