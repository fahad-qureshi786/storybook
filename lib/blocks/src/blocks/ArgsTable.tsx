import React, { FC, useContext, useEffect, useState, useCallback } from 'react';
import mapValues from 'lodash/mapValues';
import { ArgTypesExtractor } from '@storybook/docs-tools';
import type { ModuleExport, PropDescriptor, Story } from '@storybook/store';
import { filterArgTypes } from '@storybook/store';
import {
  UPDATE_STORY_ARGS,
  STORY_ARGS_UPDATED,
  GLOBALS_UPDATED,
  RESET_STORY_ARGS,
} from '@storybook/core-events';
import { StrictArgTypes, Args, Globals } from '@storybook/csf';
import {
  ArgsTable as PureArgsTable,
  ArgsTableProps as PureArgsTableProps,
  ArgsTableError,
  SortType,
  TabbedArgsTable,
} from '../components';

import { DocsContext, DocsContextProps } from './DocsContext';
import { Component, CURRENT_SELECTION, currentSelectionWarning, PRIMARY_STORY } from './types';
import { getComponentName } from './utils';

interface BaseProps {
  include?: PropDescriptor;
  exclude?: PropDescriptor;
  sort?: SortType;
}

type OfProps = BaseProps & {
  of: '^' | Component;
};

type ComponentsProps = BaseProps & {
  components: {
    [label: string]: Component;
  };
};

type StoryProps = BaseProps & {
  story?: '.' | '^' | string;
  of?: ModuleExport;
  showComponent?: boolean;
};

type ArgsTableProps = BaseProps | OfProps | ComponentsProps | StoryProps;

const useArgs = (
  storyId: string,
  context: DocsContextProps
): [Args, (args: Args) => void, (argNames?: string[]) => void] => {
  const storyContext = context.getStoryContext(context.storyById());

  const [args, setArgs] = useState(storyContext.args);
  useEffect(() => {
    const cb = (changed: { storyId: string; args: Args }) => {
      if (changed.storyId === storyId) {
        setArgs(changed.args);
      }
    };
    context.channel.on(STORY_ARGS_UPDATED, cb);
    return () => context.channel.off(STORY_ARGS_UPDATED, cb);
  }, [storyId]);
  const updateArgs = useCallback(
    (updatedArgs) => context.channel.emit(UPDATE_STORY_ARGS, { storyId, updatedArgs }),
    [storyId]
  );
  const resetArgs = useCallback(
    (argNames?: string[]) => context.channel.emit(RESET_STORY_ARGS, { storyId, argNames }),
    [storyId]
  );
  return [args, updateArgs, resetArgs];
};

const useGlobals = (context: DocsContextProps): [Globals] => {
  const storyContext = context.getStoryContext(context.storyById());
  const [globals, setGlobals] = useState(storyContext.globals);

  useEffect(() => {
    const cb = (changed: { globals: Globals }) => {
      setGlobals(changed.globals);
    };
    context.channel.on(GLOBALS_UPDATED, cb);
    return () => context.channel.off(GLOBALS_UPDATED, cb);
  }, []);

  return [globals];
};

export const extractComponentArgTypes = (
  component: Component,
  context: DocsContextProps,
  include?: PropDescriptor,
  exclude?: PropDescriptor
): StrictArgTypes => {
  const { parameters } = context.storyById();
  const { extractArgTypes }: { extractArgTypes: ArgTypesExtractor } = parameters.docs || {};
  if (!extractArgTypes) {
    throw new Error(ArgsTableError.ARGS_UNSUPPORTED);
  }
  let argTypes = extractArgTypes(component);
  argTypes = filterArgTypes(argTypes, include, exclude);

  return argTypes;
};

const isShortcut = (value?: string) => {
  return value && [CURRENT_SELECTION, PRIMARY_STORY].includes(value);
};

