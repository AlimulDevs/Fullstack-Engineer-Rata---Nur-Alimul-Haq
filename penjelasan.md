# Penjelasan Struktur Folder Project

Healthcare Scheduling System terdiri dari dua microservice utama: **auth-service** dan **schedule-service**, ditambah file konfigurasi di root project.

---

## Root Project

```
rata/
├── docker-compose.yml
├── .gitignore
├── README.md
└── penjelasan.md  ← file ini
```

| File | Kegunaan |
|---|---|
| `docker-compose.yml` | Mendefinisikan semua container Docker: auth-service, schedule-service, dua database PostgreSQL, dan Redis. Mengatur jaringan, port, dan urutan startup antar service. |
| `.gitignore` | Daftar file/folder yang tidak di-track oleh Git, seperti `node_modules/`, file `.env`, dan folder `dist/`. |
| `README.md` | Dokumentasi lengkap project: cara menjalankan, contoh GraphQL query, environment variable, dan penjelasan fitur. |

---

## auth-service/

Service khusus yang menangani **autentikasi pengguna** (register, login, dan validasi token JWT). Berjalan di port **3001**.

### auth-service/prisma/

```
prisma/
├── schema.prisma
└── migrations/
    └── 20260303073700_init/
        └── migration.sql
```

| File/Folder | Kegunaan |
|---|---|
| `schema.prisma` | Mendefinisikan struktur database menggunakan Prisma ORM. Berisi model `User` dengan field `id`, `email`, `password`, `createdAt`, `updatedAt`. |
| `migrations/` | Folder riwayat perubahan skema database. Setiap subfolder adalah satu versi migrasi beserta SQL-nya yang dijalankan otomatis saat service pertama kali start. |

### auth-service/src/

```
src/
├── main.ts
├── app.module.ts
├── schema.gql
├── prisma/
│   ├── prisma.module.ts
│   └── prisma.service.ts
└── auth/
    ├── auth.module.ts
    ├── auth.resolver.ts
    ├── auth.service.ts
    ├── auth.service.spec.ts
    ├── dto/
    │   ├── register.input.ts
    │   └── login.input.ts
    └── models/
        ├── auth-response.model.ts
        └── user.model.ts
```

#### `main.ts`
Entry point aplikasi. Di sinilah NestJS diinisialisasi, port ditentukan (default 3001), dan server HTTP dijalankan.

#### `app.module.ts`
Modul utama yang mengumpulkan semua modul lain. Di sini dikonfigurasi:
- `ConfigModule` — untuk membaca variabel environment dari `.env`
- `GraphQLModule` — setup Apollo Server dengan `playground: true`
- `PrismaModule` dan `AuthModule`

#### `schema.gql`
File GraphQL schema yang di-generate otomatis oleh NestJS (code-first). Berisi definisi semua Query, Mutation, dan Type yang tersedia di service ini. **Jangan diedit manual** — file ini di-generate ulang setiap kali kode berubah.

---

#### auth-service/src/prisma/

| File | Kegunaan |
|---|---|
| `prisma.module.ts` | Mendaftarkan `PrismaService` sebagai provider NestJS agar bisa di-inject ke modul lain. |
| `prisma.service.ts` | Wrapper di atas `PrismaClient`. Mengurus koneksi ke database dan menutupnya saat aplikasi shutdown. |

---

#### auth-service/src/auth/

Inti dari auth-service. Berisi semua logika autentikasi.

| File | Kegunaan |
|---|---|
| `auth.module.ts` | Mendaftarkan semua provider auth (`AuthService`, `AuthResolver`) dan mengimpor `PrismaModule` serta `JwtModule`. |
| `auth.resolver.ts` | GraphQL resolver — menerima request dari client dan meneruskannya ke `AuthService`. Mendefinisikan operasi: `register`, `login`, dan `validateToken`. |
| `auth.service.ts` | Logika bisnis utama: hashing password dengan bcrypt, membuat JWT saat login, dan memverifikasi token JWT. |
| `auth.service.spec.ts` | Unit test untuk `AuthService`. Menguji register, login (happy path & error case), dan validasi token tanpa perlu koneksi database sungguhan (menggunakan mock). |

