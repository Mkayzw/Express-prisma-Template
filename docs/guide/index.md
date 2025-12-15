# Introduction

Express + Prisma Boilerplate is a production-ready template for building scalable REST APIs with modern Node.js technologies.

### Backend
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-5.x-000000?style=flat-square&logo=express&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-6.x-2D3748?style=flat-square&logo=prisma&logoColor=white)
![Zod](https://img.shields.io/badge/Zod-Validation-3E67B1?style=flat-square&logo=zod&logoColor=white)

### Infrastructure
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=flat-square&logo=redis&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker&logoColor=white)
![NGINX](https://img.shields.io/badge/NGINX-Proxy-009639?style=flat-square&logo=nginx&logoColor=white)

### Monitoring
![Prometheus](https://img.shields.io/badge/Prometheus-Metrics-E6522C?style=flat-square&logo=prometheus&logoColor=white)
![BullMQ](https://img.shields.io/badge/BullMQ-Jobs-FF6B6B?style=flat-square)

## Features

- **TypeScript** - Full type safety across the application
- **Prisma ORM** - Type-safe database access with PostgreSQL
- **JWT Authentication** - Access/refresh token rotation with Redis sessions
- **Redis Caching** - Built-in caching layer and response caching middleware
- **Background Jobs** - BullMQ-powered queues with worker process
- **Prometheus Metrics** - Production monitoring at `/metrics`
- **Docker Ready** - Docker Compose with PostgreSQL, Redis, NGINX

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   NGINX     │────▶│  Express    │────▶│  PostgreSQL │
│   Proxy     │     │    API      │     │   Database  │
└─────────────┘     └──────┬──────┘     └─────────────┘
                          │
                   ┌──────▼──────┐
                   │    Redis    │
                   │  (Cache +   │
                   │   Sessions) │
                   └──────┬──────┘
                          │
                   ┌──────▼──────┐
                   │   BullMQ    │
                   │   Workers   │
                   └─────────────┘
```

## Tech Stack

| Component | Technology |
|-----------|------------|
| Runtime | Node.js 18+ |
| Framework | Express 5 |
| Language | TypeScript |
| ORM | Prisma |
| Database | PostgreSQL |
| Cache | Redis (ioredis) |
| Queue | BullMQ |
| Validation | Zod |
| Metrics | prom-client |
