import { Source, SourceError } from './Source';

export default {
  component: Source,
};

export const Loading = {
  args: {
    isLoading: true,
  },
};

export const JSX = {
  args: {
    code: `
<MyComponent boolProp scalarProp={1} complexProp={{ foo: 1, bar: '2' }}>
  <SomeOtherComponent funcProp={(a) => a.id} />
</MyComponent>
`,
    language: 'jsx',
    format: false,
  },
};

export const CSSWithDarkMode = {
  args: {
    code: `
@-webkit-keyframes blinker {
  from { opacity: 1.0; }
  to { opacity: 0.0; }
}

.waitingForConnection {
  -webkit-animation-name: blinker;
  -webkit-animation-iteration-count: infinite;
  -webkit-animation-timing-function: cubic-bezier(.5, 0, 1, 1);
  -webkit-animation-duration: 1.7s;
}
`,
    language: 'css',
    format: false,
    dark: true,
  },
};

export const GraphQLWithFormatting = {
  args: {
    code: `query HeroNameAndFriends($episode: Episode) {
          hero(episode: $episode) {
            name
            friends {
              name
            }
          }
        }
`,
    language: 'graphql',
    format: true,
  },
};

export const NoStory = {
  args: {
    error: SourceError.NO_STORY,
    format: false,
  },
};

export const SourceUnavailable = {
  args: {
    error: SourceError.SOURCE_UNAVAILABLE,
    format: false,
  },
};
