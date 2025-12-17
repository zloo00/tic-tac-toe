# 🎮 Tic-Tac-Toe Online

Онлайн‑арена для дуэлей в крестики‑нолики 1v1 с рейтингом, лобби и realtime‑обновлениями. Игрок создает комнату, выбирает соперника и играет напрямую через GraphQL Subscriptions. Гость может наблюдать за лобби и турнирами.

## 🧱 Архитектура

```
tic-tac-toe/
├── client/          # Next.js App Router + TailwindCSS + Apollo Client + Zustand
├── server/          # Express + Apollo GraphQL + Mongoose
└── docker-compose.yml
```

- **Модели**  
  - `User`: email, username, passwordHash, rating, gamesPlayed, status, isDeleted.  
  - `Room`: code, name, status, owner, players[], activeGameId, isDeleted.  
  - `Game`: players[{userId,symbol}], board[9], turnUserId, winnerUserId, status, startedAt, endedAt.  
  - `Move`: gameId, userId, cellIndex, symbol, createdAt.  
  - `ChatMessage`: roomId, authorId, text, type, createdAt.  
  Все модели имеют строгие типы, валидации, индексы и soft-delete.
- **GraphQL API**  
  6 Query, 7 Mutation, 3 Subscription. JWT‑аутентификация, guards, централизованные ошибки. Реалтайм строится на `graphql-ws`.
- **Frontend**  
  Next.js App Router, TailwindCSS, Zustand stores (auth/game/ui), формы на `react-hook-form` + `zod`, Apollo Client (HTTP + WS).
- **DevOps**  
  Dockerfile для client/server, docker-compose с Mongo + healthchecks, `.env.example` для корня, client и server.

## 🚀 Быстрый старт (Docker)

```bash
cp .env.example .env
docker compose up --build
```

Это поднимет:
- MongoDB `mongodb://localhost:27017`
- GraphQL API `http://localhost:4000/graphql` (WS: `ws://localhost:4000/graphql`)
- Frontend `http://localhost:3000`

Healthchecks в `docker-compose.yml` гарантируют запуск по цепочке (Mongo → Server → Client).

## 🔐 Переменные окружения

| Путь            | Файл               | Переменные                                          |
|-----------------|-------------------|-----------------------------------------------------|
| корень          | `.env`            | Mongo creds (используются docker-compose)           |
| `server/`       | `.env.example`    | `MONGODB_URI`, `JWT_SECRET`, `CLIENT_URL`, …        |
| `client/`       | `.env.example`    | `NEXT_PUBLIC_GRAPHQL_URL`, `NEXT_PUBLIC_WS_URL`     |

После копирования `.env.example → .env` при необходимости обновите секреты.

## 🌱 Сидинг

```bash
cd server
npm install
npm run seed
```

Сценарий очищает коллекции и создает тестовые аккаунты:

| Email               | Пароль       | Рейтинг |
|---------------------|--------------|---------|
| alice@example.com   | password123  | 1210    |
| bob@example.com     | password123  | 1190    |
| carol@example.com   | password123  | 1250    |

Комнаты: `ALPHA1` (ожидание), `BETA2` (идет игра), `OMEGA3` (завершена).

## 🧪 Тесты и скрипты

| Скрипт             | Описание                           |
|--------------------|------------------------------------|
| `server:npm test`  | 23 Jest‑теста (unit + integration) |
| `server:npm run dev` | GraphQL API в режиме разработки  |
| `client:npm run dev` | Next.js dev server                |
| `server:npm run seed`| Заполнение Mongo тестовыми данными|

## ⚡ Как проверить realtime

1. Выполните сидинг (`npm run seed`) и запустите `docker compose up`.
2. Логиньтесь в двух браузерных вкладках:  
   - вкладка A — `alice@example.com`  
   - вкладка B — `bob@example.com`
3. Во вкладке A откройте `/lobby`, подпишитесь на комнату `BETA2` и перейдите в `/room/BETA2/game`.
4. Во вкладке B откройте ту же комнату. Делайте ходы по очереди.  
   - Поле, активный игрок и статус победы обновляются мгновенно через `gameUpdated`.
5. Вернитесь к `/lobby`: список комнат и статус игроков синхронно меняются через `roomUpdated`.
6. Откройте `/room/ALPHA1` и присоедините каролину через форму — у создателя появится второй игрок без перезагрузки.

## 📄 README TL;DR

- Цель: онлайн‑дуэли с очередностью ходов и рейтингом.
- Пользовательские роли: Игрок (создает комнаты, играет), Гость (наблюдает).
- Модели: User, Room, Game, Move, ChatMessage — все с soft-delete, связями и валидациями.
- Реалтайм: `roomUpdated`, `gameUpdated`, `messageAdded` (GraphQL Subscriptions через `graphql-ws`).
- Технологии: MERN + TypeScript + Next.js + TailwindCSS + Zustand + Apollo Client + Docker.

## 👥 Команда и вклад

| Участник  | Вклад                                                                 |
|-----------|-----------------------------------------------------------------------|
| Zhanserik | Архитектура backend, GraphQL схема и резолверы, модели/seed, Docker, тесты |
| Alua      | Next.js UI/стили, Zustand/Apollo клиент, realtime UX, README/презентация    |

## 📝 Презентация

`docs/presentation.pdf` — кратко о продукте, архитектуре, realtime‑демо и результатах тестов. (Добавьте файл перед защитой.)
