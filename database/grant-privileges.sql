-- Grant all privileges on stocktrading database to stocktrader_user
GRANT ALL PRIVILEGES ON stocktrading.* TO 'stocktrader_user'@'%';
FLUSH PRIVILEGES;
