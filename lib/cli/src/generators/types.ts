import { NpmOptions } from '../NpmOptions';
import { SupportedLanguage, Builder, ProjectType } from '../project_types';
import { JsPackageManager } from '../js-package-manager/JsPackageManager';

export type GeneratorOptions = {
  language: SupportedLanguage;
  builder: Builder;
  linkable: boolean;
  pnp: boolean;
};

export interface FrameworkOptions {
  extraPackages?: string[];
  extraAddons?: string[];
  staticDir?: string;
  addScripts?: boolean;
  addComponents?: boolean;
  addBabel?: boolean;
  addESLint?: boolean;
  extraMain?: any;
  extensions?: string[];
  framework?: Record<string, any>;
  commonJs?: boolean;
}

export type Generator = (
  packageManagerInstance: JsPackageManager,
  npmOptions: NpmOptions,
  generatorOptions: GeneratorOptions
) => Promise<void>;

export type CommandOptions = {
  useNpm?: boolean;
  usePnp?: boolean;
  type?: ProjectType;
  force?: any;
  html?: boolean;
  skipInstall?: boolean;
  parser?: string;
  yes?: boolean;
  builder?: Builder;
  linkable?: boolean;
  commonJs?: boolean;
  disableTelemetry?: boolean;
};
