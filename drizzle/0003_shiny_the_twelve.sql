ALTER TABLE `todos` ADD `due_time` text;--> statement-breakpoint
ALTER TABLE `todos` ADD `completed_at` integer;--> statement-breakpoint
ALTER TABLE `todos` ADD `status` text DEFAULT 'pending' NOT NULL;