CREATE TABLE IF NOT EXISTS rate_limits (
  ip_hash CHAR(64) NOT NULL,
  window_start DATETIME NOT NULL,
  hits INT UNSIGNED NOT NULL,
  PRIMARY KEY (ip_hash, window_start),
  KEY rate_limits_window_start (window_start)
) ENGINE=InnoDB DEFAULT CHARSET=ascii;
