# Healthcare Scheduling System

Sistem penjadwalan konsultasi klinik berbasis **microservice** menggunakan NestJS, GraphQL, PostgreSQL, dan Docker.

> **Dibuat oleh:** Nur Alimul Haq

---

## Arsitektur Sistem

```
┌─────────────────────────────────────────────────────────────────┐
│                    Client (Browser / Postman)                   │
└───────────────┬──────────────────────────┬──────────────────────┘
                │                          │
         GraphQL Request             GraphQL Request
     Authorization: Bearer <token> Authorization: Bearer <token>
                │                          │
                ▼                          ▼
  ┌─────────────────────┐      ┌───────────────────────────┐
  │    AUTH SERVICE      │◄────│     SCHEDULE SERVICE       │
  │    (Port: 3001)      │     │      (Port: 3002)          │
  │                      │     │                            │
  │  • register          │     │  • Customer CRUD           │
  │  • login             │     │  • Doctor CRUD             │
  │  • validateToken ◄───┼─────│  • Schedule CRUD           │
  │                      │     │  • Conflict detection      │
  │  JWT + bcrypt        │     │  • Email notifications     │
  └──────────┬───────────┘     │  • Redis cache & queue     │
             │                 └──────────┬────────────────┘
             ▼                            ▼
   ┌─────────────────┐          ┌──────────────────┐
   │  PostgreSQL DB   │          │  PostgreSQL DB    │
   │  (Auth – 5433)   │          │  (Schedule–5434) │
   └─────────────────┘          └──────────────────┘
                                          │
                                          ▼
                                 ┌──────────────────┐
                                 │      Redis        │
                                 │  Cache + Queue    │
                                 │   (Port: 6379)    │
                                 └──────────────────┘

Komunikasi Antar-Service:
  Client ──► Schedule Service (header: Authorization: Bearer <token>)
             Schedule Service ──► Auth Service (GraphQL validateToken)
             Auth Service ──► returns { isValid, user }
```

---

## Tech Stack

| Komponen | Teknologi |
|---|---|
| Framework | NestJS 10 |
| API | GraphQL (code-first, Apollo) |
| ORM | Prisma 5 |
| Database | PostgreSQL 15 |
| Auth | JWT + bcrypt |
| Cache | Redis + `cache-manager-redis-yet` |
| Queue | Bull (Redis-backed) |
| Email Template | Nodemailer (template siap, SMTP dikonfigurasi manual) |
| Container | Docker + Docker Compose |

---

## Struktur Project

```
healthcare-scheduling/
├── docker-compose.yml
├── .gitignore
├── README.md
│
├── auth-service/                    # Service autentikasi (Port 3001)
│   ├── Dockerfile
│   ├── .env.example
│   ├── nest-cli.json
│   ├── package.json
│   ├── tsconfig.json
│   ├── prisma/
│   │   └── schema.prisma
│   └── src/
│       ├── main.ts
│       ├── app.module.ts
│       ├── prisma/
│       │   ├── prisma.module.ts
│       │   └── prisma.service.ts
│       └── auth/
│           ├── auth.module.ts
│           ├── auth.service.ts
│           ├── auth.service.spec.ts  ← unit tests
│           ├── auth.resolver.ts
│           ├── dto/
│           │   ├── register.input.ts
│           │   └── login.input.ts
│           └── models/
│               ├── user.model.ts
│               └── auth-response.model.ts
│
└── schedule-service/                # Service jadwal (Port 3002)
    ├── Dockerfile
    ├── .env.example
    ├── nest-cli.json
    ├── package.json
    ├── tsconfig.json
    ├── prisma/
    │   └── schema.prisma
    └── src/
        ├── main.ts
        ├── app.module.ts
        ├── prisma/
        ├── common/
        │   ├── common.module.ts
        │   ├── dto/pagination.args.ts
        │   ├── guards/auth.guard.ts
        │   ├── decorators/current-user.decorator.ts
        │   ├── interfaces/auth-user.interface.ts
        │   └── services/auth-client.service.ts
        ├── customer/  (service, resolver, spec, dto, models)
        ├── doctor/    (service, resolver, spec, dto, models)
        ├── schedule/  (service, resolver, spec, dto, models)
        └── notification/
            ├── notification.module.ts
            ├── notification.service.ts
            ├── notification.processor.ts
            ├── constants/notification.constants.ts
            ├── interfaces/notification-payload.interface.ts
            └── templates/email.templates.ts  ← template HTML email
```

---

## Cara Menjalankan Project

### Prasyarat

- Docker >= 24.x dan Docker Compose >= 2.x
- Node.js >= 20.x (hanya untuk development lokal)

