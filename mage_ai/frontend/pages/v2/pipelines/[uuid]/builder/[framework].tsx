import React, { useEffect } from 'react';
import Route from '@components/v2/Route';
import dynamic from 'next/dynamic';
import useExecutionManager from '@components/v2/ExecutionManager/useExecutionManager';
import { NextPageContext } from 'next';
import { PipelineExecutionFrameworkUUIDEnum } from '@interfaces/PipelineExecutionFramework/types';

const Builder = dynamic(() => import('@components/v2/Layout/Pipelines/Detail/Builder'), {
  ssr: false,
});

function PipelineDetailPage({
  framework,
  uuid,
}: {
  framework: PipelineExecutionFrameworkUUIDEnum;
  uuid: string;
}) {
  const { teardown, useExecuteCode, useRegistration } = useExecutionManager();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => () => teardown(), []);

  return (
    <Builder
      frameworkUUID={framework}
      useExecuteCode={useExecuteCode}
      useRegistration={useRegistration}
      uuid={uuid}
    />
  );
}

PipelineDetailPage.getInitialProps = async (ctx: NextPageContext) => {
  const { framework, uuid } = ctx.query;
  return {
    framework,
    uuid,
  };
};

export default Route(PipelineDetailPage);