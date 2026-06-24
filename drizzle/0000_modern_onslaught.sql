CREATE TABLE `audience_contacts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`audienceId` int NOT NULL,
	`contactId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audience_contacts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `audiences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`channel` enum('email','whatsapp','sms') NOT NULL DEFAULT 'email',
	`country` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audiences_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contacts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`name` varchar(255),
	`email` varchar(320),
	`phone` varchar(30),
	`preferredChannel` enum('email','whatsapp','sms') NOT NULL DEFAULT 'email',
	`tags` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `contacts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `email_branding` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`logoUrl` text,
	`primaryColor` varchar(20) NOT NULL DEFAULT '#00BCD4',
	`secondaryColor` varchar(20) NOT NULL DEFAULT '#0097A7',
	`signatureTag` text,
	`usePlatformBranding` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `email_branding_id` PRIMARY KEY(`id`),
	CONSTRAINT `email_branding_organizationId_unique` UNIQUE(`organizationId`)
);
--> statement-breakpoint
CREATE TABLE `mfa_otp_codes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`code` varchar(10) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`usedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `mfa_otp_codes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mfa_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`mfaEnabled` boolean NOT NULL DEFAULT false,
	`mfaMethod` enum('email_otp') NOT NULL DEFAULT 'email_otp',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `mfa_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `mfa_settings_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `org_manager_invites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`email` varchar(320) NOT NULL,
	`name` varchar(255),
	`token` varchar(64) NOT NULL,
	`invitedById` int NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`acceptedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `org_manager_invites_id` PRIMARY KEY(`id`),
	CONSTRAINT `org_manager_invites_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `organizations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(100) NOT NULL,
	`description` text,
	`industry` varchar(100),
	`country` varchar(100),
	`ownerId` int NOT NULL,
	`isRestricted` boolean NOT NULL DEFAULT false,
	`restrictionReason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `organizations_id` PRIMARY KEY(`id`),
	CONSTRAINT `organizations_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `password_reset_tokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`token` varchar(64) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`usedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `password_reset_tokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `password_reset_tokens_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `respondents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`name` varchar(255),
	`email` varchar(320),
	`phone` varchar(30),
	`company` varchar(255),
	`country` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
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
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `response_answers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `survey_ai_summaries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`surveyId` int NOT NULL,
	`organizationId` int NOT NULL,
	`themes` json,
	`sentimentBreakdown` json,
	`keyPhrases` json,
	`insights` text,
	`generatedAt` timestamp NOT NULL,
	`cachedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `survey_ai_summaries_id` PRIMARY KEY(`id`),
	CONSTRAINT `survey_ai_summaries_surveyId_unique` UNIQUE(`surveyId`)
);
--> statement-breakpoint
CREATE TABLE `survey_invitations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`surveyId` int NOT NULL,
	`surveyLinkId` int,
	`audienceId` int,
	`contactId` int,
	`recipientEmail` varchar(320),
	`recipientPhone` varchar(30),
	`recipientName` varchar(255),
	`channel` enum('email','whatsapp','sms') NOT NULL DEFAULT 'email',
	`inviteToken` varchar(64) NOT NULL,
	`status` enum('pending','sent','opened','completed','failed') NOT NULL DEFAULT 'pending',
	`sentAt` timestamp,
	`openedAt` timestamp,
	`completedAt` timestamp,
	`surveyResponseId` int,
	`sentById` int NOT NULL,
	`personalMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `survey_invitations_id` PRIMARY KEY(`id`),
	CONSTRAINT `survey_invitations_inviteToken_unique` UNIQUE(`inviteToken`)
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
CREATE TABLE `survey_questions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`surveyId` int NOT NULL,
	`organizationId` int NOT NULL,
	`questionKey` varchar(100) NOT NULL,
	`questionText` text NOT NULL,
	`questionType` enum('open_ended','multiple_choice_single','multiple_choice_multi','yes_no','nps','csat','ces_5','ces_7','range_0_10','number_input','year','date','consent','end_message','nps_comment') NOT NULL,
	`options` json,
	`branchingLogic` json,
	`isRequired` boolean NOT NULL DEFAULT false,
	`maxChars` int,
	`sortOrder` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `survey_questions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `survey_responses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`surveyId` int NOT NULL,
	`organizationId` int NOT NULL,
	`respondentId` int,
	`inviteToken` varchar(64),
	`isComplete` boolean NOT NULL DEFAULT false,
	`npsScore` int,
	`csatScore` int,
	`cesScore` int,
	`sentiment` enum('promoter','passive','detractor'),
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `survey_responses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `surveys` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`closingMessage` text,
	`thankYouHeadline` varchar(255),
	`objective` varchar(100),
	`joinCode` varchar(20),
	`status` enum('draft','active','inactive') NOT NULL DEFAULT 'draft',
	`isAnonymous` boolean NOT NULL DEFAULT false,
	`expiresAt` timestamp,
	`completions` int NOT NULL DEFAULT 0,
	`lastActivityAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `surveys_id` PRIMARY KEY(`id`),
	CONSTRAINT `surveys_joinCode_unique` UNIQUE(`joinCode`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin','org_owner','org_manager') NOT NULL DEFAULT 'user',
	`managedOrgId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	`passwordHash` varchar(255),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
