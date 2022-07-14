/* eslint-disable react/prop-types */
import React from 'react';
import 'nextra-theme-docs/style.css';
import { ThemeProvider, ensure, themes, styled } from '@storybook/theming';
// import { Title } from '@storybook/blocks';
import * as reactAnnotations from '@storybook/react/preview';
import { withReset } from '@storybook/components';
import * as previewAnnotations from '../.storybook/preview';

const projectAnnotations = {
  ...reactAnnotations,
  ...previewAnnotations,
};

const H1 = styled.h1(withReset, ({ theme }) => {
  console.log(theme);
  return {};
});

export default function Nextra({ Component, pageProps }) {
  return (
    <ThemeProvider theme={ensure(themes.light)}>
      <H1>foo</H1>
    </ThemeProvider>
  );
}