---

### 1. Jalankan dengan Docker (Direkomendasikan)

```bash
# Clone repository
git clone <your-repo-url>
cd healthcare-scheduling

# Build dan jalankan semua service sekaligus
docker-compose up --build

# Atau jalankan di background
docker-compose up --build -d
```

Setelah container berjalan:

| Service | URL |
|---|---|
| Auth Service GraphQL Playground | http://localhost:3001/graphql |
| Schedule Service GraphQL Playground | http://localhost:3002/graphql |

---

### 2. Jalankan secara Lokal (Development)

#### Langkah 1 – Jalankan infrastruktur via Docker

```bash
docker-compose up postgres-auth postgres-schedule redis -d
```

#### Langkah 2 – Auth Service

```bash
cd auth-service

# Install dependencies
npm install

# Salin dan sesuaikan environment
cp .env.example .env
# Edit DATABASE_URL jika perlu (port lokal: 5433)

# Generate Prisma Client
npm run db:generate

# Jalankan migrasi database
npm run db:migrate:dev -- --name init

# Start service
npm run start:dev
# Auth Service berjalan di http://localhost:3001/graphql
```

#### Langkah 3 – Schedule Service

```bash
cd schedule-service

# Install dependencies
npm install

# Salin dan sesuaikan environment
cp .env.example .env
# Edit DATABASE_URL (port 5434), AUTH_SERVICE_URL=http://localhost:3001/graphql

# Generate Prisma Client
npm run db:generate

# Jalankan migrasi database
npm run db:migrate:dev -- --name init

# Start service
npm run start:dev
# Schedule Service berjalan di http://localhost:3002/graphql
```

---

### 3. Menjalankan Unit Test

```bash
# Auth Service
cd auth-service
npm test              # run tests
npm run test:cov      # dengan code coverage report

# Schedule Service
cd schedule-service
npm test
npm run test:cov
```

---

## Environment Variables

### Auth Service (`auth-service/.env`)

| Variable | Default | Keterangan |
|---|---|---|
| `NODE_ENV` | `development` | Mode environment |
| `PORT` | `3001` | Port HTTP service |
| `DATABASE_URL` | *(lihat .env.example)* | Prisma connection string PostgreSQL |
| `JWT_SECRET` | `super_secret_...` | Secret untuk signing JWT (**ganti di production!**) |
| `JWT_EXPIRES_IN` | `7d` | Masa berlaku token |

### Schedule Service (`schedule-service/.env`)

| Variable | Default | Keterangan |
|---|---|---|
| `NODE_ENV` | `development` | Mode environment |
| `PORT` | `3002` | Port HTTP service |
| `DATABASE_URL` | *(lihat .env.example)* | Prisma connection string PostgreSQL |
| `AUTH_SERVICE_URL` | `http://localhost:3001/graphql` | URL Auth Service |
| `REDIS_HOST` | `localhost` | Host Redis |
| `REDIS_PORT` | `6379` | Port Redis |
| `MAIL_HOST` | `smtp.example.com` | SMTP host (isi untuk aktifkan email) |
| `MAIL_PORT` | `587` | SMTP port |
| `MAIL_USER` | `no-reply@example.com` | SMTP username |
| `MAIL_PASS` | `changeme` | SMTP password |
| `MAIL_FROM` | `Healthcare System <...>` | Nama & email pengirim |

> **Catatan Email:** Selama `MAIL_HOST` masih `smtp.example.com`, email hanya di-log (tidak dikirim). Isi dengan SMTP nyata (Gmail, Mailgun, SendGrid) untuk mengaktifkan pengiriman.

---

## Contoh GraphQL Queries & Mutations

### Auth Service — http://localhost:3001/graphql

#### Register User
```graphql
mutation {
  register(input: {
    email: "user@example.com"
    password: "password123"
  }) {
    accessToken
    user { id  email  createdAt }
  }
}
```

#### Login
```graphql
mutation {
  login(input: {
    email: "user@example.com"
    password: "password123"
  }) {
    accessToken
    user { id  email }
  }
}
```

#### Validate Token (digunakan antar-service)
```graphql
query {
  validateToken(token: "eyJhbGci...") {
    isValid
    user { id  email }
  }
}
```

---

### Schedule Service — http://localhost:3002/graphql

> Tambahkan header di GraphQL Playground (klik **HTTP HEADERS**):
> ```json
> { "Authorization": "Bearer <token_dari_login>" }
> ```

#### Create Customer
```graphql
mutation {
  createCustomer(input: {
    name: "Budi Santoso"
    email: "budi@example.com"
  }) {
    id  name  email  createdAt
  }
}
```

