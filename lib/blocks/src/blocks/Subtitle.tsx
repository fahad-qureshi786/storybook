import React, { useContext, FC } from 'react';
import { Subtitle as PureSubtitle } from '../components';
import { DocsContext } from './DocsContext';

interface SubtitleProps {
  children?: JSX.Element | string;
}

export const Subtitle: FC<SubtitleProps> = ({ children }) => {
  const { id, storyById } = useContext(DocsContext);
  const { parameters } = storyById(id);
  let text: JSX.Element | string = children;
  if (!text) {
    text = parameters?.componentSubtitle;
  }
  return text ? <PureSubtitle className="sbdocs-subtitle">{text}</PureSubtitle> : null;
};
