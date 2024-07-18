import React, {
  createRef,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { BADGE_HEIGHT, PADDING_VERTICAL } from '../../../Canvas/Nodes/BlockNodeV2';
import { getUpDownstreamColors } from '../../../Canvas/Nodes/Blocks/utils';
import stylesPipelineBuilder from '@styles/scss/apps/Canvas/Pipelines/Builder.module.scss';
import { ModelContext } from '../ModelManager/ModelContext';
import { cubicBezier, motion, useAnimation, useAnimate } from 'framer-motion';
import { SettingsContext } from '../SettingsManager/SettingsContext';
import useAppEventsHandler, { CustomAppEvent, CustomAppEventEnum } from '../useAppEventsHandler';
import {
  ConnectionLines,
  LinePathType,
  linePathKey,
} from '../../../Canvas/Connections/ConnectionLines';
import {
  LayoutStyleEnum,
  ItemStatusEnum,
  LayoutDisplayEnum,
  LayoutConfigDirectionEnum,
  ItemTypeEnum,
} from '../../../Canvas/types';
import { LayoutConfigType, RectType, OutputNodeType } from '@components/v2/Canvas/interfaces';
import { getBlockColor } from '@mana/themes/blocks';
import { getPathD } from '../../../Canvas/Connections/utils';
import { indexBy, sortByKey, unique, uniqueArray } from '@utils/array';
import { BlockTypeEnum } from '@interfaces/BlockType';
import { GroupUUIDEnum } from '@interfaces/PipelineExecutionFramework/types';
import { LayoutManagerType } from '../interfaces';
import { LINE_CLASS_NAME } from '../utils/display';
import { DEBUG } from '../../../utils/debug';
import { deepCopy, ignoreKeys, objectSize, selectKeys } from '@utils/hash';
import { calculateBoundingBox } from '@components/v2/Canvas/utils/layout/shared';
import { FrameworkType } from '@interfaces/PipelineExecutionFramework/interfaces';

export const EASING = cubicBezier(0.35, 0.17, 0.3, 0.86);
export const ANIMATION_DURATION = 0.2;
const BASE_Z_INDEX = 1;
const ORDER = {
  [ItemTypeEnum.NODE]: 0,
  [ItemTypeEnum.BLOCK]: 1,
  [ItemTypeEnum.OUTPUT]: 1,
};

export type UpdateLinesType = (
  mapping: Record<string, RectType>,
  groupRectArg: RectType,
  opts?: {
    callback?: () => void;
    replace?: boolean;
    shouldAnimate?: (rectup: RectType, rectdn: RectType) => boolean;
  },
) => void;

export function getLineID(upstream: string, downstream: string) {
  return [upstream, downstream].join('->');
}

export default function LineManagerV2({
  animate,
  controls: controlsProp,
  rectsMapping,
  selectedGroupRect,
  updateLinesRef,
  visible,
}: {
  animate?: boolean;
  controls?: any;
  rectsMapping: Record<string, RectType>;
  selectedGroupRect: RectType;
  updateLinesRef?: React.MutableRefObject<UpdateLinesType>;
  visible?: boolean;
}) {
  const { blockMappingRef, blocksByGroupRef, groupMappingRef, outputsRef } =
    useContext(ModelContext);
  const { layoutConfigsRef, selectedGroupsRef } = useContext(SettingsContext);

  const controls = useAnimation();
  const timeoutRef = useRef<any>(null);

  function getLayoutConfig() {
    const layoutConfig = layoutConfigsRef?.current?.[selectedGroupsRef?.current?.length - 1];
    return layoutConfig ?? {};
  }

  const lineRefs = useRef<
    Record<ItemTypeEnum, Record<string, React.MutableRefObject<SVGPathElement>>>
  >({} as any);

  const [linesBlock, setLinesBlock] = useState<Record<string, LinePathType[]>>({});
  const [linesNode, setLinesNode] = useState<Record<string, LinePathType[]>>({});
  const [linesOutput, setLinesOutput] = useState<Record<string, LinePathType[]>>({});

  const prepareLinePathProps = useCallback(
    (
      rectup: RectType,
      rectdn: RectType,
      opts?: {
        direction?: LayoutConfigType['direction'];
        display?: LayoutConfigType['display'];
        style?: LayoutConfigType['style'];
      },
    ) => {
      const lineID = getLineID(rectup.id, rectdn.id);
      // console.log(lineID, rectup, rectdn, opts)

      const { block } = rectup;
      const { block: block2 } = rectdn;
      const isOutput = ItemTypeEnum.OUTPUT === rectdn?.type;

      const colors = [];

      if (isOutput) {
        colors.push('greenmd');
      } else {
        [block, block2]?.forEach(b => {
          const color = getBlockColor((b as any)?.type ?? BlockTypeEnum.GROUP, {
            getColorName: true,
          })?.names?.base;

          if (
            (!color || colors.includes(color)) &&
            (BlockTypeEnum.GROUP === block2?.type || !block2?.type)
          ) {
            const { downstreamInGroup, upstreamInGroup } = getUpDownstreamColors(
              block,
              [],
              blocksByGroupRef?.current,
              {
                blockMapping: blockMappingRef?.current,
                groupMapping: groupMappingRef?.current,
              },
            );
            colors.push(...(downstreamInGroup?.map(g => g.colorName) ?? []));
          } else if (color && !colors.includes(color)) {
            colors.push(color);
          }
        });
      }

      const fromRect = {
        ...deepCopy(rectup),
        offset: {
          x: 0,
          y: 0,
        },
      };
      const toRect = {
        ...deepCopy(rectdn),
        offset: {
          x: 0,
          y: 0,
        },
      };

      const positions = {
        [LayoutConfigDirectionEnum.VERTICAL]: ['bottom', 'top'],
        [LayoutConfigDirectionEnum.HORIZONTAL]: ['right', 'left'],
      };

      let frpos = null;
      let topos = null;

      // Determine relative positions dynamically
      // if downstream rect’s left is completely on the right side
      if (rectdn.left > rectup.left + rectup.width) {
        // positions[LayoutConfigDirectionEnum.HORIZONTAL][1] = 'left';
        frpos = 'right';
        topos = 'left';

        fromRect.offset.x = -PADDING_VERTICAL;
        toRect.offset.x = PADDING_VERTICAL;
      } else {
        frpos = 'left';
        topos = 'right';

        fromRect.offset.x = PADDING_VERTICAL;
        toRect.offset.x = -PADDING_VERTICAL;
      }

      if (rectdn.top < rectup.top) {
        // rectdn is above rect
        // positions[LayoutConfigDirectionEnum.VERTICAL] = ['top', 'bottom'];
        // positions[LayoutConfigDirectionEnum.HORIZONTAL] = ['right', 'bottom'];
        if (!topos) {
          topos = 'bottom';
          toRect.offset.y = -PADDING_VERTICAL;
        }

        if (rectdn.top + rectdn.height < rectup.top) {
          // rectdn is completely above rectup
          frpos = 'top';
          topos = 'bottom';
          fromRect.offset.y = PADDING_VERTICAL;
          toRect.offset.y = -PADDING_VERTICAL;
        }
      } else if (rectdn.top > rectup.top) {
        // rectdn is below rect
        // positions[LayoutConfigDirectionEnum.VERTICAL] = ['bottom', 'top'];
        // positions[LayoutConfigDirectionEnum.HORIZONTAL] = ['right', 'top'];
        if (!topos) {
          topos = 'top';
          toRect.offset.y = PADDING_VERTICAL;
        }

        // if downstream rect’s left is within the upstream’s left and right
        // if (rectdn.left > rectup.left && rectdn.left < rectup.left + rectup.width) {
        //   positions[LayoutConfigDirectionEnum.VERTICAL][1] = 'left';
        // }

        // if (rectdn.left > rectup.left + rectup.width) {
        //   positions[LayoutConfigDirectionEnum.HORIZONTAL][1] = 'left';
        // }

        if (rectdn.top > rectup.top + rectup.height) {
          // rectdn is completely below rectup
          frpos = 'bottom';
          topos = 'top';
          fromRect.offset.y = -PADDING_VERTICAL;
          toRect.offset.y = PADDING_VERTICAL;
        }
      }

      if (ItemTypeEnum.OUTPUT === rectdn.type) {
        topos = 'top';
        toRect.offset.y = PADDING_VERTICAL;
        toRect.offset.x = -toRect.width / 2 + PADDING_VERTICAL;
      }

      // if (rectdn.left < rectup.left) {
      //   // rectdn is to the left of rect
      //   positions[LayoutConfigDirectionEnum.HORIZONTAL] = ['left', 'right'];
      // } else if (rectdn.left > rectup.left) {
      //   // rectdn is to the right of rect
      //   positions[LayoutConfigDirectionEnum.HORIZONTAL] = ['right', 'left'];
      // }

      const layoutConfig = getLayoutConfig();
      const { direction, display, style } = {
        ...layoutConfig,
        ...opts,
      };
      // const [fromPosition, toPosition] = positions[direction];

      const pathDOpts = {
        // curveControl: isOutput ? 0.5 : 0,
        curveControl: 0,
        fromPosition: frpos,
        toPosition: topos,
      } as any;
      const dvalue = getPathD(pathDOpts, fromRect, toRect);

      return {
        colors,
        dvalue,
        fromRect,
        isOutput,
        lineID,
        toRect,
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  function renderPaths(
    pairsByType: {
      [ItemTypeEnum.BLOCK]?: [RectType, RectType][];
      [ItemTypeEnum.NODE]?: [RectType, RectType][];
      [ItemTypeEnum.OUTPUT]?: [RectType, RectType][];
    },
    opts?: {
      replace?: boolean;
      shouldAnimate: (rectup: RectType, rectdn: RectType) => boolean;
    },
  ): LinePathType[] {
    const linePaths = [];
    const paths = {
      [ItemTypeEnum.BLOCK]: {},
      [ItemTypeEnum.NODE]: {},
      [ItemTypeEnum.OUTPUT]: {},
    };

    Object.entries(pairsByType ?? {})?.forEach(([type, pairs]) => {
      sortByKey(pairs, (pair: [RectType, RectType]) => {
        const idx = ORDER[pair[0]?.type];
        return [
          idx >= 0 ? idx : Object.keys(ORDER).length,
          LayoutConfigDirectionEnum.VERTICAL === getLayoutConfig()?.direction
            ? pair[0]?.top
            : pair[0]?.left,
        ].join('_');
      })?.forEach(([rectup, rectdn], index: number) => {
        const linePath = renderLine(rectup, rectdn, index, {
          layout: getLayoutConfig(),
          shouldAnimate: opts?.shouldAnimate,
        });

        paths[type][rectup.id] ||= [];
        paths[type][rectup.id].push(linePath);
        linePaths.push(linePath);
      });
    });

    // console.log('paths', paths);

    setLinesBlock(prev => {
      const val = {
        ...(opts?.replace ? {} : prev),
        ...paths[ItemTypeEnum.BLOCK],
      };
      return val;
    });
    setLinesNode(prev => {
      const val = {
        ...(opts?.replace ? {} : prev),
        ...paths[ItemTypeEnum.NODE],
      };
      return val;
    });
    setLinesOutput(prev => {
      const val = {
        ...(opts?.replace ? {} : prev),
        ...paths[ItemTypeEnum.OUTPUT],
      };
      return val;
    });

    return linePaths;
  }

  const renderLine = useCallback(
    (
      rectup: RectType,
      rectdn: RectType,
      index: number,
      opts?: {
        layout?: {
          direction?: LayoutConfigType['direction'];
          display?: LayoutConfigType['display'];
          style?: LayoutConfigType['style'];
        };
        shouldAnimate?: (rectup: RectType, rectdn: RectType) => boolean;
      },
    ): LinePathType => {
      const paths = [];

      const { colors, dvalue, fromRect, isOutput, lineID, toRect } = prepareLinePathProps(
        rectup,
        rectdn,
        opts?.layout,
      );

      // console.log(lineID, fromRect?.left, fromRect?.top, toRect?.left, toRect?.top)

      const gradientID = `${lineID}-grad`;

      if (colors?.length >= 2) {
        paths.push(
          <defs key={`${gradientID}-defs`}>
            <linearGradient id={gradientID} x1="0%" x2="100%" y1="0%" y2="0%">
              <stop
                offset="0%"
                style={{ stopColor: `var(--colors-${colors[1]})`, stopOpacity: 1 }}
              />
              <stop
                offset="100%"
                style={{ stopColor: `var(--colors-${colors[0]})`, stopOpacity: 1 }}
              />
            </linearGradient>
          </defs>,
        );
      }

      lineRefs.current[rectdn?.type] ||= {};
      lineRefs.current[rectdn?.type][lineID] ||= createRef();

      const lineRef = lineRefs.current[rectdn.type][lineID];

      if (lineRef?.current) {
        lineRef?.current?.classList?.remove(stylesPipelineBuilder.exit);
      }

      const shouldAnimate = opts?.shouldAnimate && opts?.shouldAnimate?.(rectup, rectdn);
      // console.log(rectup, rectdn, shouldAnimate, opts);
      paths.push(
        <motion.path
          animate={shouldAnimate ? controls : controlsProp ?? controls}
          className={stylesPipelineBuilder.path}
          custom={{
            animate: shouldAnimate,
            from: rectup,
            index,
            isOutput,
            to: rectdn,
          }}
          d={dvalue}
          data-index={index}
          fill="none"
          id={lineID}
          initial={{
            opacity: 0,
            pathLength: 0,
          }}
          key={lineID}
          ref={lineRef}
          stroke={
            colors?.length >= 2 ? `url(#${gradientID})` : `var(--colors-${colors[0] ?? 'gray'})`
          }
          style={{
            strokeWidth: isOutput ? 2 : 1.5,
          }}
        />,
      );

      const keys = ['left', 'top', 'width', 'height'];

      return {
        animate: shouldAnimate,
        id: lineID,
        key: [
          keys
            ?.map(key => Math.round(fromRect?.[key]))
            .map(String)
            .join(':'),
          keys
            ?.map(key => Math.round(toRect?.[key]))
            .map(String)
            .join(':'),
        ].join('->'),
        paths,
        source: rectup,
        target: rectdn,
      };
    },
    [controls, controlsProp, prepareLinePathProps],
  );

  const updateLines = useCallback(
    (
      mapping: Record<string, RectType>,
      groupRectArg: RectType,
      opts?: {
        callback?: () => void;
        replace?: boolean;
        shouldAnimate?: (rectup: RectType, rectdn: RectType) => boolean;
      },
    ) => {
      const pairsByType = {
        [ItemTypeEnum.BLOCK]: [],
        [ItemTypeEnum.NODE]: [],
        [ItemTypeEnum.OUTPUT]: [],
      } as any;

      const selectedGroup = selectedGroupsRef?.current?.[selectedGroupsRef?.current?.length - 1];
      const groupRect = groupRectArg ?? mapping?.[selectedGroup?.id];

      const blocksInGroup = Object.values(blocksByGroupRef?.current?.[groupRect?.id] ?? {}) ?? [];
      const currentGroupChildrenIDs = (
        (
          (groupRect?.block as FrameworkType) ?? {
            children: [],
          }
        )?.children ?? []
      )
        ?.concat(blocksInGroup ?? [])
        ?.map(child => child.uuid);

      const allRectsAreInGroup = Object.keys(mapping ?? {}).every(
        id => id === groupRect?.id || currentGroupChildrenIDs?.includes(id),
      );
      const values = Object.values({
        ...(mapping ?? {}),
        ...(groupRect && !allRectsAreInGroup ? { [groupRect.id]: groupRect } : {}),
      });

      const outputNodesByBlockUUID = Object.values(mapping ?? {}).reduce(
        (acc, node) => ({
          ...acc,
          ...(ItemTypeEnum.OUTPUT === node?.type
            ? {
                [node?.block?.uuid]: [...(acc?.[node?.block?.uuid] ?? []), node],
              }
            : {}),
        }),
        {},
      );

      // console.log('lines', values);

      values?.forEach((rectdn: RectType) => {
        // Lines for groups
        if (ItemTypeEnum.NODE === rectdn?.type) {
          // e.g. data preparation: displaying this as the selected group, all 4 groups displayed
          // belong inside it, so we show lines between those 4 groups.

          // Skip if rect is in the current group’s children.
          rectdn?.upstream?.forEach(rectup1 => {
            let rectup2 = null;

            // console.log(rectdn.id, rectdn?.upstream, mapping, pairsByType,
            //   allRectsAreInGroup,
            //   currentGroupChildrenIDs?.includes(rectup1.id),
            //   rectup1.id === groupRect?.id,
            // );

            // Current downstream and upstream block is a child of the currently selected group.
            if (
              currentGroupChildrenIDs?.includes(rectdn.id) &&
              currentGroupChildrenIDs?.includes(rectup1.id)
            ) {
              rectup2 = mapping?.[rectup1.id];
            } else if (
              !allRectsAreInGroup &&
              // The upstream block is a child of the currently selected group or
              // the upstream block is the currently selected group.
              (currentGroupChildrenIDs?.includes(rectup1.id) || rectup1.id === groupRect?.id)
            ) {
              rectup2 = groupRect;
            } else if (
              currentGroupChildrenIDs?.includes(rectdn.id) &&
              !currentGroupChildrenIDs?.includes(rectup1.id)
            ) {
              // If downstream block is in the current group’s children and
              // the upstream is not in the current group’s children,
              // then skip.
              return;
            } else {
              rectup2 = mapping?.[rectup1.id];
            }

            if (!rectup2) return;

            pairsByType[rectdn.type].push([rectup2, rectdn]);
          });
        } else if (ItemTypeEnum.BLOCK === rectdn?.type) {
          const { block: blockdn } = rectdn;

          const outputNodes = outputNodesByBlockUUID?.[blockdn.uuid] ?? [];
          outputNodes?.forEach((output: OutputNodeType) => {
            DEBUG.lines.manager && console.log('line.output', output, rectdn);
            pairsByType[output.type].push([rectdn, output]);
            // console.log(rectdn, output, pairsByType);
          });

          (blockdn as any)?.upstream_blocks?.forEach((upuuid: string) => {
            const rectup = mapping?.[upuuid];

            if (!rectup) return;

            const block2 = blockMappingRef?.current?.[upuuid];

            // Don’t draw lines if blocks aren’t in the same active group.
            if (
              !(blockdn as any)?.groups?.some(
                (guuid: GroupUUIDEnum) =>
                  block2?.groups?.includes(guuid) &&
                  (!selectedGroup || selectedGroup?.uuid === guuid),
              )
            ) {
              return;
            }

            pairsByType[rectdn.type].push([rectup, rectdn]);
          });
        }
      });

      const linePaths = renderPaths(pairsByType, {
        replace: opts?.replace,
        shouldAnimate: opts?.shouldAnimate,
      });

      if (linePaths?.some(r => r.animate)) {
        startAnimating(true);
      }

      opts?.callback && opts?.callback?.();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const startAnimating = useCallback(
    (override?: boolean) => {
      if (animate || override) {
        timeoutRef.current = setTimeout(() => {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;

          controls.stop();
          controls.set(({ animate }) =>
            animate
              ? {
                  opacity: 0,
                  pathLength: 0,
                }
              : {
                  opacity: 1,
                  pathLength: 1,
                },
          );
          controls.start(({ animate, index, isOutput }) => ({
            ease: EASING,
            opacity: 1,
            pathLength: 1,
            transition: animate
              ? {
                  delay: index * ANIMATION_DURATION + (isOutput ? 1 : 0.5),
                  duration: isOutput ? 0.1 : ANIMATION_DURATION * ((100 - index) / 100),
                }
              : { duration: 0 },
          }));
        }, 100);
      } else {
        controls.set({
          opacity: 1,
          pathLength: 1,
        });
      }
    },
    [animate, controls],
  );

  useEffect(() => {
    updateLinesRef.current = updateLines;

    updateLines(rectsMapping, selectedGroupRect, {
      replace: true,
    });

    if (visible && !controlsProp) {
      startAnimating();
    }

    const timeout = timeoutRef.current;

    return () => {
      clearTimeout(timeout);
      timeoutRef.current = null;
    };
  }, [
    controlsProp,
    rectsMapping,
    selectedGroupRect,
    startAnimating,
    updateLines,
    updateLinesRef,
    visible,
  ]);

  return (
    <>
      <ConnectionLines linePaths={linesBlock} zIndex={BASE_Z_INDEX + ORDER[ItemTypeEnum.BLOCK]} />
      <ConnectionLines linePaths={linesNode} zIndex={BASE_Z_INDEX + ORDER[ItemTypeEnum.NODE]} />
      <ConnectionLines linePaths={linesOutput} zIndex={BASE_Z_INDEX + ORDER[ItemTypeEnum.OUTPUT]} />
    </>
  );
}