#### auth-service/src/auth/dto/

DTO (Data Transfer Object) — mendefinisikan **bentuk data yang masuk** dari client.

| File | Kegunaan |
|---|---|
| `register.input.ts` | Mendefinisikan input untuk operasi `register`: field `email` dan `password` beserta validasinya (format email, panjang minimum password). |
| `login.input.ts` | Mendefinisikan input untuk operasi `login`: field `email` dan `password`. |

#### auth-service/src/auth/models/

Model GraphQL — mendefinisikan **bentuk data yang dikembalikan** ke client.

| File | Kegunaan |
|---|---|
| `user.model.ts` | Representasi objek `User` dalam GraphQL dengan field: `id`, `email`, `createdAt`, `updatedAt`. |
| `auth-response.model.ts` | Mendefinisikan dua response type: `AuthResponse` (berisi `accessToken` + `user`) dan `ValidateTokenResponse` (berisi `isValid` + `user`). |

---

## schedule-service/

Service yang menangani **manajemen jadwal konsultasi**, dokter, dan pasien (customer). Berjalan di port **3002**. Service ini memverifikasi token ke auth-service sebelum memproses setiap request.

### schedule-service/prisma/

```
prisma/
├── schema.prisma
└── migrations/
    └── 20260303083853_init/
        └── migration.sql
```

| File/Folder | Kegunaan |
|---|---|
| `schema.prisma` | Mendefinisikan tiga model database: `Customer` (pasien), `Doctor` (dokter), dan `Schedule` (jadwal). `Schedule` memiliki relasi ke `Customer` dan `Doctor`, serta constraint unik `@@unique([doctorId, scheduledAt])` untuk mencegah konflik jadwal di level database. |
| `migrations/` | Riwayat migrasi database schedule. Dijalankan otomatis saat container schedule-service start. |

### schedule-service/src/

```
src/
├── main.ts
├── app.module.ts
├── schema.gql
├── prisma/
├── common/
├── customer/
├── doctor/
├── schedule/
└── notification/
```

#### `main.ts`
Entry point schedule-service. Menjalankan server di port 3002 dengan NestJS.

#### `app.module.ts`
Modul utama yang mengonfigurasi:
- `ConfigModule` — membaca `.env`
- `GraphQLModule` — Apollo Server dengan playground aktif
- `CacheModule` (global) — Redis cache dengan TTL 60 detik menggunakan `cache-manager-redis-yet`
- Semua feature module: `CustomerModule`, `DoctorModule`, `ScheduleModule`, `NotificationModule`

#### `schema.gql`
GraphQL schema yang di-generate otomatis dari kode. Berisi semua Query dan Mutation untuk customer, doctor, dan schedule.

---

#### schedule-service/src/prisma/

Sama seperti di auth-service — wrapper `PrismaClient` untuk database schedule.

| File | Kegunaan |
|---|---|
| `prisma.module.ts` | Mendaftarkan `PrismaService` schedule sebagai provider global. |
| `prisma.service.ts` | Koneksi ke database schedule (berbeda dari database auth). |

---

#### schedule-service/src/common/

Kumpulan utilitas yang dipakai bersama oleh semua modul di schedule-service.

```
common/
├── common.module.ts
├── decorators/
│   └── current-user.decorator.ts
├── dto/
│   └── pagination.args.ts
├── guards/
│   └── auth.guard.ts
├── interfaces/
│   └── auth-user.interface.ts
└── services/
    └── auth-client.service.ts
```

