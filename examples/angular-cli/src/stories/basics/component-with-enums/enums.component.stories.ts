import type { Meta, StoryFn } from '@storybook/angular';
import {
  EnumsComponent,
  EnumNumeric,
  EnumNumericInitial,
  EnumStringValues,
} from './enums.component';

export default {
  title: 'Basics / Component / With Enum Types',
  component: EnumsComponent,
} as Meta;

export const Basic: StoryFn = (args) => ({
  props: args,
});
Basic.args = {
  unionType: 'union a',
  aliasedUnionType: 'Type Alias 1',
  enumNumeric: EnumNumeric.FIRST,
  enumNumericInitial: EnumNumericInitial.UNO,
  enumStrings: EnumStringValues.PRIMARY,
  enumAlias: EnumNumeric.FIRST,
};
