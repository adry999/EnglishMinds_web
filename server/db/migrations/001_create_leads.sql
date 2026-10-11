CREATE TABLE IF NOT EXISTS leads (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  parent_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  child_age_group VARCHAR(20) NULL,
  source ENUM('home', 'landing', 'test') NOT NULL,
  test_level VARCHAR(30) NULL,
  utm_source VARCHAR(100) NULL,
  utm_medium VARCHAR(100) NULL,
  utm_campaign VARCHAR(100) NULL,
  consent_at DATETIME NOT NULL,
  policy_version VARCHAR(20) NOT NULL,
  created_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  KEY leads_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
