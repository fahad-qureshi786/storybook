import React, { useContext, FunctionComponent } from 'react';
import { Subtitle as PureSubtitle } from '../components';
import { DocsContext } from './DocsContext';

interface SubtitleProps {
  children?: JSX.Element | string;
}

export const Subtitle: FunctionComponent<SubtitleProps> = ({ children }) => {
  const docsContext = useContext(DocsContext);
  const { parameters } = docsContext.storyById();
  let text: JSX.Element | string = children;
  if (!text) {
    text = parameters?.componentSubtitle;
  }
  return text ? <PureSubtitle className="sbdocs-subtitle">{text}</PureSubtitle> : null;
};
