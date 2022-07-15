import { AnyFramework, StoryId } from '@storybook/csf';
import { CSFFile, ModuleExports, StoryStore } from '@storybook/store';
import { Channel, IndexEntry } from '@storybook/addons';
import { DOCS_RENDERED } from '@storybook/core-events';

import { Render, RenderType } from './Render';
import type { DocsContextProps } from '../docs-context/DocsContextProps';
import type { DocsRenderFunction } from '../docs-context/DocsRenderFunction';
import { DocsContext } from '../docs-context/DocsContext';

/**
 * A StandaloneDocsRender is a render of a docs entry that doesn't directly come from a CSF file.
 *
 * A standalone render can reference zero or more CSF files that contain stories.
 *
 * Use cases:
 *  - *.mdx file that may or may not reference a specific CSF file with `<Meta of={} />`
 */

export class StandaloneDocsRender<TFramework extends AnyFramework> implements Render<TFramework> {
  public readonly type: RenderType = 'docs';

  public readonly id: StoryId;

  private exports?: ModuleExports;

  public teardown?: (options: { viewModeChanged?: boolean }) => Promise<void>;

  public torndown = false;

  public readonly disableKeyListeners = false;

  public preparing = false;

  private csfFiles?: CSFFile<TFramework>[];

  constructor(
    protected channel: Channel,
    protected store: StoryStore<TFramework>,
    public entry: IndexEntry
  ) {
    this.id = entry.id;
  }

  isPreparing() {
    return this.preparing;
  }

  async prepare() {
    this.preparing = true;
    const { entryExports, csfFiles = [] } = await this.store.loadEntry(this.id);
    this.csfFiles = csfFiles;
    this.exports = entryExports;

    this.preparing = false;
  }

  isEqual(other: Render<TFramework>): boolean {
    return !!(
      this.id === other.id &&
      this.entry &&
      this.entry === (other as StandaloneDocsRender<TFramework>).entry
    );
  }

  async renderToElement(
    canvasElement: HTMLElement,
    renderStoryToElement: DocsContextProps['renderStoryToElement']
  ) {
    if (!this.exports || !this.csfFiles || !this.store.projectAnnotations)
      throw new Error('Cannot render docs before preparing');

    const docsContext = new DocsContext<TFramework>(
      this.channel,
      this.store,
      renderStoryToElement,
      this.csfFiles,
      false
    );

    const { docs } = this.store.projectAnnotations.parameters || {};

    if (!docs)
      throw new Error(
        `Cannot render a story in viewMode=docs if \`@storybook/addon-docs\` is not installed`
      );

    const renderer = await docs.renderer();
    (renderer.render as DocsRenderFunction<TFramework>)(
      docsContext,
      { ...docs, page: this.exports.default },
      canvasElement,
      () => this.channel.emit(DOCS_RENDERED, this.id)
    );
    this.teardown = async ({ viewModeChanged }: { viewModeChanged?: boolean } = {}) => {
      if (!viewModeChanged || !canvasElement) return;
      renderer.unmount(canvasElement);
      this.torndown = true;
    };
  }
}
