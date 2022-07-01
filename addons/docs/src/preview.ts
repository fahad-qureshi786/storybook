export const parameters: any = {
  docs: {
    renderer: async () => {
      const { DocsRenderer } = (await import('./blocks')) as any;
      return new DocsRenderer();
    },
  },
};
