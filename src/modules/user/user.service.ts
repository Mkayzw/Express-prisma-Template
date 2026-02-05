import bcrypt from 'bcryptjs';
import { prisma } from '../../db/client';
import { User, CreateUserInput, UpdateUserInput, UserQueryParams } from './user.types';

export const findAll = async (params: Partial<UserQueryParams> = {}): Promise<{ users: User[]; total: number; page: number; limit: number }> => {
  const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', search } = params;
  const skip = (page - 1) * limit;

  const where = search
    ? {
      OR: [
        { email: { contains: search, mode: 'insensitive' as const } },
        { firstName: { contains: search, mode: 'insensitive' as const } },
        { lastName: { contains: search, mode: 'insensitive' as const } },
      ],
    }
    : {};

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users,
    total,
    page,
    limit,
  };
};

export const findById = async (id: string): Promise<User | null> => {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });
};

export const findByEmail = async (email: string): Promise<User | null> => {
  return prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });
};

export const create = async (userData: CreateUserInput): Promise<User> => {
  const { email, password, firstName, lastName } = userData;

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      firstName,
      lastName,
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return user;
};

export const update = async (id: string, userData: UpdateUserInput): Promise<User> => {
  const { email, firstName, lastName, role } = userData;

  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { id },
  });

  if (!existingUser) {
    throw new Error('User not found');
  }

  // If email is being updated, check if it's already taken
  if (email && email !== existingUser.email) {
    const emailTaken = await prisma.user.findUnique({
      where: { email },
    });

    if (emailTaken) {
      throw new Error('Email is already taken');
    }
  }

  const user = await prisma.user.update({
    where: { id },
    data: {
      email,
      firstName,
      lastName,
      ...(role && { role: role as 'USER' | 'ADMIN' }),
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return user;
};

export const remove = async (id: string): Promise<void> => {
  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { id },
  });

  if (!existingUser) {
    throw new Error('User not found');
  }

  await prisma.user.delete({
    where: { id },
  });
};

export const updatePassword = async (id: string, newPassword: string): Promise<void> => {
  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { id },
  });

  if (!existingUser) {
    throw new Error('User not found');
  }

  // Hash new password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);

  await prisma.user.update({
    where: { id },
    data: { password: hashedPassword },
  });
};
