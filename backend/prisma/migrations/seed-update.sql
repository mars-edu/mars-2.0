-- Drop tables if they exist
DROP TABLE IF EXISTS UserRole;
DROP TABLE IF EXISTS User;

-- Create User table
CREATE TABLE IF NOT EXISTS User (
    id TEXT PRIMARY KEY DEFAULT (uuid()),
    firstName TEXT NOT NULL,
    lastName TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create UserRole table
CREATE TABLE IF NOT EXISTS UserRole (
    id TEXT PRIMARY KEY DEFAULT (uuid()),
    role TEXT NOT NULL,
    userId TEXT NOT NULL,
    FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE,
    UNIQUE(userId, role)
);

-- Insert admin user
INSERT INTO User (id, firstName, lastName, email, password) 
VALUES (
    '550e8400-e29b-41d4-a716-446655440000',
    'Admin',
    'User',
    'admin@example.com',
    '$2a$10$mQS7PGpYDtw9B2nAaqhfQOIYsXunAJFUXocMPUjFLSzAYQJLnk9wa'
);

-- Insert admin role
INSERT INTO UserRole (id, role, userId)
VALUES (
    '550e8400-e29b-41d4-a716-446655440001',
    'ADMIN',
    '550e8400-e29b-41d4-a716-446655440000'
);

-- Insert teacher user
INSERT INTO User (id, firstName, lastName, email, password)
VALUES (
    '550e8400-e29b-41d4-a716-446655440002',
    'Teacher',
    'User',
    'teacher@example.com',
    '$2a$10$mQS7PGpYDtw9B2nAaqhfQOIYsXunAJFUXocMPUjFLSzAYQJLnk9wa'
);

-- Insert teacher role
INSERT INTO UserRole (id, role, userId)
VALUES (
    '550e8400-e29b-41d4-a716-446655440003',
    'TEACHER',
    '550e8400-e29b-41d4-a716-446655440002'
); 