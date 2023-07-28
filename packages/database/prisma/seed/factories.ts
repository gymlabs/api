import { faker } from "@faker-js/faker";

import {
  Contract,
  Employment,
  Gym,
  Membership,
  Organization,
} from "../../dist/client";

function createRandomOrganization(): Pick<Organization, "name"> {
  return {
    name: faker.company.name(),
  };
}

function createRandomGym(
  organizationId: Gym["organizationId"]
): Omit<Gym, "id" | "createdAt" | "updatedAt"> {
  return {
    name: faker.company.name(),
    description: faker.lorem.sentence(),
    street: faker.address.street(),
    postalCode: faker.address.zipCode(),
    city: faker.address.city(),
    country: faker.address.country(),
    organizationId,
  };
}

function createRandomContract(
  organizationId: Gym["organizationId"]
): Omit<Contract, "id" | "createdAt" | "updatedAt"> {
  return {
    name: faker.color.human(),
    description: faker.lorem.sentence(),
    monthlyCost: parseFloat(faker.finance.amount(20, 100)),
    contractDuration: faker.helpers.arrayElement([6, 12, 24]),
    organizationId,
  };
}

function createRandomEmployment(
  userId: Employment["userId"],
  gymId: Employment["gymId"],
  roleId: Employment["roleId"]
): Omit<Employment, "id" | "createdAt" | "updatedAt"> {
  return {
    roleId,
    userId,
    gymId,
    isActive: +faker.random.numeric() % 2 === 0,
    deletedAt: null,
  };
}

function createRandomMembership(
  userId: Membership["userId"],
  gymId: Membership["gymId"],
  contractId: Membership["contractId"]
): Omit<Membership, "id" | "createdAt" | "updatedAt"> {
  return {
    userId,
    gymId,
    contractId,
    isActive: +faker.random.numeric() % 2 === 0,
    deletedAt: null,
  };
}

export {
  createRandomContract,
  createRandomEmployment,
  createRandomGym,
  createRandomMembership,
  createRandomOrganization,
};
