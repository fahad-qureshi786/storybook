import { StoryId, AnyFramework, ComponentTitle, StoryName } from '@storybook/csf';
import { DocsContext, DocsContextProps } from '@storybook/preview-web';
import { CSFFile, ModuleExport, ModuleExports, StoryStore } from '@storybook/store';

export class ExternalDocsContext<TFramework extends AnyFramework> extends DocsContext<TFramework> {
  constructor(
    public readonly id: StoryId,
    public readonly title: ComponentTitle,
    public readonly name: StoryName,
    protected store: StoryStore<TFramework>,
    public renderStoryToElement: DocsContextProps['renderStoryToElement'],
    private processMetaExports: (metaExports: ModuleExports) => CSFFile<TFramework>
  ) {
    super(id, title, name, store, renderStoryToElement, [], true);
  }

  setMeta = (metaExports: ModuleExports) => {
    const csfFile = this.processMetaExports(metaExports);
    this.referenceCSFFile(csfFile, true);
  };

  storyIdByModuleExport(storyExport: ModuleExport, metaExports?: ModuleExports) {
    if (metaExports) {
      const csfFile = this.processMetaExports(metaExports);
      this.referenceCSFFile(csfFile, false);
    }

    // This will end up looking up the story id in the CSF file referenced above or via setMeta()
    return super.storyIdByModuleExport(storyExport);
  }
}
