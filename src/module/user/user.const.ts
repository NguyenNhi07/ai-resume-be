import { Prisma } from '@prisma/client';

export const USER_DEFAULT_SELECT: Prisma.UserSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  fullName: true,
  phoneNumber: true,
  status: true,
  dob: true,
  role: true,
  gender: true,
  address: true,
  city: true,
  country: true,
  imageLink: true,
  lastActive: true,
  language: true,
  profession: true,
};

export const USER_DEFAULT_SELECT_BY_ADMIN: Prisma.UserSelect = {
  ...USER_DEFAULT_SELECT,
  temporaryPassword: true,
};
