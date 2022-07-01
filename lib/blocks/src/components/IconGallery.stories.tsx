import React from 'react';
import { Icons as ExampleIcon } from '@storybook/components';
import { IconItem, IconGallery } from './IconGallery';

export default {
  component: IconGallery,
};

export const DefaultStyle = () => (
  <IconGallery>
    <IconItem name="add">
      <ExampleIcon icon="add" />
    </IconItem>
    <IconItem name="subtract">
      <ExampleIcon icon="subtract" />
    </IconItem>
    <IconItem name="home">
      <ExampleIcon icon="home" />
    </IconItem>
    <IconItem name="facehappy">
      <ExampleIcon icon="facehappy" />
    </IconItem>
    <IconItem name="bar">
      <img src="https://place-hold.it/50x50" alt="example" />
    </IconItem>
    <IconItem name="bar">
      <img src="https://place-hold.it/50x50" alt="example" />
    </IconItem>
  </IconGallery>
);
