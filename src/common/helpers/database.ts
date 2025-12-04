import { GetSelect } from '@prisma/client/runtime/library';
import { _ } from '@server/libs/lodash';
import { isEmpty } from 'class-validator';

export function selectSameAsObject<T>(
  dto: any,
): GetSelect<Record<keyof T, boolean>, any> {
  const keys = Object.keys(dto);
  // @ts-ignore
  return _.zipObject(keys, Array(keys.length).fill(true));
}

export function parseOrderByFromQuery(orderBy: string[]): any[] {
  if (isEmpty(orderBy)) return [];
  const result = [];
  for (const value of orderBy) {
    const [key, order] = value.split(':');
    result.push({ [key]: order });
  }
  return result;
}
