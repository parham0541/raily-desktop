CREATE TABLE `mind_records` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`check_in_date` text NOT NULL,
	`mood` integer NOT NULL,
	`cried` integer,
	`sadness` integer,
	`anger` integer,
	`anxiety` integer,
	`energy` integer,
	`sleep_quality` integer,
	`happiness` integer,
	`self_care` integer,
	`feeling_safe` integer,
	`bothering` text,
	`note` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
