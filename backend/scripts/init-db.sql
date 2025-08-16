-- Grant necessary permissions to the database user
-- This allows Prisma to create shadow databases for migrations

-- Grant CREATEDB privilege to the user
ALTER USER vision_user CREATEDB;

-- Grant all privileges on the database to the user
GRANT ALL PRIVILEGES ON DATABASE vision_tf TO vision_user;

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO vision_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO vision_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO vision_user;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO vision_user;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO vision_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO vision_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO vision_user;
