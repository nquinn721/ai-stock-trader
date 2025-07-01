# Alternative Database Configuration Options

## Option 1: Free Cloud MySQL Services

# You can use one of these free MySQL cloud services:

# 1. PlanetScale (Free tier)

# DATABASE_HOST=your-planetscale-host

# DATABASE_PORT=3306

# DATABASE_USERNAME=your-username

# DATABASE_PASSWORD=your-password

# DATABASE_NAME=stocktrading_dev

# 2. Railway (Free tier)

# DATABASE_HOST=containers-us-west-1.railway.app

# DATABASE_PORT=6543

# DATABASE_USERNAME=postgres

# DATABASE_PASSWORD=your-password

# DATABASE_NAME=railway

# 3. Aiven (Free tier)

# DATABASE_HOST=your-aiven-host

# DATABASE_PORT=3306

# DATABASE_USERNAME=avnadmin

# DATABASE_PASSWORD=your-password

# DATABASE_NAME=defaultdb

## Option 2: Local Development with XAMPP/MySQL

# If you have MySQL installed locally:

DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USERNAME=admin
DATABASE_PASSWORD=password
DATABASE_NAME=stocktrading_dev

# Note: Use your actual MySQL credentials. Common defaults:

# - XAMPP: username=root, password="" (empty)

# - Local MySQL: username=admin, password=password

# - Some setups: username=root, password=root

## Option 3: SQLite for Development (Quick start)

# Change database type to sqlite in app.module.ts

# DATABASE_TYPE=sqlite

# DATABASE_NAME=./stocktrading.sqlite