| File | Kegunaan |
|---|---|
| `common.module.ts` | Mendaftarkan semua utilitas common agar bisa digunakan module lain. |
| `decorators/current-user.decorator.ts` | Custom decorator `@CurrentUser()` untuk mengambil data user dari GraphQL context di dalam resolver. |
| `dto/pagination.args.ts` | Mendefinisikan argumen pagination yang dipakai berulang: `page` dan `limit`. |
| `guards/auth.guard.ts` | Guard yang memproteksi semua endpoint. Membaca token JWT dari header `Authorization`, mengirimkannya ke auth-service untuk divalidasi, lalu menyimpan data user ke context. |
| `interfaces/auth-user.interface.ts` | Interface TypeScript yang mendefinisikan bentuk objek `AuthUser` (hasil validasi token): `id` dan `email`. |
| `services/auth-client.service.ts` | Service yang membuat HTTP call ke auth-service (`POST /graphql`) untuk memanggil operasi `validateToken`. Digunakan oleh `AuthGuard`. |

---

#### schedule-service/src/customer/

Mengelola data **pasien/customer** (CRUD).

```
customer/
├── customer.module.ts
├── customer.resolver.ts
├── customer.service.ts
├── customer.service.spec.ts
├── dto/
│   ├── create-customer.input.ts
│   └── update-customer.input.ts
└── models/
    ├── customer.model.ts
    └── customer-paginated.model.ts
```

| File | Kegunaan |
|---|---|
| `customer.module.ts` | Mendaftarkan `CustomerService` dan `CustomerResolver`. |
| `customer.resolver.ts` | GraphQL resolver untuk operasi customer: `createCustomer`, `updateCustomer`, `customers` (list), `customer` (by ID), `deleteCustomer`. Semua endpoint dilindungi `@UseGuards(AuthGuard)`. |
| `customer.service.ts` | Logika bisnis: validasi email unik, CRUD ke database, pagination. |
| `customer.service.spec.ts` | Unit test untuk `CustomerService` — menguji create, findAll, findOne, update, delete, dan error case (email duplikat, data tidak ditemukan). |
| `dto/create-customer.input.ts` | Input untuk `createCustomer`: `name` dan `email`. |
| `dto/update-customer.input.ts` | Input untuk `updateCustomer`: `id` (wajib) + `name` dan/atau `email` (opsional). |
| `models/customer.model.ts` | GraphQL type `Customer`: `id`, `name`, `email`, `createdAt`, `updatedAt`. |
| `models/customer-paginated.model.ts` | GraphQL type `CustomerPaginatedResult`: `data` (array Customer), `total`, `page`, `limit`. |

---

#### schedule-service/src/doctor/

Mengelola data **dokter** (CRUD). Strukturnya identik dengan `customer/`.

```
doctor/
├── doctor.module.ts
├── doctor.resolver.ts
├── doctor.service.ts
├── doctor.service.spec.ts
├── dto/
│   ├── create-doctor.input.ts
│   └── update-doctor.input.ts
└── models/
    ├── doctor.model.ts
    └── doctor-paginated.model.ts
```

| File | Kegunaan |
|---|---|
| `doctor.module.ts` | Mendaftarkan `DoctorService` dan `DoctorResolver`. |
| `doctor.resolver.ts` | GraphQL resolver: `createDoctor`, `updateDoctor`, `doctors` (list), `doctor` (by ID), `deleteDoctor`. |
| `doctor.service.ts` | Logika bisnis CRUD dokter dengan pagination. |
| `doctor.service.spec.ts` | Unit test untuk `DoctorService`. |
| `dto/create-doctor.input.ts` | Input untuk `createDoctor`: `name`. |
| `dto/update-doctor.input.ts` | Input untuk `updateDoctor`: `id` + `name`. |
| `models/doctor.model.ts` | GraphQL type `Doctor`: `id`, `name`, `createdAt`, `updatedAt`. |
| `models/doctor-paginated.model.ts` | GraphQL type `DoctorPaginatedResult` dengan pagination. |

---

#### schedule-service/src/schedule/

Mengelola **jadwal konsultasi** — inti utama dari schedule-service.

```
schedule/
├── schedule.module.ts
├── schedule.resolver.ts
├── schedule.service.ts
├── schedule.service.spec.ts
├── dto/
│   ├── create-schedule.input.ts
│   └── filter-schedule.args.ts
└── models/
    ├── schedule.model.ts
    └── schedule-paginated.model.ts
```

