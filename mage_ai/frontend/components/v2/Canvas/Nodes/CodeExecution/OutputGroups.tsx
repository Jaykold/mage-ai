import EventStreamType, {
  ExecutionStatusEnum,
  ExecutionResultType,
  ResultType,
} from '@interfaces/EventStreamType';
import { useMutate } from '@context/v2/APIMutation';
import Tag from '@mana/components/Tag';
import { executionDone } from '@components/v2/ExecutionManager/utils';
import ExecutionOutput, { ExecutionOutputProps } from './ExecutionOutput';
import Grid from '@mana/components/Grid';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Scrollbar from '@mana/elements/Scrollbar';
import stylesOutput from '@styles/scss/components/Canvas/Nodes/OutputGroups.module.scss';
import { DEBUG } from '@components/v2/utils/debug';
import { groupBy, indexBy } from '@utils/array';
import { ElementRoleEnum } from '@mana/shared/types';
import { ExecutionOutputType } from '@interfaces/CodeExecutionType';
import { objectSize } from '@utils/hash';

export type OutputGroupsType = {
  handleContextMenu?: ExecutionOutputProps['handleContextMenu'];
  onMount?: (consumerID: string) => void;
  setHandleOnMessage?: (consumerID: string, handler: (event: EventStreamType) => void) => void;
  setResultMappingUpdate?: (
    consumerID: string,
    handler: (resultMapping: Record<string, ExecutionResultType>) => void,
  ) => void;
};

type OutputGroupsProps = {
  children?: React.ReactNode;
  consumerID: string;
  hideTimer?: boolean;
  minHeight?: number | string;
  onlyShowWithContent?: boolean;
  role?: ElementRoleEnum;
  styles?: React.CSSProperties;
} & OutputGroupsType;

const OutputGroups: React.FC<OutputGroupsProps> = ({
  children,
  consumerID,
  handleContextMenu,
  hideTimer,
  minHeight = 200,
  onMount,
  onlyShowWithContent,
  role,
  setHandleOnMessage,
  setResultMappingUpdate,
  styles,
}: OutputGroupsProps) => {
  const scrollableDivRef = useRef<HTMLDivElement>(null);

  const scrollDown = useCallback(() => {
    scrollableDivRef.current?.scrollTo({
      top: scrollableDivRef.current.scrollHeight,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [executing, setExecuting] = useState<boolean>(false);
  const [executionOutputMapping, setExecutionOutputMapping] = useState<
    Record<string, ExecutionOutputType>
  >({});
  const [resultMapping, setResultMappingState] = useState<Record<string, ExecutionResultType>>({});
  const setResultMapping = useCallback((data) => {
    setResultMappingState(prev => {
      const next = typeof data === 'function' ? data(prev) : data;
      const more = objectSize(next) > objectSize(prev);

      if (more) {
        scrollDown();
      }

      return next;
    });


  }, [scrollDown]);

  const resultsGroupedByMessageRequestUUID = useMemo(
    () =>
      groupBy(
        Object.values(resultMapping ?? {}),
        (result: ExecutionResultType) => result.process.message_request_uuid,
      ),
    [resultMapping],
  );

  const keys = useMemo(
    () => Object.keys(resultsGroupedByMessageRequestUUID ?? {})?.sort(),
    [resultsGroupedByMessageRequestUUID],
  );

  const mutants = useMutate({
    resource: 'execution_outputs',
  });

  const fetchOutput = useCallback(
    (id, opts) => {
      mutants.detail.mutate({
        ...opts,
        id,
        onSuccess: ({ data }) => {
          const xo = data?.execution_output;
          setExecutionOutputMapping(prev => ({
            ...prev,
            [xo.uuid]: xo,
          }));

          if (opts?.onSuccess) {
            opts.onSuccess(xo);
          }

          const key = keys?.[keys?.length - 1];
          const results = resultsGroupedByMessageRequestUUID?.[key];
          const ids = results?.map(r => String(r.process?.message_request_uuid)) ?? [];

          if (ids.includes(key)) {
            scrollDown();
          }
        },
      });
    },
    [mutants.detail, keys, scrollDown, resultsGroupedByMessageRequestUUID],
  );

  useEffect(() => {
    setResultMappingUpdate && setResultMappingUpdate?.(consumerID, setResultMapping);

    setHandleOnMessage &&
      setHandleOnMessage?.(consumerID, (event: EventStreamType) => {
        DEBUG.codeExecution.output &&
          console.log('event.result', JSON.stringify(event.result, null, 2));

        const done = executionDone(event);
        setExecuting(!done);

        const { result } = event;
        setResultMapping(prev => {
          const total = {
            ...prev,
            [result.result_id]: result,
          };

          if (done) {
            const results = Object.values(total ?? {})?.filter(
              r => r.process?.message_request_uuid === result.process?.message_request_uuid,
            );

            const resultOutput = results?.find(
              result =>
                ExecutionStatusEnum.SUCCESS === result.status && ResultType.OUTPUT === result.type,
            );
            if (resultOutput) {
              fetchOutput(resultOutput.process.message_request_uuid, {
                query: {
                  namespace: resultOutput.metadata.namespace,
                  path: resultOutput.metadata.path,
                },
              });
            }
          }

          return total;
        });
      });

    onMount && onMount?.(consumerID);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (onlyShowWithContent && (keys?.length ?? 0) === 0) {
    return null;
  }

  return (
    <div
      className={stylesOutput.outputContainer}
      role={role}
      style={{
        ...styles,
        minHeight,
      }}
    >
      {!hideTimer && executing && <Tag right statusVariant timer top />}

      {children}

      <Scrollbar
        autoHorizontalPadding
        ref={scrollableDivRef}
        style={{ maxHeight: 400, overflow: 'auto' }}
      >
        <Grid rowGap={8} templateRows="min-content">
          {keys?.map((mrUUID: string, idx: number) => {
            const last = idx === keys.length - 1;
            return (
              <ExecutionOutput
                executionOutput={executionOutputMapping?.[mrUUID]}
                fetchOutput={fetchOutput}
                first={idx === 0}
                handleContextMenu={handleContextMenu}
                key={mrUUID}
                last={last}
                messageRequestUUID={mrUUID}
                results={resultsGroupedByMessageRequestUUID[mrUUID]}
              />
            );
          })}
        </Grid>
      </Scrollbar>
    </div>
  );
};

export default OutputGroups;
