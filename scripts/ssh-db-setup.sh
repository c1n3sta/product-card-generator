#!/usr/bin/env bash

# SSH Database Setup Script
# Uses the SSH config from ~/.ssh/config

echo "🚀 Starting autonomous database setup via SSH..."

# Configuration
DB_USER="u3155554_product-card-user"
DB_PASSWORD="eO2aV5sJ7ftF4sP6"
DB_NAME="u3155554_product-card-generator"

# SQL Commands
SQL_COMMANDS="
CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`;
USE \`${DB_NAME}\`;

CREATE TABLE IF NOT EXISTS \`users\` (
  \`id\` VARCHAR(36) PRIMARY KEY,
  \`name\` VARCHAR(255) NOT NULL,
  \`email\` VARCHAR(255) UNIQUE NOT NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS \`products\` (
  \`id\` VARCHAR(36) PRIMARY KEY,
  \`name\` VARCHAR(255) NOT NULL,
  \`description\` TEXT,
  \`price\` DECIMAL(10, 2),
  \`image_url\` TEXT,
  \`user_id\` VARCHAR(36),
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS \`processing_jobs\` (
  \`id\` VARCHAR(36) PRIMARY KEY,
  \`product_id\` VARCHAR(36),
  \`status\` ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
  \`progress\` INT DEFAULT 0,
  \`result_data\` JSON,
  \`error_message\` TEXT,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (\`product_id\`) REFERENCES \`products\`(\`id\`) ON DELETE CASCADE
);

INSERT IGNORE INTO \`users\` (\`id\`, \`name\`, \`email\`) VALUES 
('local-user', 'Local User', 'user@example.com');

CREATE INDEX idx_products_user_id ON \`products\`(\`user_id\`);
CREATE INDEX idx_processing_jobs_product_id ON \`processing_jobs\`(\`product_id\`);
CREATE INDEX idx_processing_jobs_status ON \`processing_jobs\`(\`status\`);

GRANT SELECT, INSERT, UPDATE, DELETE ON \`${DB_NAME}\`.* TO '${DB_USER}'@'%';
FLUSH PRIVILEGES;

SELECT 'Database setup completed successfully!' AS message;
"

# Execute the database setup
echo "Executing database commands..."
echo "$SQL_COMMANDS" | ssh product-card-generator "mysql -u $DB_USER -p$DB_PASSWORD"

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Database setup completed via SSH!"
    echo "✅ Database created: $DB_NAME"
    echo "✅ Tables created: users, products, processing_jobs"
    echo "✅ Default user inserted"
    echo "✅ Permissions granted"
else
    echo "💥 Database setup failed"
    exit 1
fi