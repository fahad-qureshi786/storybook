import { AnyFramework } from '@storybook/csf';
import { DocsContext } from '@storybook/preview-web';
import { StoryStore } from '@storybook/store';
import type { DocsContextProps } from '@storybook/preview-web';
import type { CSFFile, ModuleExport, ModuleExports } from '@storybook/store';
import type { Channel } from '@storybook/channels';

export class ExternalDocsContext<TFramework extends AnyFramework> extends DocsContext<TFramework> {
  constructor(
    public channel: Channel,
    protected store: StoryStore<TFramework>,
    public renderStoryToElement: DocsContextProps['renderStoryToElement'],
    private processMetaExports: (metaExports: ModuleExports) => CSFFile<TFramework>
  ) {
    super(channel, store, renderStoryToElement, [], true);
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
