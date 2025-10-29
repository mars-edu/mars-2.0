import { getPrismaClient } from "./prismaClient.js";
import type { Env } from "../types/env.js";

const cyrillicToTranslit = require("cyrillic-to-translit-js");
const translit = cyrillicToTranslit();

export async function generateEmail(
  firstName: string,
  lastName: string,
  env: { DB: any }
): Promise<string> {
  const firstNameTranslit = translit
    .transform(firstName, "-")
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "");
  const lastNameTranslit = translit
    .transform(lastName, "-")
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "");

  const baseEmail = `${firstNameTranslit}.${lastNameTranslit}@iam-mars.kz`;

  const prisma = getPrismaClient(env);

  const existingUser = await prisma.user.findUnique({
    where: { email: baseEmail },
  });

  if (!existingUser) {
    return baseEmail;
  }

  let counter = 1;
  let emailWithCounter = `${firstNameTranslit}.${lastNameTranslit}${counter}@iam-mars.kz`;

  while (counter < 1000) {
    const userWithEmail = await prisma.user.findUnique({
      where: { email: emailWithCounter },
    });

    if (!userWithEmail) {
      return emailWithCounter;
    }

    counter++;
    emailWithCounter = `${firstNameTranslit}.${lastNameTranslit}${counter}@iam-mars.kz`;
  }

  const timestamp = Date.now();
  return `${firstNameTranslit}.${lastNameTranslit}.${timestamp}@iam-mars.kz`;
}
