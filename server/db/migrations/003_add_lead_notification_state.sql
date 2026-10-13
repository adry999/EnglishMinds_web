SET @em_missing = (SELECT COUNT(*) = 0 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'leads' AND COLUMN_NAME = 'notified_at');
SET @em_sql = IF(@em_missing, 'ALTER TABLE leads ADD COLUMN notified_at DATETIME NULL, ADD COLUMN notify_attempts TINYINT UNSIGNED NOT NULL DEFAULT 0, ADD KEY leads_pending_notification (notified_at, created_at)', 'DO 0');
PREPARE em_stmt FROM @em_sql;
EXECUTE em_stmt;
DEALLOCATE PREPARE em_stmt;
SET @em_sql = IF(@em_missing, 'UPDATE leads SET notified_at = created_at WHERE notified_at IS NULL', 'DO 0');
PREPARE em_stmt FROM @em_sql;
EXECUTE em_stmt;
DEALLOCATE PREPARE em_stmt;
