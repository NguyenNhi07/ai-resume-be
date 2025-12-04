import { _ } from '@server/libs/lodash';

export const percentage = (part: number, total: number, quantity?: number): number => {
  if (total === 0) {
    if (quantity) return _.divide(100, quantity);
    return 0;
  }
  return _.multiply(_.divide(part, total), 100);
};
