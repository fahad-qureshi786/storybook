import { ComponentTitle } from '@storybook/csf';
import React, { useContext, FunctionComponent } from 'react';
import { Title as PureTitle } from '../components';
import { DocsContext } from './DocsContext';

interface TitleProps {
  children?: JSX.Element | string;
}

const STORY_KIND_PATH_SEPARATOR = /\s*\/\s*/;

export const extractTitle = (title: ComponentTitle) => {
  const groups = title.trim().split(STORY_KIND_PATH_SEPARATOR);
  return (groups && groups[groups.length - 1]) || title;
};

export const Title: FunctionComponent<TitleProps> = ({ children }) => {
  const context = useContext(DocsContext);
  let text: JSX.Element | string = children;
  if (!text) {
    text = extractTitle(context.storyById().title);
  }
  return text ? <PureTitle className="sbdocs-title">{text}</PureTitle> : null;
};
