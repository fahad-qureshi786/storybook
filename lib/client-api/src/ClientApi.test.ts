import { addons, mockChannel } from '@storybook/addons';
import { ClientApi } from './ClientApi';

beforeEach(() => {
  addons.setChannel(mockChannel());
});

describe('ClientApi', () => {
  describe('getStoryIndex', () => {
    it('should remember the order that files were added in', async () => {
      const clientApi = new ClientApi();
      const store = {
        processCSFFileWithCache: jest.fn(() => ({ meta: { title: 'title' } })),
        storyFromCSFFile: jest.fn(({ storyId }) => ({
          id: storyId,
          parameters: { fileName: storyId.split('-')[0].replace('kind', 'file') },
        })),
      };
      clientApi.storyStore = store as any;

      let disposeCallback: () => void;
      const module1 = {
        id: 'file1',
        hot: {
          data: {},
          accept: jest.fn(),
          dispose(cb: () => void) {
            disposeCallback = cb;
          },
        },
      };
      const module2 = {
        id: 'file2',
      };
      clientApi.storiesOf('kind1', module1 as unknown as NodeModule).add('story1', jest.fn());
      clientApi.storiesOf('kind2', module2 as unknown as NodeModule).add('story2', jest.fn());

      expect(Object.keys(clientApi.getStoryIndex().entries)).toEqual([
        'kind1--story1',
        'kind2--story2',
      ]);

      disposeCallback();
      clientApi.storiesOf('kind1', module1 as unknown as NodeModule).add('story1', jest.fn());
      expect(Object.keys(clientApi.getStoryIndex().entries)).toEqual([
        'kind1--story1',
        'kind2--story2',
      ]);
    });
  });
});
