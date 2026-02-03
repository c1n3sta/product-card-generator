
CREATE DATABASE IF NOT EXISTS `u3155554_product-card-generator`;
USE `u3155554_product-card-generator`;

CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(36) PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) UNIQUE NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `products` (
  `id` VARCHAR(36) PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `price` DECIMAL(10, 2),
  `image_url` TEXT,
  `user_id` VARCHAR(36),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `processing_jobs` (
  `id` VARCHAR(36) PRIMARY KEY,
  `product_id` VARCHAR(36),
  `status` ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
  `progress` INT DEFAULT 0,
  `result_data` JSON,
  `error_message` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE
);

INSERT IGNORE INTO `users` (`id`, `name`, `email`) VALUES 
('local-user', 'Local User', 'user@example.com');

CREATE INDEX idx_products_user_id ON `products`(`user_id`);
CREATE INDEX idx_processing_jobs_product_id ON `processing_jobs`(`product_id`);
CREATE INDEX idx_processing_jobs_status ON `processing_jobs`(`status`);

GRANT SELECT, INSERT, UPDATE, DELETE ON `u3155554_product-card-generator`.* TO 'u3155554_product-card-user'@'%';
FLUSH PRIVILEGES;

SELECT 'Database setup completed successfully!' AS message;
