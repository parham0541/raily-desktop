CREATE TABLE `sleep_records` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`sleep_date` text NOT NULL,
	`bedtime` text NOT NULL,
	`wake_time` text NOT NULL,
	`duration` integer NOT NULL,
	`quality` integer DEFAULT 3 NOT NULL,
	`note` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
