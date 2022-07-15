import type {
  StoryId,
  StoryName,
  AnyFramework,
  StoryContextForLoaders,
  ComponentTitle,
  Parameters,
} from '@storybook/csf';
import type { ModuleExport, ModuleExports, Story } from '@storybook/store';
import { PreviewWeb } from './PreviewWeb';

export interface DocsContextProps<TFramework extends AnyFramework = AnyFramework> {
  type: 'legacy' | 'modern' | 'external';

  id: StoryId;
  title: ComponentTitle;
  name: StoryName;

  storyIdByModuleExport: (storyExport: ModuleExport, metaExports?: ModuleExports) => StoryId;
  storyById: (id: StoryId) => Story<TFramework>;
  getStoryContext: (story: Story<TFramework>) => StoryContextForLoaders<TFramework>;

  componentStories: () => Story<TFramework>[];

  loadStory: (id: StoryId) => Promise<Story<TFramework>>;
  renderStoryToElement: PreviewWeb<TFramework>['renderStoryToElement'];

  /**
   * mdxStoryNameToKey is an MDX-compiler-generated mapping of an MDX story's
   * display name to its story key for ID generation. It's used internally by the `<Story>`
   * and `Preview` doc blocks.
   */
  mdxStoryNameToKey?: Record<string, string>;
  mdxComponentAnnotations?: any;

  /**
   * To be used by external docs
   */
  setMeta: (metaExport: ModuleExports) => void;
}

export type DocsRenderFunction<TFramework extends AnyFramework> = (
  docsContext: DocsContextProps<TFramework>,
  docsParameters: Parameters,
  element: HTMLElement,
  callback: () => void
) => void;
