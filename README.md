# 🎮 Tic-Tac-Toe Online

Онлайн-платформа для игры в крестики-нолики 1v1 с realtime обновлениями.

## 🏗️ Структура проекта

```
tic-tac-toe/
├── client/          # Next.js App Router + TailwindCSS
├── server/          # Express + Apollo GraphQL
└── docker-compose.yml
```

## 🚀 Запуск

```bash
docker-compose up
```

Это запустит:
- MongoDB на порту 27017
- Server на порту 4000
- Client на порту 3000

## 📦 Технологии

- **Client**: Next.js 14 (App Router), TypeScript, TailwindCSS, Zustand
- **Server**: Node.js, Express, Apollo GraphQL, TypeScript, MongoDB
- **Database**: MongoDB
- **Realtime**: GraphQL Subscriptions

