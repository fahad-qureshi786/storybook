import { Call } from '@storybook/instrumenter';

export const findElementSelector = (
  call: Call,
  callsById: Map<Call['id'], Call>
): string | undefined => {
  if (
    call.method.startsWith('getBy') ||
    call.method.startsWith('findBy') ||
    call.method.startsWith('queryBy')
  ) {
    return call.id;
  }

  let result: string;

  // recursively traverse the call args to find the first selector
  call.args.forEach((arg) => {
    if (!result && Object.prototype.hasOwnProperty.call(arg, '__callId__')) {
      // eslint-disable-next-line no-underscore-dangle
      result = findElementSelector(callsById.get(arg.__callId__), callsById);
    }
  });
  return result;
};
