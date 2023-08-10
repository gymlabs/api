import { Category } from "@gymlabs/db";

import { db } from "../db";

const authenticateGymEntity = async (
  category: Category,
  operation: "create" | "read" | "update" | "delete",
  userId: string,
  gymId: string
): Promise<boolean> => {
  const operationFilter: {
    create?: boolean;
    read?: boolean;
    update?: boolean;
    delete?: boolean;
  } = {};
  operationFilter[operation] = true;

  const employment = await db.employment.findFirst({
    where: {
      userId,
      gymId,
      role: {
        accessRights: {
          some: {
            category,
            ...operationFilter,
          },
        },
      },
    },
    select: {
      id: true,
    },
  });

  return !!employment;
};

const authenticateOrganizationEntity = async (
  category: Category,
  operation: "create" | "read" | "update" | "delete",
  userId: string,
  organizationId: string
): Promise<boolean> => {
  const gyms = await db.gym.findMany({
    where: {
      organizationId,
    },
    select: {
      id: true,
    },
  });

  for (const gym of gyms) {
    if (await authenticateGymEntity(category, operation, userId, gym.id)) {
      return true;
    }
  }

  return false;
};

export { authenticateGymEntity, authenticateOrganizationEntity };
