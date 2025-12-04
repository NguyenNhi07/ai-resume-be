import _ from 'lodash';

export function movePropertiesToPrototype<T>(obj: T, properties: (keyof T)[]) {
  properties.forEach((property) => {
    if (_.has(obj, property)) {
      _.set(Object.getPrototypeOf(obj), property, _.get(obj, property));
      _.unset(obj, property);
    }
  });
}

export function objectToBase64(obj: object = {}) {
  return Buffer.from(JSON.stringify(obj)).toString('base64');
}

export function getDeepObjectDifferences(oldObj: object, newObj: object) {
  const diff = (first: object, second: object) => {
    const iteratee = (result: any, firstValue: object, key: string) => {
      const secondValue = second[key];
      if (_.isEqual(firstValue, secondValue)) return;
      if (!_.isObject(firstValue) || !_.isObject(secondValue)) {
        return (result[key] = firstValue);
      }
      const nestedDiff = diff(firstValue, secondValue);
      if (!_.isEmpty(nestedDiff)) {
        result[key] = nestedDiff;
      }
    };
    return _.transform(first, iteratee, {});
  };

  return { before: diff(oldObj, newObj), after: diff(newObj, oldObj) };
}
