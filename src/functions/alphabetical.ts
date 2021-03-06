import { isObject } from 'lodash';
import { IFunction } from '../types';
import { printValue } from '../utils/printValue';
import { isPlainObject } from '../guards/isPlainObject';

export interface IAlphaRuleOptions {
  /** if sorting array of objects, which key to use for comparison */
  keyedBy?: string;
}

const compare = (a: unknown, b: unknown): number => {
  if ((typeof a === 'number' || Number.isNaN(Number(a))) && (typeof b === 'number' || !Number.isNaN(Number(b)))) {
    return Math.min(1, Math.max(-1, Number(a) - Number(b)));
  }

  if (typeof a !== 'string' || typeof b !== 'string') {
    return 0;
  }

  return a.localeCompare(b);
};

const getUnsortedItems = <T>(arr: T[], compareFn: (a: T, B: T) => number): null | [number, number] => {
  for (let i = 0; i < arr.length - 1; i += 1) {
    if (compareFn(arr[i], arr[i + 1]) >= 1) {
      return [i, i + 1];
    }
  }

  return null;
};

function isStringOrNumber(maybeStringOrNumber: unknown): maybeStringOrNumber is string | number {
  return typeof maybeStringOrNumber === 'string' || typeof maybeStringOrNumber === 'number';
}

function isValidArray(arr: unknown[]): arr is (number | string)[] {
  return arr.every(isStringOrNumber);
}

export const alphabetical: IFunction<IAlphaRuleOptions | null> = (targetVal, opts, paths, { documentInventory }) => {
  if (!isObject(targetVal)) return;

  let targetArray: unknown[];

  if (Array.isArray(targetVal)) {
    targetArray = targetVal;
  } else if (isPlainObject(targetVal)) {
    targetArray = Object.keys(
      documentInventory
        .findAssociatedItemForPath(paths.given, true)
        ?.document.trapAccess<typeof targetVal>(targetVal) ?? targetVal,
    );
  } else {
    return [
      {
        message: '#{{print("property")}}must be an object or an array',
      },
    ];
  }

  if (targetArray.length < 2) {
    return;
  }

  const keyedBy = opts?.keyedBy;

  if (keyedBy !== void 0) {
    const _targetArray: (string | number)[] = [];
    for (const item of targetArray) {
      if (!isObject(item)) {
        return [
          {
            message: '#{{print("property")}}must be an object',
          },
        ];
      }

      _targetArray.push(item[keyedBy]);
    }

    targetArray = _targetArray;
  }

  if (!isValidArray(targetArray)) {
    return [
      {
        message: '#{{print("property")}}must be one of the allowed types: number, string',
      },
    ];
  }

  const unsortedItems = getUnsortedItems(targetArray, compare);

  if (unsortedItems != null) {
    const path = paths.target ?? paths.given;
    return [
      {
        ...(keyedBy === void 0
          ? {
              path: [...path, Array.isArray(targetVal) ? unsortedItems[0] : targetArray[unsortedItems[0]]],
            }
          : null),
        message:
          keyedBy !== void 0
            ? 'properties must follow the alphabetical order'
            : `${printValue(targetArray[unsortedItems[0]])} must be placed after ${printValue(
                targetArray[unsortedItems[1]],
              )}`,
      },
    ];
  }

  return;
};
