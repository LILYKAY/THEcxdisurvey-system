CREATE TABLE `organizations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(100) NOT NULL,
	`description` text,
	`industry` varchar(100),
	`country` varchar(100),
	`ownerId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `organizations_id` PRIMARY KEY(`id`),
	CONSTRAINT `organizations_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `respondents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`name` varchar(255),
	`email` varchar(320),
	`company` varchar(255),
	`country` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `respondents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `response_answer_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`responseAnswerId` int NOT NULL,
	`surveyResponseId` int NOT NULL,
	`questionKey` varchar(100) NOT NULL,
	`value` json,
	`version` int NOT NULL,
	`recordedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `response_answer_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `response_answers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`surveyResponseId` int NOT NULL,
	`questionKey` varchar(100) NOT NULL,
	`value` json,
	`version` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `response_answers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `survey_links` (
	`id` int AUTO_INCREMENT NOT NULL,
	`surveyId` int NOT NULL,
	`token` varchar(64) NOT NULL,
	`label` varchar(100),
	`isActive` boolean NOT NULL DEFAULT true,
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `survey_links_id` PRIMARY KEY(`id`),
	CONSTRAINT `survey_links_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `survey_responses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`surveyId` int NOT NULL,
	`surveyLinkId` int,
	`respondentId` int NOT NULL,
	`organizationId` int NOT NULL,
	`status` enum('in_progress','completed') NOT NULL DEFAULT 'in_progress',
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `survey_responses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `surveys` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`formKey` enum('current_customers','dropped_customers','repeat_trial','single_trial') NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `surveys_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','org_owner') NOT NULL DEFAULT 'user';