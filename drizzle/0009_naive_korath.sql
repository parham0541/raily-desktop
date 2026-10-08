CREATE TABLE `events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`event_date` text NOT NULL,
	`start_time` text,
	`end_time` text,
	`all_day` integer DEFAULT false NOT NULL,
	`location` text,
	`category` text DEFAULT 'general' NOT NULL,
	`reminder_minutes` integer,
	`color` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
