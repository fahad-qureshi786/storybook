import type { BuiltInParserName } from 'prettier';

export type SyntaxHighlighterFormatTypes = boolean | 'dedent' | BuiltInParserName;

export interface SyntaxHighlighterProps {
  language: string;
  copyable?: boolean;
  bordered?: boolean;
  padded?: boolean;
  format?: SyntaxHighlighterFormatTypes;
  formatter?: (type: SyntaxHighlighterFormatTypes, source: string) => string;
  showLineNumbers?: boolean;
  className?: string;
}