| File | Kegunaan |
|---|---|
| `schedule.module.ts` | Mendaftarkan `ScheduleService`, `ScheduleResolver`, dan mengimpor `NotificationModule`. |
| `schedule.resolver.ts` | GraphQL resolver: `createSchedule`, `schedules` (list + filter), `schedule` (by ID), `deleteSchedule`. |
| `schedule.service.ts` | Logika bisnis terpenting: validasi customer & doctor ada, cek konflik jadwal dokter, buat jadwal, dan trigger notifikasi email via queue. Saat delete pun memicu notifikasi. |
| `schedule.service.spec.ts` | Unit test untuk `ScheduleService` — menguji create (berhasil, konflik, customer/doctor tidak ditemukan), findOne, delete, dan memastikan fungsi notifikasi dipanggil. |
| `dto/create-schedule.input.ts` | Input untuk `createSchedule`: `objective`, `customerId`, `doctorId`, `scheduledAt`. |
| `dto/filter-schedule.args.ts` | Args untuk filter list jadwal: `page`, `limit`, `customerId`, `doctorId`, `fromDate`, `toDate`. |
| `models/schedule.model.ts` | GraphQL type `Schedule`: `id`, `objective`, `scheduledAt`, relasi ke `Customer` dan `Doctor`. |
| `models/schedule-paginated.model.ts` | GraphQL type `SchedulePaginatedResult` dengan pagination. |

---

#### schedule-service/src/notification/

Menangani **pengiriman email notifikasi** menggunakan Bull queue (antrian berbasis Redis).

```
notification/
├── notification.module.ts
├── notification.service.ts
├── notification.processor.ts
├── constants/
│   └── notification.constants.ts
├── interfaces/
│   └── notification-payload.interface.ts
└── templates/
    └── email.templates.ts
```

| File | Kegunaan |
|---|---|
| `notification.module.ts` | Mengonfigurasi Bull queue (`BullModule`) dengan koneksi Redis, mendaftarkan `NotificationService` dan `NotificationProcessor`. |
| `notification.service.ts` | Menerima permintaan notifikasi dari `ScheduleService` dan meletakkan job ke dalam Bull queue. Dikonfigurasi dengan retry 3x dan exponential backoff (delay awal 2 detik). |
| `notification.processor.ts` | Worker yang memproses job dari queue. Mengambil job satu per satu, membuat email HTML dari template, lalu mengirimnya via Nodemailer. Jika SMTP belum dikonfigurasi, hanya melakukan log (tidak crash). |
| `constants/notification.constants.ts` | Mendefinisikan konstanta nama queue (`notification`) dan nama job (`schedule.created`, `schedule.deleted`) agar tidak ada typo. |
| `interfaces/notification-payload.interface.ts` | Interface `ScheduleNotificationPayload` — bentuk data yang dikirim ke queue: `customerEmail`, `customerName`, `doctorName`, `objective`, `scheduledAt`. |
| `templates/email.templates.ts` | Fungsi `buildScheduleCreatedEmail()` dan `buildScheduleDeletedEmail()` yang menghasilkan template HTML email yang rapi untuk dikirim ke pasien. |

---

## Alur Kerja Keseluruhan

```
Client
  │
  ├─► POST :3001/graphql  →  auth-service  →  PostgreSQL (port 5433)
  │         register / login / validateToken
  │
  └─► POST :3002/graphql  →  schedule-service
            (dengan header Authorization: Bearer <token>)
                │
                ├─► AuthGuard → auth-client.service → auth-service (validateToken)
                │
                ├─► CustomerResolver / DoctorResolver / ScheduleResolver
                │         │
                │         └─► Service → PostgreSQL (port 5434)
                │
                └─► ScheduleService.create() / delete()
                          │
                          └─► NotificationService → Bull Queue (Redis :6379)
                                    │
                                    └─► NotificationProcessor → Nodemailer → Email
```
