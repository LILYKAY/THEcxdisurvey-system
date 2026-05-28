CREATE TABLE `custom_questions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`surveyId` int NOT NULL,
	`questionKey` varchar(100) NOT NULL,
	`questionText` text NOT NULL,
	`questionType` enum('open_ended','multiple_choice','single_choice','checkboxes') NOT NULL,
	`options` json,
	`isRequired` boolean NOT NULL DEFAULT false,
	`sortOrder` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `custom_questions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `survey_invitations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`surveyId` int NOT NULL,
	`surveyLinkId` int NOT NULL,
	`recipientEmail` varchar(320) NOT NULL,
	`recipientName` varchar(255),
	`inviteToken` varchar(64) NOT NULL,
	`status` enum('pending','sent','opened','completed','failed') NOT NULL DEFAULT 'pending',
	`sentAt` timestamp,
	`openedAt` timestamp,
	`completedAt` timestamp,
	`surveyResponseId` int,
	`sentById` int NOT NULL,
	`personalMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `survey_invitations_id` PRIMARY KEY(`id`),
	CONSTRAINT `survey_invitations_inviteToken_unique` UNIQUE(`inviteToken`)
);
