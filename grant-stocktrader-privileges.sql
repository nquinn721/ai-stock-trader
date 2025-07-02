-- Grant all privileges to stocktrader user on stocktrading database
GRANT ALL PRIVILEGES ON stocktrading.* TO 'stocktrader'@'%';
GRANT ALL PRIVILEGES ON stocktrading.* TO 'stocktrader'@'localhost';
GRANT ALL PRIVILEGES ON stocktrading.* TO 'stocktrader';

-- Also grant some system privileges that might be needed
GRANT CREATE, DROP, ALTER, INSERT, UPDATE, DELETE, SELECT, INDEX, REFERENCES ON stocktrading.* TO 'stocktrader'@'%';
GRANT CREATE, DROP, ALTER, INSERT, UPDATE, DELETE, SELECT, INDEX, REFERENCES ON stocktrading.* TO 'stocktrader'@'localhost';  
GRANT CREATE, DROP, ALTER, INSERT, UPDATE, DELETE, SELECT, INDEX, REFERENCES ON stocktrading.* TO 'stocktrader';

FLUSH PRIVILEGES;

-- Verify privileges
SHOW GRANTS FOR 'stocktrader'@'%';
SHOW GRANTS FOR 'stocktrader';
