-- Idempotent: safe to run more than once, on MySQL and MariaDB. Adds the notification state used to re-send leads that no channel delivered.
SET @em_sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE leads ADD COLUMN notified_at DATETIME NULL, ADD COLUMN notify_attempts TINYINT UNSIGNED NOT NULL DEFAULT 0, ADD KEY leads_pending_notification (notified_at, created_at)', 'DO 0') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'leads' AND COLUMN_NAME = 'notified_at');
PREPARE em_stmt FROM @em_sql;
EXECUTE em_stmt;
DEALLOCATE PREPARE em_stmt;