#### List Customers (Pagination)
```graphql
query {
  customers(page: 1, limit: 10) {
    data { id  name  email }
    total  page  limit
  }
}
```

#### Update Customer
```graphql
mutation {
  updateCustomer(input: {
    id: "UUID_CUSTOMER"
    name: "Budi S. Updated"
  }) {
    id  name  updatedAt
  }
}
```

#### Delete Customer
```graphql
mutation {
  deleteCustomer(id: "UUID_CUSTOMER") {
    id  name
  }
}
```

#### Create Doctor
```graphql
mutation {
  createDoctor(input: {
    name: "Dr. Siti Rahayu, Sp.PD"
  }) {
    id  name  createdAt
  }
}
```

#### List Doctors
```graphql
query {
  doctors(page: 1, limit: 10) {
    data { id  name }
    total  page  limit
  }
}
```

#### Create Schedule
```graphql
mutation {
  createSchedule(input: {
    objective: "Pemeriksaan rutin bulanan"
    customerId: "UUID_CUSTOMER"
    doctorId: "UUID_DOCTOR"
    scheduledAt: "2024-06-15T09:00:00Z"
  }) {
    id
    objective
    scheduledAt
    customer { name  email }
    doctor { name }
  }
}
```

#### List Schedules (Filter + Pagination)
```graphql
query {
  schedules(
    page: 1
    limit: 10
    doctorId: "UUID_DOCTOR"
    fromDate: "2024-06-01T00:00:00Z"
    toDate: "2024-06-30T23:59:59Z"
  ) {
    data {
      id  objective  scheduledAt
      customer { name }
      doctor { name }
    }
    total  page  limit
  }
}
```

#### Get Schedule by ID
```graphql
query {
  schedule(id: "UUID_SCHEDULE") {
    id  objective  scheduledAt
    customer { name  email }
    doctor { name }
  }
}
```

#### Delete Schedule
```graphql
mutation {
  deleteSchedule(id: "UUID_SCHEDULE") {
    id  objective  scheduledAt
  }
}
```

---

## Fitur Bonus yang Diimplementasi

| Fitur | Status | Keterangan |
|---|---|---|
| Email Notification | Template siap | Template HTML ada di `notification/templates/email.templates.ts` |
| Queue System (Bull) | Implemented | Bull + Redis, retry 3x dengan exponential backoff |
| Redis Caching | Implemented | `CacheModule` global, TTL 60 detik |
| Unit Testing | Implemented | Coverage: `AuthService`, `CustomerService`, `DoctorService`, `ScheduleService` |
| GraphQL Playground | Enabled | Tersedia di `/graphql` pada kedua service |

### Cara Mengaktifkan Email

1. Edit `schedule-service/.env`:
   ```env
   MAIL_HOST=smtp.gmail.com
   MAIL_PORT=587
   MAIL_USER=your-email@gmail.com
   MAIL_PASS=your-app-password
   MAIL_FROM="Healthcare System <your-email@gmail.com>"
   ```
2. Untuk Gmail: aktifkan **App Password** di Google Account settings
3. Restart service — email dikirim otomatis saat jadwal dibuat/dihapus

---

## Mekanisme Autentikasi Antar-Service

```
Client
  │  POST /graphql
  │  Header: Authorization: Bearer <jwt>
  ▼
Schedule Service (AuthGuard)
  │
  │  POST http://auth-service:3001/graphql
  │  Body: { validateToken(token: "...") { isValid user { id email } } }
  ▼
Auth Service
  │  1. Verify JWT signature
  │  2. Cari user di database
  │  3. Return { isValid: true, user: { id, email, ... } }
  ▼
Schedule Service
  │  Attach user ke GQL context
  ▼
Resolver / Service berjalan dengan user context
```

---

## Penanganan Konflik Jadwal

Dua lapisan proteksi mencegah jadwal dokter bertabrakan:

1. **Database** — constraint `@@unique([doctorId, scheduledAt])` di Prisma schema
2. **Aplikasi** — pengecekan eksplisit sebelum insert di `ScheduleService.create()` dengan error yang informatif

---

## Troubleshooting

| Masalah | Solusi |
|---|---|
| Container tidak start | `docker-compose logs -f <service-name>` |
| Migration gagal | `docker-compose exec <service> sh` lalu `npx prisma migrate deploy` |
| Port sudah dipakai | Ubah mapping port di `docker-compose.yml` |
| Reset semua data | `docker-compose down -v && docker-compose up --build` |

### Prisma Studio (Browse DB via GUI)
```bash
cd auth-service && npm run db:studio        # http://localhost:5555
cd schedule-service && npm run db:studio    # http://localhost:5556
```
