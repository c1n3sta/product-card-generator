CREATE TABLE `card_layers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cardId` int NOT NULL,
	`layerType` enum('product_image','background','text_title','text_price','text_description') NOT NULL,
	`imageUrl` text,
	`textContent` text,
	`layerData` text,
	`status` enum('pending','processing','completed','failed') DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `card_layers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `processing_jobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`jobName` varchar(255) NOT NULL,
	`totalProducts` int NOT NULL,
	`processedProducts` int DEFAULT 0,
	`failedProducts` int DEFAULT 0,
	`status` enum('pending','running','completed','failed','cancelled') DEFAULT 'pending',
	`startedAt` timestamp,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `processing_jobs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `processing_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`jobId` int NOT NULL,
	`productId` int NOT NULL,
	`step` enum('data_extraction','image_discovery','background_removal','background_generation','card_assembly') NOT NULL,
	`status` enum('pending','processing','completed','failed') DEFAULT 'pending',
	`message` text,
	`errorDetails` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `processing_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `product_cards` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`userId` int NOT NULL,
	`accentColor` varchar(7) DEFAULT '#0057B7',
	`marketingCopy` text,
	`backgroundPrompt` text,
	`cardImageUrl` text,
	`fabricJson` text,
	`status` enum('draft','processing','completed','failed') DEFAULT 'draft',
	`processingJobId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `product_cards_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`sku` varchar(255) NOT NULL,
	`name` varchar(500) NOT NULL,
	`description` text,
	`category` varchar(255),
	`price` varchar(100),
	`imageUrl` text,
	`rawData` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`)
);
