-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "token" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" INTEGER NOT NULL DEFAULT 1,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "feeds" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mp_name" TEXT NOT NULL,
    "mp_cover" TEXT NOT NULL,
    "mp_intro" TEXT NOT NULL,
    "status" INTEGER NOT NULL DEFAULT 1,
    "sync_time" INTEGER NOT NULL DEFAULT 0,
    "update_time" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "articles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mp_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "pic_url" TEXT NOT NULL,
    "publish_time" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME DEFAULT CURRENT_TIMESTAMP
);
