CREATE USER app_test_user WITH PASSWORD 'apppassword';
GRANT ALL PRIVILEGES ON DATABASE test TO app_test_user;
ALTER SCHEMA public OWNER TO app_test_user;