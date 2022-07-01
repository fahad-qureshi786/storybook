/* eslint-disable react/no-array-index-key */
import React, { ClipboardEvent, FunctionComponent, MouseEvent, useCallback, useState } from 'react';
import { logger } from '@storybook/client-logger';
import { styled, ClassNames, useTheme } from '@storybook/theming';
import global from 'global';
import Highlight, { defaultProps, Language } from 'prism-react-renderer';
// Use pre-defined themes for backward compatibility
import lightTheme from 'prism-react-renderer/themes/vsLight';
import darkTheme from 'prism-react-renderer/themes/vsDark';

import { ActionBar } from '../ActionBar/ActionBar';
import { ScrollArea } from '../ScrollArea/ScrollArea';

import type { SyntaxHighlighterProps } from './syntaxhighlighter-types';

const { navigator, document, window: globalWindow } = global;

const copyToClipboard: (text: string) => Promise<void> = createCopyToClipboardFunction();

export function createCopyToClipboardFunction() {
  if (navigator?.clipboard) {
    return (text: string) => navigator.clipboard.writeText(text);
  }
  return async (text: string) => {
    const tmp = document.createElement('TEXTAREA');
    const focus = document.activeElement;

    tmp.value = text;

    document.body.appendChild(tmp);
    tmp.select();
    document.execCommand('copy');
    document.body.removeChild(tmp);
    focus.focus();
  };
}

export interface WrapperProps {
  bordered?: boolean;
  padded?: boolean;
}

const Wrapper = styled.div<WrapperProps>(
  ({ theme }) => ({
    position: 'relative',
    overflow: 'hidden',
    color: theme.color.defaultText,
  }),
  ({ theme, bordered }) =>
    bordered
      ? {
          border: `1px solid ${theme.appBorderColor}`,
          borderRadius: theme.appBorderRadius,
          background: theme.background.content,
        }
      : {}
);

const Scroller = styled(({ children, className }) => (
  <ScrollArea horizontal vertical className={className}>
    {children}
  </ScrollArea>
))({
  position: 'relative',
});

export interface PreProps {
  padded?: boolean;
}

const Pre = styled.pre<PreProps>(({ theme, padded }) => ({
  display: 'flex',
  justifyContent: 'flex-start',
  margin: 0,
  // This is copied from global styles since we don't want to rely on cascade
  padding: padded ? theme.layoutMargin : '11px 1rem',
  fontFamily: theme.typography.fonts.mono,
  fontSize: theme.typography.size.s2 - 1,
  lineHeight: '18px',
  WebkitFontSmoothing: 'antialiased',
  MozOsxFontSmoothing: 'grayscale',
  whiteSpace: 'pre-wrap',
}));

const Code = styled.code(({ theme }) => ({
  flex: 1,
  paddingRight: theme.layoutMargin,
  opacity: 1,
}));

const Line = styled.div({
  display: 'table-row',
});

const LineNo = styled.span({
  display: 'table-cell',
  textAlign: 'right',
  paddingRight: '1em',
  userSelect: 'none',
  opacity: '0.25',
});

const LineContent = styled.span({
  display: 'table-cell',
});

export interface SyntaxHighlighterState {
  copied: boolean;
}

export const SyntaxHighlighter: FunctionComponent<SyntaxHighlighterProps> = ({
  children,
  language = 'jsx',
  copyable = false,
  bordered = false,
  padded = false,
  format = true,
  formatter = null,
  className,
  showLineNumbers = false,
  ...rest
}) => {
  if (typeof children !== 'string' || !children.trim()) {
    return null;
  }

  const highlightableCode = formatter ? formatter(format, children) : children.trim();
  const [copied, setCopied] = useState(false);

  const onClick = useCallback(
    (e: MouseEvent<HTMLButtonElement> | ClipboardEvent<HTMLDivElement>) => {
      e.preventDefault();

      const selectedText = globalWindow.getSelection().toString();
      const textToCopy = e.type !== 'click' && selectedText ? selectedText : highlightableCode;

      copyToClipboard(textToCopy)
        .then(() => {
          setCopied(true);
          globalWindow.setTimeout(() => setCopied(false), 1500);
        })
        .catch(logger.error);
    },
    [highlightableCode]
  );

  const theme = useTheme();
  // For now, resolve to static themes based on current color scheme.
  // In the future we can rely on CSS vars.
  const prismTheme = theme.base === 'dark' ? darkTheme : lightTheme;

  return (
    <div>
      <Wrapper bordered={bordered} padded={padded} className={className} onCopyCapture={onClick}>
        <Scroller>
          <Highlight
            {...defaultProps}
            theme={prismTheme}
            code={highlightableCode}
            language={language as Language}
          >
            {({ className: cn, style, tokens, getLineProps, getTokenProps }) => (
              <ClassNames>
                {({ css, cx }) => (
                  // Convert inline styles to class names
                  <Pre padded={padded} className={cx(cn, css(style))}>
                    <Code>
                      {tokens.map((line, i) => {
                        const lineProps = getLineProps({ line });
                        return (
                          // Convert inline styles to class names
                          <Line key={i} className={cx(lineProps.className, css(lineProps.style))}>
                            {showLineNumbers && <LineNo>{i + 1}</LineNo>}
                            <LineContent>
                              {line.map((token, key) => {
                                const tokenProps = getTokenProps({ token, key });
                                return (
                                  <span
                                    key={key}
                                    // Convert inline styles to class names
                                    className={cx(tokenProps.className, css(tokenProps.style))}
                                  >
                                    {tokenProps.children}
                                  </span>
                                );
                              })}
                            </LineContent>
                          </Line>
                        );
                      })}
                    </Code>
                  </Pre>
                )}
              </ClassNames>
            )}
          </Highlight>
        </Scroller>

        {copyable ? (
          <ActionBar actionItems={[{ title: copied ? 'Copied' : 'Copy', onClick }]} />
        ) : null}
      </Wrapper>
    </div>
  );
};

export default SyntaxHighlighter;
