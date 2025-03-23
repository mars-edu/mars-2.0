import { PrismaClient } from "@prisma/client";
import { hashSync } from "bcrypt";

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

enum Role {
  ADMIN = "ADMIN",
  TEACHER = "TEACHER",
  STUDENT = "STUDENT",
  PARENT = "PARENT",
}

async function main() {
  try {
    const admin = await prisma.user.upsert({
      where: { email: "admin@example.com" },
      update: {},
      create: {
        firstName: "Admin",
        lastName: "User",
        email: "admin@example.com",
        password: hashSync("password", SALT_ROUNDS),
      },
    });

    await prisma.userRole.upsert({
      where: {
        userId_role: {
          userId: admin.id,
          role: Role.ADMIN,
        },
      },
      update: {},
      create: {
        userId: admin.id,
        role: Role.ADMIN,
      },
    });

    const teacher = await prisma.user.upsert({
      where: { email: "teacher@example.com" },
      update: {},
      create: {
        firstName: "Teacher",
        lastName: "User",
        email: "teacher@example.com",
        password: hashSync("password", SALT_ROUNDS),
      },
    });

    await prisma.userRole.upsert({
      where: {
        userId_role: {
          userId: teacher.id,
          role: Role.TEACHER,
        },
      },
      update: {},
      create: {
        userId: teacher.id,
        role: Role.TEACHER,
      },
    });

    console.log("Database has been seeded successfully");
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
