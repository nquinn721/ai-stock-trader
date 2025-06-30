# Local MySQL Setup Guide

## Quick Options for Local Development

### Option 1: Docker MySQL (Recommended for Development)

```bash
# Start a MySQL container
docker run --name stock-trading-mysql \
  -e MYSQL_ROOT_PASSWORD=dev_password \
  -e MYSQL_DATABASE=stock_trading_dev \
  -e MYSQL_USER=dev_user \
  -e MYSQL_PASSWORD=dev_password \
  -p 3306:3306 \
  -d mysql:8.0

# Then update backend/.env:
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USERNAME=dev_user
DATABASE_PASSWORD=dev_password
DATABASE_NAME=stock_trading_dev
```

### Option 2: Free Cloud MySQL

1. **PlanetScale** (Free tier): https://planetscale.com/
2. **Railway** (Free tier): https://railway.app/
3. **Aiven** (Free tier): https://aiven.io/
4. **ElephantSQL** (PostgreSQL, if you prefer): https://www.elephantsql.com/

### Option 3: Local MySQL Installation

```bash
# Windows (using Chocolatey)
choco install mysql

# macOS (using Homebrew)
brew install mysql

# Linux (Ubuntu/Debian)
sudo apt install mysql-server
```

## Configuration

Once you have MySQL running, update `backend/.env`:

```env
DATABASE_HOST=your-mysql-host
DATABASE_PORT=3306
DATABASE_USERNAME=your-username
DATABASE_PASSWORD=your-password
DATABASE_NAME=your-database-name
```

## Tables Auto-Creation

The NestJS backend will automatically create all required tables when it connects to the database (via TypeORM synchronization).

## Production vs Development

- **Development**: Use any MySQL instance with credentials in `backend/.env`
- **Production**: Uses Google Secret Manager for secure credential storage (already configured)

## Troubleshooting

1. **Connection refused**: Make sure MySQL is running and accessible
2. **Authentication failed**: Verify username/password are correct
3. **Database doesn't exist**: Create the database first, or let MySQL auto-create it
4. **Port conflicts**: Make sure port 3306 isn't used by another service
