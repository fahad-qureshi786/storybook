import React from 'react';
import { ResetWrapper } from '@storybook/components';
import { SectionRow } from './SectionRow';
import { TableWrapper } from './ArgsTable';

export default {
  component: SectionRow,
  decorators: [
    (getStory) => (
      <ResetWrapper>
        <TableWrapper>
          <tbody>{getStory()}</tbody>
        </TableWrapper>
      </ResetWrapper>
    ),
  ],
};

export const Section = {
  args: {
    level: 'section',
    label: 'Props',
  },
};

export const Subsection = {
  args: {
    level: 'subsection',
    label: 'HTMLElement',
  },
};

export const Collapsed = {
  args: { ...Section.args, initialExpanded: false },
};

export const Nested = {
  render: () => (
    <SectionRow {...Section.args}>
      <SectionRow {...Subsection.args}>
        <tr>
          <td colSpan={2}>Some content</td>
        </tr>
      </SectionRow>
    </SectionRow>
  ),
};
