DELETE FROM UserRole WHERE userId IN (SELECT id FROM User WHERE email='admin@example.com');
DELETE FROM User WHERE email='admin@example.com';
INSERT INTO User (id, firstName, lastName, username, email, password)
VALUES ('b7e6a1c2-3f4d-4e2a-9b1a-2c3d4e5f6a7b', 'Admin', 'User', 'admin', 'admin@example.com', '$2a$10$HvAnU3FHJAW0zdnfTSKQX.Y2.KsdG14Q3T2.nvP87DR1x0FLzLxAm')
ON CONFLICT(email) DO UPDATE SET username='admin';
INSERT INTO UserRole (id, role, userId)
VALUES ('c8f7b2d3-4e5f-6a7b-8c9d-0e1f2a3b4c5d', 'ADMIN', 'b7e6a1c2-3f4d-4e2a-9b1a-2c3d4e5f6a7b')
ON CONFLICT(userId, role) DO NOTHING;
DELETE FROM UserRole WHERE userId IN (SELECT id FROM User WHERE email='teacher@example.com');
DELETE FROM User WHERE email='teacher@example.com';
INSERT INTO User (id, firstName, lastName, username, email, password)
VALUES ('d9e8f7a6-5b4c-3d2e-1f0a-9b8c7d6e5f4a', 'Teacher', 'User', 'teacher', 'teacher@example.com', '$2a$10$HvAnU3FHJAW0zdnfTSKQX.Y2.KsdG14Q3T2.nvP87DR1x0FLzLxAm')
ON CONFLICT(email) DO UPDATE SET username='teacher';
INSERT INTO UserRole (id, role, userId)
VALUES ('e0f1a2b3-4c5d-6e7f-8a9b-0c1d2e3f4a5b', 'TEACHER', 'd9e8f7a6-5b4c-3d2e-1f0a-9b8c7d6e5f4a')
ON CONFLICT(userId, role) DO NOTHING;