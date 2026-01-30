CREATE TABLE `card_layers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cardId` int NOT NULL,
	`layerType` enum('background','product_image','text_title','text_description','custom') NOT NULL,
	`layerOrder` int DEFAULT 0,
	`imageUrl` text,
	`textContent` text,
	`positionX` int DEFAULT 0,
	`positionY` int DEFAULT 0,
	`width` int,
	`height` int,
	`rotation` int DEFAULT 0,
	`opacity` decimal(3,2) DEFAULT '1.00',
	`fontFamily` varchar(100),
	`fontSize` int,
	`fontColor` varchar(20),
	`fontWeight` varchar(20),
	`textAlign` varchar(20),
	`status` enum('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `card_layers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `processing_jobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`jobName` varchar(200),
	`totalProducts` int DEFAULT 0,
	`processedProducts` int DEFAULT 0,
	`failedProducts` int DEFAULT 0,
	`status` enum('pending','running','completed','failed','cancelled') NOT NULL DEFAULT 'pending',
	`accentColor` varchar(20),
	`targetMarketplace` varchar(100),
	`errorMessage` text,
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
	`productId` int,
	`step` enum('data_extraction','image_discovery','background_removal','background_generation','card_assembly') NOT NULL,
	`status` enum('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
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
	`accentColor` varchar(20) DEFAULT '#3B82F6',
	`marketingCopy` text,
	`backgroundPrompt` text,
	`canvasData` json,
	`finalImageUrl` text,
	`status` enum('draft','processing','completed','failed') NOT NULL DEFAULT 'draft',
	`processingJobId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `product_cards_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`sku` varchar(100),
	`name` varchar(500) NOT NULL,
	`description` text,
	`category` varchar(200),
	`price` decimal(10,2),
	`originalImageUrl` text,
	`processedImageUrl` text,
	`status` enum('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`)
);
