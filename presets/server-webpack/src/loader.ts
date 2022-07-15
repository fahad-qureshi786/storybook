import { compileCsfModule } from './lib/compiler';

export default (content: string) => {
  try {
    const after = compileCsfModule(JSON.parse(content));
    return after;
  } catch (e) {
    //
  }
  return content;
};
