import React, { FunctionComponent, useRef } from 'react';
import { AnyFramework, ProjectAnnotations } from '@storybook/csf';
import { composeConfigs } from '@storybook/store';

import { Docs } from '../Docs';
import { ExternalPreview } from './ExternalPreview';

export type ExternalDocsProps<TFramework extends AnyFramework = AnyFramework> = {
  projectAnnotationsList: ProjectAnnotations<TFramework>[];
};

function usePreview<TFramework extends AnyFramework = AnyFramework>(
  projectAnnotations: ProjectAnnotations<TFramework>
) {
  const previewRef = useRef<ExternalPreview>();
  if (!previewRef.current) previewRef.current = new ExternalPreview(projectAnnotations);
  return previewRef.current;
}

export const ExternalDocs: FunctionComponent<ExternalDocsProps> = ({
  projectAnnotationsList,
  children,
}) => {
  const projectAnnotations = composeConfigs(projectAnnotationsList);
  const preview = usePreview(projectAnnotations);
  const parameters = {
    ...projectAnnotations.parameters?.docs,
    page: () => children,
  };

  return <Docs parameters={parameters} context={preview.docsContext()} />;
};
