-- CreateTable
CREATE TABLE `accounts` (
    `id` VARCHAR(255) NOT NULL,
    `token` VARCHAR(2048) NOT NULL,
    `name` VARCHAR(1024) NOT NULL,
    `status` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `feeds` (
    `id` VARCHAR(255) NOT NULL,
    `mp_name` VARCHAR(512) NOT NULL,
    `mp_cover` VARCHAR(1024) NOT NULL,
    `mp_intro` TEXT NOT NULL,
    `status` INTEGER NOT NULL DEFAULT 1,
    `sync_time` INTEGER NOT NULL DEFAULT 0,
    `update_time` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `articles` (
    `id` VARCHAR(255) NOT NULL,
    `mp_id` VARCHAR(255) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `pic_url` VARCHAR(255) NOT NULL,
    `publish_time` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
