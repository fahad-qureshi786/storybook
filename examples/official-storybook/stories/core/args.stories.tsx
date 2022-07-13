import React, { FC, useState } from 'react';
import { useArgs } from '@storybook/client-api';

interface CustomArgs {
  first?: string;
  last?: string;
  foo?: string;
}

type UpdateArgs = ReturnType<typeof useArgs>[1];
type ResetArgs = ReturnType<typeof useArgs>[2];

const ArgUpdater: FC<{ args: CustomArgs; updateArgs: UpdateArgs; resetArgs: ResetArgs }> = ({
  args,
  updateArgs,
  resetArgs,
}) => {
  const [argsInput, updateArgsInput] = useState(JSON.stringify(args));

  return (
    <div>
      <h3>Hooks args:</h3>
      <pre>{JSON.stringify(args)}</pre>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          updateArgs(JSON.parse(argsInput));
        }}
      >
        <textarea value={argsInput} onChange={(e) => updateArgsInput(e.target.value)} />
        <br />
        <button type="submit">Change</button>
        <button type="button" onClick={() => resetArgs()}>
          Reset all
        </button>
      </form>
    </div>
  );
};

export default {
  title: 'Core/Args',
  decorators: [
    (story) => {
      const [args, updateArgs, resetArgs] = useArgs<CustomArgs>();

      return (
        <>
          {story()}
          <ArgUpdater args={args} updateArgs={updateArgs} resetArgs={resetArgs} />
        </>
      );
    },
  ],
};

const Template = (args) => {
  return (
    <div>
      <h3>Input args:</h3>
      <pre>{JSON.stringify(args)}</pre>
    </div>
  );
};

export const PassedToStory = Template.bind({});

PassedToStory.argTypes = { name: { defaultValue: 'initial', control: 'text' } };

export const OtherValues = Template.bind({});

OtherValues.argTypes = { name: { control: 'text' } };

export const DifferentSet = Template.bind({});
DifferentSet.args = {
  foo: 'bar',
  bar: 2,
} as CustomArgs;

export const TestUndefinedArgs = Template.bind({});
TestUndefinedArgs.args = {
  first: 'Bob',
  last: 'Miller',
  foo: 'bar',
} as CustomArgs;
TestUndefinedArgs.argTypes = {
  first: {
    control: { type: 'select' },
    options: ['Bob', 'Alice'],
  },
  last: {
    control: { type: 'select' },
    options: ['Miller', 'Meyer'],
  },
  foo: {
    control: { type: 'text' },
  },
};
