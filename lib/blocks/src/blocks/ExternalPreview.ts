import { Preview } from '@storybook/preview-web';
import { Path, ModuleExports, StoryIndex, ModuleExport } from '@storybook/store';
import { toId, AnyFramework, ComponentTitle, StoryId, ProjectAnnotations } from '@storybook/csf';

type StoryExport = ModuleExport;
type MetaExport = ModuleExports;
type ExportName = string;

class ConstantMap<TKey, TValue extends string> {
  entries = new Map<TKey, TValue>();

  // eslint-disable-next-line no-useless-constructor
  constructor(private prefix: string) {}

  get(key: TKey) {
    if (!this.entries.has(key)) {
      this.entries.set(key, `${this.prefix}${this.entries.size}` as TValue);
    }
    return this.entries.get(key);
  }
}

export class ExternalPreview<TFramework extends AnyFramework> extends Preview<TFramework> {
  private initialized = false;

  private importPaths = new ConstantMap<MetaExport, Path>('./importPath/');

  private titles = new ConstantMap<MetaExport, ComponentTitle>('title-');

  public storyIds = new Map<StoryExport, StoryId>();

  private storyIndex: StoryIndex = { v: 4, entries: {} };

  private moduleExportsByImportPath: Record<Path, ModuleExports> = {};

  constructor(public projectAnnotations: ProjectAnnotations) {
    super();
  }

  storyIdByModuleExport(storyExport: StoryExport, meta: MetaExport) {
    if (!this.storyIds.has(storyExport)) this.addStoryFromExports(storyExport, meta);
    return this.storyIds.get(storyExport);
  }

  addStoryFromExports(storyExport: StoryExport, meta: MetaExport) {
    const importPath = this.importPaths.get(meta);
    this.moduleExportsByImportPath[importPath] = meta;

    const title = meta.default.title || this.titles.get(meta);

    const exportEntry = Object.entries(meta).find(
      ([_, moduleExport]) => moduleExport === storyExport
    );
    if (!exportEntry)
      throw new Error(`Didn't find \`of\` used in Story block in the provided CSF exports`);
    const storyId = toId(title, exportEntry[0]);
    this.storyIds.set(storyExport, storyId);

    this.storyIndex.entries[storyId] = {
      id: storyId,
      importPath,
      title,
      name: 'Name',
      type: 'story',
    };

    if (!this.initialized) {
      this.initialized = true;
      return this.initialize({
        getStoryIndex: () => this.storyIndex,
        importFn: (path: Path) => {
          return Promise.resolve(this.moduleExportsByImportPath[path]);
        },
        getProjectAnnotations: () => this.projectAnnotations,
      });
    }
    // else
    return this.onStoriesChanged({ storyIndex: this.storyIndex });
  }

  storyById(storyId: StoryId) {
    const entry = this.storyIndex.entries[storyId];
    if (!entry) throw new Error(`Unknown storyId ${storyId}`);
    const { importPath, title } = entry;
    const moduleExports = this.moduleExportsByImportPath[importPath];
    const csfFile = this.storyStore.processCSFFileWithCache<TFramework>(
      moduleExports,
      importPath,
      title
    );
    return this.storyStore.storyFromCSFFile({ storyId, csfFile });
  }
}