export const getStory = (props: ArgsTableProps = {}, context: DocsContextProps): Story => {
  const { story: storyName, of } = props as StoryProps;

  if (isShortcut(of) || isShortcut(storyName)) {
    if (of === CURRENT_SELECTION || storyName === CURRENT_SELECTION) currentSelectionWarning();
    return context.storyById();
  }

  if (storyName) {
    return context.storyById(context.storyIdByName(storyName));
  }

  try {
    if (of) return context.storyById(context.storyIdByModuleExport(of));
  } catch (err) {
    // of is a component reference
  }
  return null;
};

const addComponentTabs = (
  tabs: Record<string, PureArgsTableProps>,
  components: Record<string, Component>,
  context: DocsContextProps,
  include?: PropDescriptor,
  exclude?: PropDescriptor,
  sort?: SortType
) => ({
  ...tabs,
  ...mapValues(components, (comp) => ({
    rows: extractComponentArgTypes(comp, context, include, exclude),
    sort,
  })),
});

export const StoryTable: FC<
  StoryProps & { loadedStory: Story; subcomponents: Record<string, Component> }
> = (props) => {
  const context = useContext(DocsContext);
  const { loadedStory: story, subcomponents, showComponent, include, exclude, sort } = props;
  const { component } = story;
  try {
    // eslint-disable-next-line prefer-const
    let [args, updateArgs, resetArgs] = useArgs(story.id, context);
    const [globals] = useGlobals(context);
    if (!story) return <PureArgsTable isLoading updateArgs={updateArgs} resetArgs={resetArgs} />;

    const argTypes = filterArgTypes(story.argTypes, include, exclude);

    const mainLabel = getComponentName(component) || 'Story';

    let tabs = { [mainLabel]: { rows: argTypes, args, globals, updateArgs, resetArgs } } as Record<
      string,
      PureArgsTableProps
    >;

    // Use the dynamically generated component tabs if there are no controls
    const storyHasArgsWithControls = argTypes && Object.values(argTypes).find((v) => !!v?.control);

    if (!storyHasArgsWithControls) {
      updateArgs = null;
      resetArgs = null;
      tabs = {};
    }

    if (component && (!storyHasArgsWithControls || showComponent)) {
      tabs = addComponentTabs(tabs, { [mainLabel]: component }, context, include, exclude);
    }

    if (subcomponents) {
      if (Array.isArray(subcomponents)) {
        throw new Error(
          `Unexpected subcomponents array. Expected an object whose keys are tab labels and whose values are components.`
        );
      }
      tabs = addComponentTabs(tabs, subcomponents, context, include, exclude);
    }
    return <TabbedArgsTable tabs={tabs} sort={sort} />;
  } catch (err) {
    return <PureArgsTable error={err.message} />;
  }
};

export const ComponentsTable: FC<ComponentsProps> = (props) => {
  const context = useContext(DocsContext);
  const { components, include, exclude, sort } = props;

  const tabs = addComponentTabs({}, components, context, include, exclude);
  return <TabbedArgsTable tabs={tabs} sort={sort} />;
};

export const ArgsTable: FC<ArgsTableProps> = (props) => {
  const context = useContext(DocsContext);
  const {
    parameters: { controls },
    subcomponents,
  } = context.storyById();

  const { include, exclude, components, sort: sortProp } = props as ComponentsProps;

  const sort = sortProp || controls?.sort;

  const story = getStory(props, context);
  if (story) {
    return (
      <StoryTable {...(props as StoryProps)} loadedStory={story} {...{ subcomponents, sort }} />
    );
  }

  const main = (props as OfProps).of;
  if (!main) throw new Error(ArgsTableError.NO_COMPONENT);
  if (!components && !subcomponents) {
    let mainProps;
    try {
      mainProps = { rows: extractComponentArgTypes(main, context, include, exclude) };
    } catch (err) {
      mainProps = { error: err.message };
    }

    return <PureArgsTable {...mainProps} sort={sort} />;
  }

  if (components) {
    return <ComponentsTable {...(props as ComponentsProps)} {...{ components, sort }} />;
  }

  const mainLabel = getComponentName(main);
  return (
    <ComponentsTable
      {...(props as ComponentsProps)}
      components={{ [mainLabel]: main, ...subcomponents }}
      sort={sort}
    />
  );
};

ArgsTable.defaultProps = {
  of: PRIMARY_STORY,
};
