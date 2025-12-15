# Introduction

Express + Prisma Boilerplate is a production-ready template for building scalable REST APIs with modern Node.js technologies.

## What You'll Learn

This documentation covers everything you need to build and deploy production APIs:

- **Getting Started** - Installation, configuration, and project structure
- **Core Features** - Authentication, database, caching, and background jobs
- **Production** - Deployment, monitoring, and testing

## Tech Stack

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

## Documentation Map

### For New Users

Start here to get up and running:

1. [Quick Start](/guide/quick-start) - Get running in 5 minutes
2. [Project Structure](/guide/project-structure) - Understand the codebase
3. [Configuration](/guide/configuration) - Configure your environment

### For Developers

Learn the core features:

- [Authentication](/guide/authentication) - JWT tokens, sessions, roles
- [Database](/guide/database) - Prisma models, CRUD, migrations
- [Caching](/guide/caching) - Redis caching strategies
- [Background Jobs](/guide/jobs) - Queue workers and scheduling

### For Production

Deploy with confidence:

- [Deployment](/guide/deployment) - Docker, NGINX, scaling
- [Monitoring](/guide/monitoring) - Metrics, logging, alerting
- [Testing](/guide/testing) - Unit tests, integration, CI/CD

## Quick Links

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

## Getting Help

- [GitHub Issues](https://github.com/Mkayzw/Express-prisma-Template/issues) - Bug reports and feature requests
- [GitHub Discussions](https://github.com/Mkayzw/Express-prisma-Template/discussions) - Questions and community help
