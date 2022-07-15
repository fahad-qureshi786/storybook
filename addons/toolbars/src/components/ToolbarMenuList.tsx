import React, { useCallback, FC, ReactNode } from 'react';
import { useGlobals } from '@storybook/api';
import { WithTooltip, TooltipLinkList } from '@storybook/components';
import { ToolbarMenuButton } from './ToolbarMenuButton';
import { withKeyboardCycle, WithKeyboardCycleProps } from '../hoc/withKeyboardCycle';
import { getSelectedIcon, getSelectedTitle } from '../utils/get-selected';
import { ToolbarMenuProps } from '../types';
import { ToolbarMenuListItem } from './ToolbarMenuListItem';

type ItemProps = {
  left?: ReactNode;
  title?: ReactNode;
  right?: ReactNode;
  active?: boolean;
  onClick?: () => void;
};

type ToolbarMenuListProps = ToolbarMenuProps & WithKeyboardCycleProps;

export const ToolbarMenuList: FC<ToolbarMenuListProps> = withKeyboardCycle(
  ({
    id,
    name,
    description,
    toolbar: { icon: _icon, items, title: _title, showName, preventDynamicIcon, dynamicTitle },
  }) => {
    const [globals, updateGlobals] = useGlobals();

    const currentValue = globals[id];
    const hasGlobalValue = !!currentValue;
    let icon = _icon;
    let title = _title;

    if (!preventDynamicIcon) {
      icon = getSelectedIcon({ currentValue, items }) || icon;
    }

    // Deprecation support for old "name of global arg used as title"
    if (showName && !title) {
      title = name;
      console.warn(
        '`showName` is deprecated as `name` will stop having dual purposes in the future. Please specify a `title` in `globalTypes` instead.'
      );
    } else if (!showName && !icon && !title) {
      title = name;
      console.warn(
        `Using the \`name\` "${name}" as toolbar title for backward compatibility. \`name\` will stop having dual purposes in the future. Please specify either a \`title\` or an \`icon\` in \`globalTypes\` instead.`
      );
    }

    if (dynamicTitle) {
      title = getSelectedTitle({ currentValue, items }) || title;
    }

    const handleItemClick = useCallback(
      (value: string | undefined) => {
        updateGlobals({ [id]: value });
      },
      [currentValue, updateGlobals]
    );

    return (
      <WithTooltip
        placement="top"
        trigger="click"
        tooltip={({ onHide }) => {
          const links = items
            // Special case handling for various "type" variants
            .filter(({ type }) => {
              let shouldReturn = true;

              if (type === 'reset' && !currentValue) {
                shouldReturn = false;
              }

              return shouldReturn;
            })
            .map((item) => {
              const listItem = ToolbarMenuListItem({
                ...item,
                currentValue,
                onClick: () => {
                  handleItemClick(item.value);
                  onHide();
                },
              });

              return listItem;
            });
          return <TooltipLinkList links={links} />;
        }}
        closeOnClick
      >
        <ToolbarMenuButton
          active={hasGlobalValue}
          description={description || ''}
          icon={icon}
          title={title || ''}
        />
      </WithTooltip>
    );
  }
);
