import { ActionOptions } from '../models';

export const config: ActionOptions = {
  clearOnStoryChange: true,
  limit: 50,
};

export const configureActions = (options: ActionOptions = {}): void => {
  Object.assign(config, options);
};
