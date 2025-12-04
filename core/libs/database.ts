import { Prisma } from '@prisma/client';

const SortOrder = Prisma.SortOrder;

const DatabaseModels = Prisma.ModelName;

const DatabaseModelFields: Record<keyof typeof Prisma.ModelName, string[]> =
  Prisma.dmmf.datamodel.models.reduce((acc, model) => {
    const modelName = model.name;
    acc[modelName] = model.fields.reduce((acc, field) => {
      const fieldName = field.name;
      const kind = field.kind;
      if (kind === 'object') return acc;
      acc.push(fieldName);
      return acc;
    }, []);
    return acc;
  }, {} as any);

export { DatabaseModels, DatabaseModelFields, SortOrder };
