# 💖 Pairly

```text
  ____       _       _       
 |  _ \ __ _(_)_ __ | |_   _ 
 | |_) / _` | | '__|| | | | |
 |  __/ (_| | | |   | | |_| |
 |_|   \__,_|_|_|   |_|\__, |
                       |___/ 
```

## *Make moments together.*

A modern, intimate, and private realtime space designed for two people to create, play, and cherish moments together — crafted especially for couples and long-distance relationships.

[![Next.js](https://img.shields.io/badge/Next.js-16.3.4-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Realtime-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Turborepo](https://img.shields.io/badge/Turborepo-Monorepo-EF4444?style=for-the-badge&logo=turborepo&logoColor=white)](https://turbo.build/)
[![pnpm](https://img.shields.io/badge/pnpm-10.33+-F69220?style=for-the-badge&logo=pnpm&logoColor=white)](https://pnpm.io/)

---

## ✨ Features & Vision

- 🌸 **Modern Romantic Visual Direction** — Clean white-dominant UI, soft rose and pink accents (`#F43F5E`, `#FB7185`), subtle glowing shadows, and rounded cards.
- ⚡ **Realtime Architecture** — Ephemeral states, live presence indicators, synchronous canvas collaboration, and instant room updates powered by Supabase Realtime Channels.
- 🔒 **End-to-End Privacy** — Strict Row-Level Security (RLS) policies ensuring that only two connected partners have access to their shared memories, room data, and canvas snapshots.
- 🧩 **Modular Monorepo Structure** — Scalable codebase built with Turborepo and pnpm workspaces, isolating core domain logic, UI tokens, database layers, and validation schemas.

---

## 🏗️ Monorepo Architecture

```text
pairly/
├── apps/
│   └── web/                   # Next.js 16 (App Router + Turbopack + Tailwind + shadcn/ui)
├── packages/
│   ├── database/              # Supabase SSR client instance, connection utilities & DB types
│   ├── types/                 # Shared TypeScript domain contracts & realtime event types
│   ├── ui/                    # Reusable UI component library (shadcn/ui based)
│   ├── utils/                 # Shared helper functions (cn, room code generator, formatters)
│   ├── validation/            # Runtime Zod validation schemas (rooms, auth, profiles)
│   └── config/                # Shared TypeScript and compiler configurations
├── supabase/
│   └── migrations/            # Version-controlled PostgreSQL migrations & RLS policies
├── pnpm-workspace.yaml         # Monorepo package registry
├── turbo.json                 # Turborepo task pipeline configuration
└── package.json               # Root scripts and engine requirements
```

---

## 🚀 Getting Started / Cara Instalasi

Ikuti langkah-langkah di bawah ini untuk menginstal dan menjalankan Pairly di environment lokal Anda:

### 1. Prasyarat Sistem

Pastikan tool berikut sudah terinstal di komputer Anda:

- **Node.js**: `v18.18.0` atau yang lebih baru (disarankan **Node.js v22 LTS**)
- **pnpm**: `v9.0.0` atau yang lebih baru (disarankan **pnpm v10+**)
- **Git**

Jika belum memiliki `pnpm`, instal melalui corepack atau npm:

```bash
npm install -g pnpm
```

### 2. Clone Repository

```bash
git clone https://github.com/vexalyn-dev/Pairly.git
cd Pairly
```

### 3. Instalasi Dependencies

Jalankan perintah `pnpm install` di root repository. `pnpm` secara otomatis akan mengunduh dependencies untuk seluruh aplikasi dan shared packages:

```bash
pnpm install
```

> ⚠️ **Catatan Ukuran:** Folder `node_modules/`, `.next/`, dan `.turbo/` otomatis diabaikan oleh `.gitignore` sehingga repository tetap ringan dan bersih.

### 4. Konfigurasi Environment Variables

Salin template `.env.example` menjadi `.env.local`:

```bash
# Windows PowerShell
copy .env.example .env.local

# Linux / macOS / Bash
cp .env.example .env.local
```

Buka file `.env.local` dan masukkan kredensial project Supabase Anda:

```env
# Supabase Public API (Client & Server)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-publishable-anon-key

# Supabase Server-Only Secret (Bypass RLS - DO NOT EXPOSE TO BROWSER)
SUPABASE_SERVICE_ROLE_KEY=your-secret-service-role-key

# Web App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 5. Menjalankan Server Development

Jalankan server development dengan Turborepo:

```bash
pnpm dev
```

Buka browser Anda dan akses:
👉 **[http://localhost:3000](http://localhost:3000)**

### 6. Build & Quality Verification

Untuk memastikan seluruh packages dan aplikasi terkompilasi tanpa error:

```bash
# Production build
pnpm build

# Typecheck seluruh monorepo
pnpm typecheck

# Linting
pnpm lint
```

---

## 🛠️ Tech Stack Overview

| Category | Technology |
| :--- | :--- |
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router, Turbopack) |
| **Core UI** | [React 19](https://react.dev/), [Tailwind CSS](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/) |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **Database & Auth** | [Supabase](https://supabase.com/) (PostgreSQL, Realtime, Auth, Storage) |
| **Validation** | [Zod](https://zod.dev/) |
| **Monorepo Engine** | [Turborepo](https://turbo.build/) & [pnpm Workspaces](https://pnpm.io/workspaces) |
| **Formatting** | [Prettier](https://prettier.io/) |

---

## 👥 Developers & Core Team

Pairly dikembangkan dan dirancang oleh:

| Developer | Role |
| :--- | :--- |
| **[Vexalyn Dev](https://github.com/vexalyn-dev)** | Lead Full-Stack Engineer & Core Architect |
| **Raffa** | Co-Developer & Full-Stack Engineer |

---

## 🔒 Copyright & Proprietary Notice

**Copyright © 2026 Vexalyn Dev & Raffa. All Rights Reserved.**

> **PROPRIETARY & CONFIDENTIAL**  
> Proyek ini **BUKAN** proyek open source dan **TIDAK** dilisensikan di bawah lisensi publik (seperti MIT, Apache, GPL, dll).  
> Seluruh kode sumber, aset desain, branding, nama, dan arsitektur adalah milik eksklusif **Vexalyn Dev** dan **Raffa**. Penggandaan, distribusi, publikasi, atau penggunaan tanpa izin tertulis dari pemilik hak cipta dilarang keras.
