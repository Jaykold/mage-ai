import React, { createRef, useEffect, useMemo, useRef, useState, startTransition, useCallback } from 'react';
import { get, update } from './cache';
import { findLargestUnoccupiedSpace } from '@utils/rects';
import { snapToGrid } from '../../Canvas/utils/snapToGrid';
import { handleSaveAsImage } from './utils/images';
import { RenderContextMenuOptions } from '@mana/hooks/useContextMenu';
import BlockNodeV2, { BADGE_HEIGHT, PADDING_VERTICAL } from '../../Canvas/Nodes/BlockNodeV2';
import PortalNode from '../../Canvas/Nodes/PortalNode';
import Grid from '@mana/components/Grid';
import useAppEventsHandler, { CustomAppEventEnum } from './useAppEventsHandler';
import Text from '@mana/elements/Text';
import { getChildrenDimensions } from '@utils/elements';
import {
  OpenInSidekick, OpenInSidekickLeft, ArrowsAdjustingFrameSquare, SearchV2,
  ArrowsPointingInFromAllCorners, TreeWithArrowsDown, Undo,
} from '@mana/icons';
import stylesPipelineBuilder from '@styles/scss/apps/Canvas/Pipelines/Builder.module.scss';
import { motion, animate, useAnimation, useMotionValue, useMotionValueEvent, useTransform } from 'framer-motion';
import { applyRectDiff, calculateBoundingBox, getRectDiff, GROUP_NODE_PADDING } from '../../Canvas/utils/layout/shared';
import { transformRects } from '../../Canvas/utils/rect';
import { ClientEventType, EventOperationEnum } from '@mana/shared/interfaces';
import {
  TransformRectTypeEnum,
  ItemTypeEnum, LayoutConfigDirectionEnum, LayoutConfigDirectionOriginEnum, LayoutDisplayEnum, LayoutStyleEnum,
} from '../../Canvas/types';
import BlockType from '@interfaces/BlockType';
import { useDrop } from 'react-dnd';
import CanvasContainer, { GRID_SIZE } from './index.style';
import LineManagerV2, { ANIMATION_DURATION as ANIMATION_DURATION_LINES, EASING } from './Lines/LineManagerV2';
import DragWrapper from '../../Canvas/Nodes/DragWrapper';
import HeaderUpdater from '../../Layout/Header/Updater';
import PipelineExecutionFrameworkType,
{ FrameworkType, PipelineExecutionFrameworkBlockType } from '@interfaces/PipelineExecutionFramework/interfaces';
import { hydrateBlockNodeRects, buildRectTransformations } from './Layout/utils';
import { ExecutionManagerType } from '../../ExecutionManager/interfaces';
import {
  BlockMappingType, BlocksByGroupType, GroupLevelType, GroupMappingType, LayoutConfigType,
  NodeType, RectType, OutputNodeType, AppNodeType,
} from '@components/v2/Canvas/interfaces';
import { MenuGroupType, MenuItemType } from '@mana/components/Menu/interfaces';
import { ModelProvider } from './ModelManager/ModelContext';
import { EventProvider } from './Events/EventContext';
import { RemoveContextMenuType, RenderContextMenuType } from '@mana/hooks/useContextMenu';
import { SettingsProvider } from './SettingsManager/SettingsContext';
import { ShadowNodeType, ShadowRenderer } from '@mana/hooks/useShadowRender';
import { ZoomPanStateType } from '@mana/hooks/useZoomPan';
import { buildDependencies } from './utils/pipelines';
import { getCache } from '@mana/components/Menu/storage';
import { useMutate } from '@context/APIMutation';
import { deepCopyArray, equals, indexBy, unique, uniqueArray } from '@utils/array';
import { getNewUUID } from '@utils/string';
import { deepCopy, isEmptyObject } from '@utils/hash';
import { WithOnMount } from '@mana/hooks/useWithOnMount';
import { AppConfigType } from '../interfaces';
import { buildOutputNode } from './utils/items';
import { buildAppNode } from './AppManager/utils';

const ENTER_ANIMATION_START_THRESHOLD = 0.6;
const CHANGE_BLOCKS_ANIMATION_DURATION = 5;
const ANIMATION_DURATION = 1;
const INITIAL_ANIMATION_DURATION = 0.2;

type ModelsType = Record<string, {
  blocks: BlockType[];
  groups: FrameworkType[];
}>;

export type PipelineCanvasV2Props = {
  canvasRef: React.RefObject<HTMLDivElement>;
  containerRef: React.RefObject<HTMLDivElement>;
  defaultActiveLevel?: number;
  dragEnabled?: boolean;
  dropEnabled?: boolean;
  executionFrameworkUUID: string;
  pipelineUUID: string;
  removeContextMenu: RemoveContextMenuType;
  renderContextMenu: RenderContextMenuType;
  setDragEnabled: (value: boolean) => void;
  setDropEnabled: (value: boolean) => void;
  setZoomPanDisabled: (value: boolean) => void;
  snapToGridOnDrop?: boolean;
  transformState: React.MutableRefObject<ZoomPanStateType>;
  useExecuteCode: ExecutionManagerType['useExecuteCode'];
  useRegistration: ExecutionManagerType['useRegistration'];
};

const PipelineCanvasV2: React.FC<PipelineCanvasV2Props> = ({
  canvasRef,
  containerRef,
  // dragEnabled,
  // dropEnabled,
  executionFrameworkUUID,
  pipelineUUID,
  removeContextMenu,
  renderContextMenu,
  setDragEnabled,
  setDropEnabled,
  setZoomPanDisabled,
  snapToGridOnDrop = false,
  transformState,
  useExecuteCode,
  useRegistration,
}: PipelineCanvasV2Props) => {
  // Refs
  const nodeRefs = useRef<Record<string, React.MutableRefObject<HTMLElement>>>({});
  const dragRefs = useRef<Record<string, React.MutableRefObject<HTMLDivElement>>>({});
  const rectRefs = useRef<Record<string, React.MutableRefObject<RectType>>>({});
  const imageDataRef = useRef<string>(null);
  const wrapperRef = useRef(null);
  const timeoutRef = useRef(null);
  const nodesToBeRenderedRef = useRef<Record<string, boolean>>({});

  const [isAnimating, setIsAnimating] = useState(true);
  const animationTimeoutRef = useRef(null);
  const activeAnimationRef = useRef({
    changeBlocks: {
      add: null,
      groupRect: {
        animate: null,
        initial: null,
      },
      remove: null,
    },
    initial: null,
    slide: null,
    zoomIn: null,
    zoomOut: null,
  });
  const animationProgress = useMotionValue(0);
  const animationInitialProgress = useMotionValue(0);
  const animationChangeBlocksProgress = useMotionValue(0);

  const phaseRef = useRef(0);
  const controllersRef = useRef<Record<string, any>>({});
  const controlsForLines = useAnimation();
  const interstitialRef = useRef(null);
  const portalRefs = useRef<Record<string, React.MutableRefObject<HTMLDivElement>>>({});

  const opacityInterstitial = useMotionValue(0);

  const opacityInit = useTransform(() => animationInitialProgress.get());
  const scaleInit = useTransform(() => 0.8 + (0.2 * animationInitialProgress.get()));
  const translateXInit = useTransform(() => 0 * GROUP_NODE_PADDING * (1 - animationInitialProgress.get()));
  const translateYInit = useTransform(() => 0 * GROUP_NODE_PADDING * (1 - animationInitialProgress.get()));

  const scaleExit = useMotionValue(1);
  const opacityExit = useMotionValue(1);
  const opacityEnter = useMotionValue(0);
  const scaleEnter = useMotionValue(0);

  const exitOriginX = useRef(0);
  const exitOriginY = useRef(0);

  const translateXExit = useMotionValue(0);
  const translateYExit = useMotionValue(0);
  const translateXEnter = useMotionValue(0);
  const translateYEnter = useMotionValue(0);

  const heightGroupChange = useTransform(() => {
    const val0 = activeAnimationRef.current.changeBlocks.groupRect.initial?.height;
    if (activeAnimationRef.current.changeBlocks.groupRect.animate) {
      const val1 = activeAnimationRef.current.changeBlocks.groupRect.animate?.height;
      return val0 + ((val1 - val0) * animationChangeBlocksProgress.get());
    }
    return val0;
  });

  const translateXGroupChange = useTransform(() => {
    const val0 = activeAnimationRef.current.changeBlocks.groupRect.initial?.left;
    if ((val0 ?? false)) return 0;

    if (activeAnimationRef.current.changeBlocks.groupRect.animate) {
      const val1 = activeAnimationRef.current.changeBlocks.groupRect.animate?.left;
      // return val0 + ((val1 - val0) * animationChangeBlocksProgress.get());
      return (val1 - val0) * (1 - animationChangeBlocksProgress.get());
    }
    return val0;
  });
  const translateYGroupChange = useTransform(() => {
    const val0 = activeAnimationRef.current.changeBlocks.groupRect.initial?.top;
    if ((val0 ?? false)) return 0;

    if (activeAnimationRef.current.changeBlocks.groupRect.animate) {
      const val1 = activeAnimationRef.current.changeBlocks.groupRect.animate?.top;
      // return val0 + ((val1 - val0) * animationChangeBlocksProgress.get());
      return (val1 - val0) * (1 - animationChangeBlocksProgress.get());
    }
    return val0;
  });
  const widthGroupChange = useTransform(() => {
    const val0 = activeAnimationRef.current.changeBlocks.groupRect.initial?.width;
    if (activeAnimationRef.current.changeBlocks.groupRect.animate) {
      const val1 = activeAnimationRef.current.changeBlocks.groupRect.animate?.width;
      return val0 + ((val1 - val0) * animationChangeBlocksProgress.get());
    }
    return val0;
  });

  const { dispatchAppEvent } = useAppEventsHandler({ executionFramework: framework, pipeline });

  // console.log(
  //   [l0, t0, w0, h0],
  //   [loff, toff, woff, hoff],
  //   [rect?.left, rect?.top, rect?.width, rect?.height],
  // );

  // heightGroupChange.set(h0 + (latest * hoff));
  // widthGroupChange.set(w0 + (latest * woff));
  // leftGroupChange.set(l0 + (latest * loff));
  // topGroupChange.set(t0 + (latest * toff));

  const opacityBlockChange = useMotionValue(0);
  const scaleBlockChange = useMotionValue(0);
  const translateXBlockChange = useMotionValue(0);
  const translateYBlockChange = useMotionValue(0);

  const scopeEnter = useRef(null);
  const scopeExit = useRef(null);

  // Settings
  const [headerData, setHeaderData] = useState<any>(null);
  function defaultLayoutConfig(override?: Partial<LayoutConfigType>) {
    return {
      containerRef,
      direction: LayoutConfigDirectionEnum.VERTICAL,
      display: LayoutDisplayEnum.SIMPLE,
      gap: { column: 40, row: 40 },
      origin: LayoutConfigDirectionOriginEnum.LEFT,
      rectTransformations: null,
      style: LayoutStyleEnum.WAVE,
      viewportRef: canvasRef,
      ...override,
    };
  }
  const layoutConfigsRef = useRef<LayoutConfigType[]>([
    defaultLayoutConfig({
      childrenLayout: defaultLayoutConfig({
        direction: LayoutConfigDirectionEnum.HORIZONTAL,
        display: LayoutDisplayEnum.SIMPLE,
        style: LayoutStyleEnum.WAVE,
      }),
      direction: LayoutConfigDirectionEnum.HORIZONTAL,
      style: LayoutStyleEnum.WAVE,
    }),
    defaultLayoutConfig({
      childrenLayout: defaultLayoutConfig({
        direction: LayoutConfigDirectionEnum.HORIZONTAL,
        display: LayoutDisplayEnum.DETAILED,
        options: { amplitude: 20, wavelength: 10 },
        style: LayoutStyleEnum.WAVE,
      }),
      direction: LayoutConfigDirectionEnum.VERTICAL,
      display: LayoutDisplayEnum.DETAILED,
      style: LayoutStyleEnum.TREE,
    }),
    defaultLayoutConfig({
      childrenLayout: defaultLayoutConfig({
        direction: LayoutConfigDirectionEnum.VERTICAL,
        display: LayoutDisplayEnum.DETAILED,
        grid: {
          columns: 5,
        },
        style: LayoutStyleEnum.TREE,
        styleOptions: {
          rectTransformations: [
            {
              options: () => ({
                layout: {
                  direction: LayoutConfigDirectionEnum.HORIZONTAL,
                  gap: { column: 40, row: 40 },
                  options: { amplitude: 200, wavelength: 100 },
                },
              }),
              type: TransformRectTypeEnum.LAYOUT_WAVE,
            },
          ],
        },
      }),
      direction: LayoutConfigDirectionEnum.VERTICAL,
      display: LayoutDisplayEnum.DETAILED,
      style: LayoutStyleEnum.TREE,
    }),
  ]);

  // Immutable store
  const selectedGroupsRef = useRef<MenuGroupType[]>(null);
  const blocksByGroupRef = useRef<BlocksByGroupType>(null);
  const blockMappingRef = useRef<BlockMappingType>(null);
  const groupMappingRef = useRef<GroupMappingType>(null);
  const groupsByLevelRef = useRef<GroupLevelType>(null);
  const blocksRef = useRef<BlockType[]>(null);
  const groupsRef = useRef<FrameworkType[]>(null);
  const appNodeRefs = useRef<Record<string, {
    render: (ref?: React.RefObject<HTMLDivElement>) => void;
  }>>({});
  const outputNodeRefs = useRef<Record<string, {
    render: (node: OutputNodeType, ref?: React.RefObject<HTMLDivElement>) => void;
  }>>({});
  // This is the one that gets updates; rectRefs keeps a running list of all rects.
  const rectsMappingRef = useRef<Record<string, RectType>>({});

  // State store
  const [defaultGroups, setDefaultGroups] = useState<any>(null);
  const [models, setModels] = useState<ModelsType>(null);
  const [appNodes, setAppNodes] = useState<Record<string, Record<string, AppNodeType>>>({});
  const [outputNodes, setOutputNodes] = useState<Record<string, OutputNodeType>>({});
  const [rectsMapping, setRectsMapping] = useState<Record<string, RectType>>({});
  const [renderer, setRenderer] = useState<React.ReactNode>(null);

  function getCurrentGroup() {
    const groups = selectedGroupsRef?.current ?? [];
    return groupMappingRef.current?.[groups?.[groups?.length - 1]?.uuid];
  }

  function renderNodeData(
    block: PipelineExecutionFrameworkBlockType & BlockType,
    type: ItemTypeEnum,
    index: number,
  ): ShadowNodeType {
    let nodeRef = nodeRefs.current[block.uuid];
    if (!nodeRef) {
      nodeRef = createRef();
      nodeRefs.current[block.uuid] = nodeRef;
    }
    const node = {
      block,
      id: block.uuid,
      type,
    };

    return {
      component: (
        <BlockNodeV2
          block={block as any}
          index={index}
          key={block.uuid}
          node={node as NodeType}
          ref={nodeRef}
          showApp={(
            appConfig: AppConfigType,
            render: (ref?: React.RefObject<HTMLDivElement>) => void,
            onCloseRef: React.MutableRefObject<() => void>,
          ) => {
            const appNode = buildAppNode(node as NodeType, appConfig);
            if (!rectRefs.current[appNode.id]) {
              rectRefs.current[appNode.id] = createRef();
            }

            onCloseRef.current = () => {
              delete appNodeRefs.current[block.uuid];
              setAppNodes(prev => {
                delete prev[block.uuid]?.[appNode.id];
                return prev;
              });
            };

            appNodeRefs.current[block.uuid] ||= { render: null };
            appNodeRefs.current[block.uuid].render = render;

            setAppNodes(prev => {
              const d = {
                ...prev,
                [block.uuid]: {
                  ...(prev[block.uuid] ?? {}),
                  [appNode.id]: appNode,
                },
              };

              return d;
            });
          }}
          showOutput={(
            channel: string,
            render: (
              outputNode: OutputNodeType,
              mountRef: React.MutableRefObject<HTMLDivElement>,
            ) => void,
            onCloseRef: React.MutableRefObject<() => void>,
          ) => {
            const outputNode = buildOutputNode(node as NodeType, block, { uuid: channel });
            if (!rectRefs.current[outputNode.id]) {
              rectRefs.current[outputNode.id] = createRef();
            }

            onCloseRef.current = () => {
              delete outputNodeRefs.current[block.uuid];
              setOutputNodes(prev => {
                delete prev[block.uuid];
                return prev;
              });
            };

            outputNodeRefs.current[block.uuid] ||= { render: null };
            outputNodeRefs.current[block.uuid].render = render;

            setOutputNodes(prev => ({
              ...prev,
              [block.uuid]: outputNode,
            }));
          }}
        />
      ),
      data: {
        node,
      },
      id: block.uuid,
      onCapture: (_node: ShadowNodeType, _data: any, element: HTMLElement) => {
        element.classList.add('captured');
      },
      ref: nodeRef,
      shouldCapture: (_node: ShadowNodeType, element: HTMLElement) => {
        const valid = !rectsMappingRef.current?.[block.uuid];
        // console.log('shouldCapture', block.uuid, valid);
        return valid;
      },
      targetRef: (node: ShadowNodeType) => dragRefs.current[node.id],
      waitUntil: (node: ShadowNodeType) => dragRefs.current?.[node.id]?.current !== null,
    };
  }

  function buildSelectedGroupRect(uuid: string, rects?: Record<string, RectType>) {
    const group = groupMappingRef?.current?.[uuid];
    const childrenInGroup = indexBy(group?.children ?? [], c => c.uuid);
    const blocksInGroup = blocksByGroupRef?.current?.[uuid] ?? {};
    const rectsInGroup = getSelectedGroupRects(uuid, rects);

    const upstreams = [];
    group?.upstream_blocks?.forEach(up => {
      upstreams.push({
        ...(rects?.[up] ?? {}),
        id: up,
      });
    });

    rectsInGroup?.forEach(r => {
      (r.upstream ?? [])?.forEach(rup => {
        // Don’t add its own children as an upstream.
        if (!childrenInGroup?.[rup.id]) {
          upstreams.push(rup);
        }
      });
    });

    const groupRect = {
      ...calculateBoundingBox(rectsInGroup),
      block: group,
      id: group?.uuid,
      items: rectsInGroup,
      type: ItemTypeEnum.NODE,
      upstream: unique(
        upstreams ?? [],
        r => r.id,
      )?.filter(up => !blocksInGroup?.[up.id]),
    };

    const yoff = BADGE_HEIGHT + PADDING_VERTICAL;
    groupRect.left -= GROUP_NODE_PADDING;
    groupRect.top -= GROUP_NODE_PADDING + yoff;
    groupRect.width += GROUP_NODE_PADDING * 2;
    groupRect.height += (GROUP_NODE_PADDING * 2) + yoff;

    return groupRect;
  }

  function getSelectedGroupRectFromRefs(rects?: Record<string, RectType>) {
    if (!shouldRenderSelectedGroupSelection()) return;

    const group = getCurrentGroup();
    const rect = buildSelectedGroupRect(group?.uuid, rects ?? rectsMappingRef?.current);

    return {
      ...rect,
      ...(rectsMappingRef?.current?.[group?.id] ?? {}),
    };
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const selectedGroupRect = useMemo(() => getSelectedGroupRectFromRefs(rectsMapping), [rectsMapping]);

  function handleAnimateChangeBlocks(bnew: BlockType[], bdel: BlockType[]) {
    // New blocks:
    // 1. Pre-render their nodes.
    // 2. Get their dimensions.
    // 3. Recalculate the layout.
    // 4. Animate the layout position change.
    // 5. Animate all the blocks in the current group.
    // 6. Animate the new block’s appearance using scale and opacity; or translate Y; use stagger
    // https://www.framer.com/motion/stagger/
    // scale: [1, 2, 2, 1, 1],
    // rotate: [0, 0, 270, 270, 0],
    // borderRadius: ["20%", "20%", "50%", "50%", "20%"],

    setIsAnimating(true);

    const clones = {};
    (bdel ?? [])?.forEach(block => {
      const clone = dragRefs.current?.[block.uuid]?.current?.firstChild.cloneNode(true);
      if (clone) {
        clones[block.uuid] = clone;
      }
      scopeEnter.current.appendChild(clone);
    });

    const groupRect = deepCopy(getSelectedGroupRectFromRefs());
    activeAnimationRef.current.changeBlocks.groupRect = {
      animate: null,
      initial: groupRect,
    };

    opacityBlockChange.set(0);
    scaleBlockChange.set(0);
    translateXBlockChange.set(0);
    translateYBlockChange.set(0);

    animationChangeBlocksProgress.set(0);
    animate(animationChangeBlocksProgress, 1, {
      duration: CHANGE_BLOCKS_ANIMATION_DURATION,
      onUpdate: (latest) => {
        const {
          ready,
          rect,
          x,
          y,
        } = isReadyToAnimateEnterSequences(latest);

        if (ready) {
          if (!activeAnimationRef.current.changeBlocks.groupRect.animate) {
            activeAnimationRef.current.changeBlocks.add = bnew;
            activeAnimationRef.current.changeBlocks.remove = clones;
            activeAnimationRef.current.changeBlocks.groupRect.animate = rect;

            const controls = controllersRef?.current?.[groupRect.id];
            controls?.set({
              translateX: rect?.left - groupRect.left,
              translateY: rect?.top - groupRect.top,
            });
            controlsForLines.start(() => ({
              transition: {
                duration: CHANGE_BLOCKS_ANIMATION_DURATION * latest,
              },
              translateX: 0,
              translateY: 0,
            }));
          }

          // (bnew ?? [])?.forEach(block => {
          //   const brect = rectsMappingRef.current[block.uuid];
          //   const ctrls = controllersRef.current[block.uuid];
          //   if (!ctrls) return;

          //   ctrls.set({
          //     opacity: latest,
          //     scale: latest,
          //     x: 100 * (1 - latest),
          //     y: 100 * (1 - latest),
          //   });
          // });

          // Object.entries(clones ?? {})?.forEach(([buuid, clone]) => {
          //   // const brect = rectsMappingRef.current[block.uuid];
          //   // const ctrls = controllersRef.current[block.uuid];
          //   // if (!ctrls) return;

          //   clone.style.opacity = `${1 - latest}`;
          //   clone.style.transform = `scale(${1 - latest}) translate(${100 * latest}px, ${100 * latest}px)`;
          // });
        }

        if (latest >= 1) {
          Object.values(clones ?? {}).forEach(clone => clone && clone?.remove());
          animationTimeoutRef.current = setTimeout(() => {
            setIsAnimating(false);
          }, CHANGE_BLOCKS_ANIMATION_DURATION);
        }
      },
    });
  }

  function handleLineTransitions() {
    controlsForLines.start(({
      index,
      isOutput,
    }) => ({
      ease: EASING,
      opacity: 1,
      pathLength: 1,
      transition: {
        delay: (index * ANIMATION_DURATION_LINES) + (isOutput ? 1 : 0.5),
        duration: isOutput ? 0.1 : ANIMATION_DURATION_LINES * ((100 - index) / 100),
      },
    }));
  }

  function resetLineTransitions() {
    controlsForLines.set({ opacity: 0, pathLength: 0 });
  }

  function handleInitialTransition(
    currentGroupUUID: string,
    rectsMap: Record<string, RectType>,
  ) {
    const nextGroupRectCur = rectsMap?.[currentGroupUUID];
    const xorigin = (nextGroupRectCur?.left ?? 0);
    const yorigin = (nextGroupRectCur?.top ?? 0);
    exitOriginX.current = xorigin;
    exitOriginY.current = yorigin;
    scopeEnter.current.style.transformOrigin = `${xorigin}px ${yorigin}px`;

    resetLineTransitions();

    animationInitialProgress.set(0);
    animate(animationInitialProgress, 1, {
      delay: 1,
      duration: INITIAL_ANIMATION_DURATION,
      onUpdate: (latest) => {
        if (latest >= 1) {
          scopeEnter.current.style.opacity = '';
          scopeEnter.current.style.transform = '';
          scopeEnter.current.style.transformOrigin = '';

          animationTimeoutRef.current = setTimeout(() => {
            setIsAnimating(false);
          }, INITIAL_ANIMATION_DURATION);

          handleLineTransitions();
        }
      },
    });
  }

  function isReadyToAnimateEnterSequences(latest: number) {
    const group = getCurrentGroup();

    const rect1 = rectsMapping?.[group?.uuid];
    const rect2 = rectsMappingRef?.current?.[group?.uuid];
    const groupRect = getSelectedGroupRectFromRefs();

    const rectpri = [
      groupRect,
      rect1,
      rect2,
    ];
    const rectuse = rectpri
      .filter(Boolean)
      .find(r => ['height', 'left', 'top', 'width'].every(k => (r?.[k] ?? false) !== false));

    let x = null;
    let y = null;
    if (rectuse) {
      const { left, top } = rectuse;

      x = (exitOriginX.current ?? 0) - left;
      y = (exitOriginY.current ?? 0) - top;
    }

    const itemIDs =
      (selectedGroupRect?.items?.map(i => i.id) ?? []).concat((groupRect ?? []) as any[]);
    const required =
      uniqueArray(Object.keys(nodesToBeRenderedRef.current ?? {}).concat(itemIDs));

    const rectsCalculated = {
      ...(rectsMappingRef.current),
      ...(groupRect ? { [groupRect.id]: groupRect } : {}),
    };
    const progress = uniqueArray(Object.keys(rectsCalculated ?? {}).concat(itemIDs));
    const ready = (x ?? false) && (y ?? false) && progress?.length >= required?.length;

    return {
      ready,
      rect: rectuse,
      x,
      y,
    };
  }

  function handleMotionValueChange(latest: number, opts?: {
    initial?: boolean;
    transformOrigin?: boolean;
    zoomOut?: boolean;
  }) {
    const { initial, transformOrigin, zoomOut } = opts ?? {};

    const {
      ready,
      rect,
      x,
      y,
    } = isReadyToAnimateEnterSequences(latest);

    if (rect) {
      const { left, top } = rect;

      let val = 0;
      if (zoomOut) {
        const scaleFactor = 0.4;
        const factor2 = latest < ENTER_ANIMATION_START_THRESHOLD ? 0 : 2.1;
        // Initial value: 1.6
        // latest: 0.6
        // scaleExit: 1 - 0.24 = 0.76
        // factor: 1.6/0.76 = 2.1 down to 1.67
        // 2.1 - (0.43 * (latest - 0.6))
        const scalev = (
          factor2 - (
            0.43
            * ((latest - ENTER_ANIMATION_START_THRESHOLD) / scaleFactor))
        ) * scaleExit.get();
        val = scalev;
      } else {
        const factor = latest < ENTER_ANIMATION_START_THRESHOLD ? 0 : 0.5;
        val = scaleExit.get() * factor;
      }

      if (transformOrigin) {
        if (!initial) {
          translateXEnter.set(x * (1 - val));
          translateYEnter.set(y * (1 - val));
        }

        scopeEnter.current.style.transformOrigin = `${left ?? 0}px ${top ?? 0}px`;
      }
    }

    // console.log(
    //   `[transition] entering: ${group?.uuid}:`,
    //   scopeEnter.current.style.transformOrigin,
    // );

    // console.log(
    //   `Ready: ${ready}`,
    //   'readyToEnter', required?.length,
    //   required,
    //   nodesToBeRenderedRef.current,
    //   'rectsMappingRef', progress?.length,
    //   progress,
    // );

    if (ready) {
      wrapperRef.current.classList.remove(stylesPipelineBuilder.waiting);
    }
  }

  function handleAnimationSlide(latest: number, {
    xExit,
  }) {
    // If the sibling teleport block is on the right of the current group:
    // Exit: slide left, opacity
    // Enter: slide right, opacity
    opacityExit.set(1 - latest);
    translateXExit.set(latest * xExit * -1);

    // If the sibling teleport block is on the left of the current group:
    // Exit: slide right, opacity
    // Enter: slide left, opacity
    const factor1 = latest < ENTER_ANIMATION_START_THRESHOLD ? 0 : 2.5;
    opacityEnter.set((latest - ENTER_ANIMATION_START_THRESHOLD) * factor1);

    const groupRect = getSelectedGroupRectFromRefs();
    if ((groupRect?.width ?? 0) > 0) {
      translateXEnter.set((1 - latest) * (xExit < 0 ? -1 : 1) * (groupRect?.width ?? 0));
    }

    translateYEnter.set(0);

    opacityInterstitial.set(Math.max(
      0,
      Math.min(1,
        (latest > 0.5 ? 1 - latest : latest) * 3,
      ),
    ));

    handleMotionValueChange(latest);
  }

  useMotionValueEvent(
    animationInitialProgress, 'change',
    latest => handleMotionValueChange(latest, { initial: true, transformOrigin: true }),
  );

  function handleAnimationZoomIn(latest: number) {
    // Exit:Animate zooming in and opacity
    // If rect doesn’t exist in the canvas, then zoom in on the center origin.
    scaleExit.set(1 + latest); // 1 -> 2
    opacityExit.set(1 - latest); // 1 -> 0

    // Enter: scale up the next set, opacity, use the new group as the origin.
    const factor1 = latest < ENTER_ANIMATION_START_THRESHOLD ? 0 : 2.5;
    opacityEnter.set((latest - ENTER_ANIMATION_START_THRESHOLD) * factor1); // 1st value: 0

    const factor2 = latest < ENTER_ANIMATION_START_THRESHOLD ? 0 : 0.5;
    scaleEnter.set(scaleExit.get() * factor2); // 1st value: 1.6 * 0.5 = 0.8

    handleMotionValueChange(latest, { transformOrigin: true });
  }

  function handleAnimationZoomOut(latest: number) {
    const scaleFactor = 0.4;
    // Exit: Animate zooming out and opacity
    scaleExit.set(1 - (latest * scaleFactor)); // 1 -> 0.6; (1 - 0.8) * 2 = 0.4, 1 - 0.4 = 0.6
    opacityExit.set(1 - latest); // 1 -> 0

    // Enter: Animate the next set of nodes by scaling down but use the new selected group
    // as the origin.
    // Enter: scale up the next set, opacity, use the new group as the origin.

    // 0 -> 1
    const factor1 = latest < ENTER_ANIMATION_START_THRESHOLD ? 0 : 2.5;
    opacityEnter.set((latest - ENTER_ANIMATION_START_THRESHOLD) * factor1);

    // 2 -> 1
    const factor2 = latest < ENTER_ANIMATION_START_THRESHOLD ? 0 : 2.1;
    // Initial value: 1.6
    // latest: 0.6
    // scaleExit: 1 - 0.24 = 0.76
    // factor: 1.6/0.76 = 2.1 down to 1.67
    // 2.1 - (0.43 * (latest - 0.6))
    const scalev = (
      factor2 - (
        0.43
        * ((latest - ENTER_ANIMATION_START_THRESHOLD) / scaleFactor))
    ) * scaleExit.get();
    scaleEnter.set(scalev);

    handleMotionValueChange(latest, {
      transformOrigin: true,
      zoomOut: true,
    });
  }

  function handleTransitions(
    currentGroupUUID: string,
    rectsMap: Record<string, RectType>,
    groupsNext: MenuGroupType[],
    opts?: {
      group?: FrameworkType;
      groupRect: RectType;
      groups: MenuGroupType[];
      parent: FrameworkType;
      siblings: FrameworkType[];
    },
  ) {
    const {
      group: groupPrev,
      groupRect: groupRectPrev,
      groups: groupsPrev,
      parent: parentPrev,
      siblings: siblingsPrev,
    } = opts;
    const prevCount = groupsPrev?.length ?? 0;
    const nextCount = groupsNext?.length ?? 0;
    const groupNext = getCurrentGroup();
    const parentNext = getParentGroup();

    const menuGroupPrev = groupsPrev?.find(g => g.uuid === groupPrev?.uuid);
    const menuGroupNext = groupsNext?.find(g => g.uuid === groupNext?.uuid);

    const groupNextRectCur = rectsMap?.[currentGroupUUID];

    animationProgress.set(0);
    opacityInterstitial.set(0);

    opacityExit.set(1);
    scaleExit.set(1);
    translateXExit.set(0);
    translateYExit.set(0);

    resetLineTransitions();
    setIsAnimating(true);

    nodesToBeRenderedRef.current = {};

    const clone = scopeEnter.current.firstChild.cloneNode(true);
    scopeExit.current.appendChild(clone);

    scopeEnter.current.style.transformOrigin = '0px 0px';

    wrapperRef.current.classList.add(stylesPipelineBuilder.waiting);

    scopeEnter.current.classList.add(stylesPipelineBuilder.entering);

    scopeExit.current.classList.add(stylesPipelineBuilder.exiting);
    scopeExit.current.classList.remove(stylesPipelineBuilder.idle);

    let animationHandler = null;
    const animationOptions = {
      group: null,
      xExit: 0,
    };

    if (groupPrev
      && prevCount === nextCount
      && ((!parentNext && !parentPrev) || (parentNext?.uuid !== parentPrev?.uuid))
    ) {
      // Switching between different groups with different parents but on the same level.
      // Animate sliding the current view left or right and opacity
      animationHandler = handleAnimationSlide;

      let right = null;
      if (parentNext && parentPrev) {
        const menuGroupParentPrev = groupsPrev?.find(g => g.uuid === parentPrev?.uuid);
        const menuGroupParentNext = groupsNext?.find(g => g.uuid === parentNext?.uuid);
        right = menuGroupParentNext?.index > menuGroupParentPrev?.index;
      } else {
        right = menuGroupNext?.index > menuGroupPrev?.index;
      }

      const xExit = (groupRectPrev?.width ?? 0) * (right ? 1 : -1);

      interstitialRef.current.classList.add(stylesPipelineBuilder.show);
      interstitialRef.current.classList.remove(stylesPipelineBuilder.left);
      interstitialRef.current.classList.remove(stylesPipelineBuilder.right);
      interstitialRef.current.classList.add(stylesPipelineBuilder[right ? 'right' : 'left']);
      interstitialRef.current.classList.remove(stylesPipelineBuilder.hide);

      opacityEnter.set(0);
      scaleEnter.set(1);
      translateXEnter.set(0);
      translateYEnter.set(0);

      animationOptions.xExit = xExit;
    } else if (prevCount > nextCount) {
      // Going up to the parent: leaving (opposite of entering a child group)
      animationHandler = handleAnimationZoomOut;

      opacityEnter.set(0);
      scaleEnter.set(2);
      translateXEnter.set(0);
      translateYEnter.set(0);

      const rectPrev = groupRectPrev ?? rectsMap?.[groupPrev?.uuid];
      const xorigin = rectPrev?.left ?? 0;
      const yorigin = rectPrev?.top ?? 0;
      exitOriginX.current = xorigin;
      exitOriginY.current = yorigin;
      scopeExit.current.style.transformOrigin = `${xorigin}px ${yorigin}px`;
    } else {
      // Going into a child: entering (opposite of leaving a child group)
      animationHandler = handleAnimationZoomIn;

      opacityEnter.set(0);
      scaleEnter.set(0);
      translateXEnter.set(0);
      translateYEnter.set(0);

      const xorigin = (groupNextRectCur?.left ?? 0);
      const yorigin = (groupNextRectCur?.top ?? 0);
      exitOriginX.current = xorigin;
      exitOriginY.current = yorigin;
      scopeExit.current.style.transformOrigin = `${xorigin}px ${yorigin}px`;
    }

    // console.log(
    //   `[transition] start: ${currentGroupUUID}`,
    //   scopeExit.current.style.transformOrigin,
    // );

    animate(animationProgress, 1, {
      duration: ANIMATION_DURATION,
      onUpdate: (latest) => {
        animationHandler(latest, animationOptions);

        if (latest >= 1) {
          clone.remove();

          scopeEnter.current.classList.remove(stylesPipelineBuilder.entering);
          scopeEnter.current.style.opacity = '';
          scopeEnter.current.style.transform = '';
          scopeEnter.current.style.transformOrigin = '';

          scopeExit.current.classList.add(stylesPipelineBuilder.idle);
          scopeExit.current.classList.remove(stylesPipelineBuilder.exiting);

          wrapperRef.current.classList.remove(stylesPipelineBuilder.waiting);

          interstitialRef.current.classList.add(stylesPipelineBuilder.hide);
          interstitialRef.current.classList.remove(stylesPipelineBuilder.show);
          interstitialRef.current.classList.remove(stylesPipelineBuilder.left);
          interstitialRef.current.classList.remove(stylesPipelineBuilder.right);

          animationTimeoutRef.current = setTimeout(() => {
            setIsAnimating(false);
          }, ANIMATION_DURATION);

          handleLineTransitions();
        }
      },
    });
  }

  function getParentGroup(): FrameworkType {
    if (selectedGroupsRef?.current?.length < 2) return;

    const menuGroup = selectedGroupsRef?.current?.[selectedGroupsRef?.current?.length - 2];
    if (!menuGroup) return;

    return groupMappingRef.current?.[menuGroup.uuid];
  }

  function getCurrentGroupSiblings(): FrameworkType[] {
    const group = getCurrentGroup();
    const parentGroup = getParentGroup();

    if (!parentGroup) return;

    return groupMappingRef.current?.[parentGroup?.uuid]?.children?.filter(
      g => g.uuid !== group?.uuid);
  }

  const setSelectedGroupsRef = useRef((groupsArg: MenuGroupType[]) => {
    const prevGroup = deepCopy(getCurrentGroup());
    const prevParent = deepCopy(getParentGroup());
    const prevSiblings = deepCopyArray(getCurrentGroupSiblings());
    const prevGroups = deepCopyArray(selectedGroupsRef.current ?? []);
    const prevGroupRect = deepCopy(getSelectedGroupRectFromRefs());

    selectedGroupsRef.current = groupsArg;

    renderLayoutUpdates(() => {
      const currentGroup = getCurrentGroup();

      if (phaseRef.current === 0) {
        handleInitialTransition(
          currentGroup?.uuid,
          rectsMappingRef.current,
        );
      } else {
        handleTransitions(
          currentGroup?.uuid,
          rectsMappingRef.current,
          selectedGroupsRef.current,
          {
            group: prevGroup,
            groupRect: prevGroupRect,
            groups: prevGroups,
            parent: prevParent,
            siblings: prevSiblings,
          },
        );

        nodesToBeRenderedRef.current = {};
        (blocksRef.current ?? []).concat(groupsRef.current ?? [])?.forEach(b => {
          nodesToBeRenderedRef.current[b.uuid] = false;
        });

        if (shouldRenderSelectedGroupNode()) {
          nodesToBeRenderedRef.current[currentGroup?.uuid] = false;
        }
      }
    });

    phaseRef.current += 1;
  });

  function setSelectedGroup(block: FrameworkType) {
    // Invoked from within a node component and not from the header; need to update header.
    const groups = [...(selectedGroupsRef.current ?? [])].map(g => ({
      ...g,
      ...groupMappingRef.current?.[g.uuid],
    }));
    const parentIndex =
      groups?.findIndex(g => !!(g as any).children?.find(i => i.uuid === block?.uuid));

    let index = null;
    let parent = null;
    let groups2 = [...groups];
    if (parentIndex >= 0) {
      groups2 = groups2.slice(0, parentIndex + 1);
      parent = groups[parentIndex];
      index = parent.children.findIndex(i => i.uuid === block?.uuid);
    }

    const groupsNext = [
      ...groups2,
      {
        groups: parent ? [parent] : [],
        index,
        level: groups2?.length ?? 0,
        uuid: block?.uuid,
      },
    ].filter(g => g?.uuid)?.map(g => ({
      ...g,
      ...groupMappingRef.current?.[g.uuid],
    })) as MenuGroupType[];
    setSelectedGroupsRef.current(groupsNext);

    dispatchAppEvent(CustomAppEventEnum.UPDATE_HEADER_NAVIGATION, {
      options: {
        kwargs: {
          defaultGroups: groupsNext,
        },
      },
    });
  }

  function renderLayoutUpdates(callbackBeforeUpdateState?: () => void) {
    const currentGroup = getCurrentGroup();
    const siblingGroups = getCurrentGroupSiblings();

    const blocks =
      (Object.values(blocksByGroupRef.current?.[currentGroup?.uuid] ?? {}) ?? []) as BlockType[];

    const groupsForEmptySelection = [];
    if (!currentGroup) {
      // No group selected: show top level pipelines (e.g. data preparation, inference)
      const defaultSelectionGroups = groupsByLevelRef.current?.[0];
      selectedGroupsRef.current = [
        {
          items: defaultSelectionGroups,
          level: 0,
        },
      ];
      groupsForEmptySelection.push(...defaultSelectionGroups);
    }

    const groups = (currentGroup?.children ?? []).concat(
      [
        // Should we show the parent group as well?
        // parentGroup,
        // Add the current group so we can show groupings within it. This is handled manually.
        // ------------------------------------------------------------------------------------------
        ...(shouldRenderSelectedGroupSelection() ? [] : [currentGroup]),
        ...(siblingGroups ?? []),
        ...(groupsForEmptySelection ?? []),
      ].reduce((acc, group2) => group2 ? acc.concat(
        groupMappingRef.current?.[group2?.uuid],
      ) : acc, []),
    );

    blocksRef.current = blocks;
    groupsRef.current = groups;

    callbackBeforeUpdateState && callbackBeforeUpdateState?.();

    // Need to clear this our shouldCapture in ShadowNodeType won’t execute.
    rectsMappingRef.current = {};

    if (blocks?.length > 0 || groups?.length > 0) {
      const shadowNodes = [];

      Object.entries({
        [ItemTypeEnum.BLOCK]: blocks,
        [ItemTypeEnum.NODE]: groups,
      }).forEach(([type, models]: [ItemTypeEnum, (BlockType | FrameworkType)[]]) =>
        shadowNodes.push(...models?.map((block: BlockType | FrameworkType, index: number) =>
          renderNodeData(block as any, type, index)) as any,
        ));

      setRenderer(
        <ShadowRenderer
          handleDataCapture={({ data, id }, { rect }) => {
            updateRects({ [id]: { data, rect } });
          }}
          handleNodeTransfer={(node: ShadowNodeType) => {
            nodesToBeRenderedRef.current[node.id] = true;
          }}
          nodes={shadowNodes}
          uuid={getNewUUID(3, 'clock')}
        />,
      );
    }

    setModels((prev: ModelsType) => ({
      ...prev,
      blocks: blocksRef.current,
      groups: groupsRef.current,
    }) as any);
  }

  // Resources
  const [pipeline, setPipeline] = useState<PipelineExecutionFrameworkType>(null);
  const [framework, setFramework] = useState<PipelineExecutionFrameworkType>(null);

  const updateLocalResources = useCallback((pipelineArg: PipelineExecutionFrameworkType) => {
    const { blocksByGroup, blockMapping, groupMapping, groupsByLevel } =
      buildDependencies(framework, pipelineArg);
      blocksByGroupRef.current = blocksByGroup;
      blockMappingRef.current = blockMapping;
      groupMappingRef.current = groupMapping;
      groupsByLevelRef.current = groupsByLevel;
    }, [framework]);

  const pipelineMutants = useMutate({
    id: pipelineUUID,
    idParent: executionFrameworkUUID,
    resource: 'pipelines',
    resourceParent: 'execution_frameworks',
  }, {
    automaticAbort: false,
    handlers: {
      detail: { onSuccess: setPipeline },
      update: {
        onSuccess: (p1, p2) => {
          updateLocalResources(p1);
          setPipeline(p1);

          const b1 = p1?.blocks;
          const b2 = p2?.blocks;

          // console.log('Pipeline updated', b1?.length, b2?.length);
          if (b1?.length ?? 0 !== b2?.length ?? 0) {
            // const b1map = indexBy(b1, b => b.uuid);
            // const b2map = indexBy(b2, b => b.uuid);
            // const bnew = b1.filter(b => !b2map[b.uuid]);
            // const bdel = b2.filter(b => !b1map[b.uuid]);

            renderLayoutUpdates(() => {
              // handleAnimateChangeBlocks(bnew, bdel);
            });
          }
        },
      },
    },
  });

  const frameworkMutants = useMutate({
    id: executionFrameworkUUID,
    resource: 'execution_frameworks',
  }, {
    automaticAbort: false,
    handlers: {
      detail: { onSuccess: setFramework },
    },
  });
  const fileMutants = useMutate({
    resource: 'browser_items',
  });

  // Models
  function shouldRenderSelectedGroupSelection(): boolean {
    const selectedGroup = selectedGroupsRef.current?.[selectedGroupsRef.current?.length - 1];
    const group = groupMappingRef.current?.[selectedGroup?.uuid];
    const blocksInGroup = blocksByGroupRef?.current?.[selectedGroup?.uuid] ?? {};
    const isValidGroup = group
      && ((group?.children?.length ?? 0) > 0 || !isEmptyObject(blocksInGroup ?? {}));
    return !!isValidGroup;
  }

  function updateRects(rectData: Record<string, {
    data: {
      node: {
        type: ItemTypeEnum;
      };
    };
    rect: RectType;
  }>) {
    Object.entries(rectData).forEach(([id, info]) => {
      if (!rectRefs.current[id]) {
        rectRefs.current[id] = createRef();
      }
      const { data, rect } = info;
      rectRefs.current[id].current = {
        height: rect.height,
        left: undefined,
        top: undefined,
        type: data.node.type,
        width: rect.width,
      };
    });

    const updateState = () => {
      const blocks = [];
      blocksRef?.current?.forEach(g => {
        blocks.push({ ...g });
      });
      const groups = [];
      groupsRef?.current?.forEach(g => {
        groups.push({ ...g });
      });

      const layoutConfig = layoutConfigsRef.current?.[selectedGroupsRef.current?.length - 1];
      const selectedGroup = selectedGroupsRef.current?.[selectedGroupsRef.current?.length - 1];
      const group = groupMappingRef.current?.[selectedGroup?.uuid];
      const blocksInGroup = blocksByGroupRef?.current?.[selectedGroup?.uuid] ?? {};
      const isValidGroup = shouldRenderSelectedGroupSelection();

      const blockNodes = [];
      Object.entries(rectRefs.current ?? {}).forEach(([id, rectRef]) => {
        const rect = rectRef.current;
        const { type } = rect;

        let block = null;
        if (ItemTypeEnum.BLOCK === type) {
          block = blockMappingRef.current?.[id] ?? groupMappingRef.current?.[id];
        } else {
          block = groupMappingRef.current?.[id] ?? blockMappingRef.current?.[id];
        }

        blockNodes.push({
          block,
          node: {
            type: rect.type,
          },
          rect,
        });
      });

      if (isValidGroup) {
        blockNodes.push({
          block: { ...group },
          node: {
            type: ItemTypeEnum.NODE,
          },
          rect: {
            height: 0,
            left: 0,
            top: 0,
            type: ItemTypeEnum.NODE,
            width: 0,
          },
        });
      }

      const blockNodeMapping = indexBy(blockNodes, bn => bn?.block?.uuid);
      const rects1 = hydrateBlockNodeRects(
        (blocks ?? []).concat(groups ?? [])
          .concat(isValidGroup ? [{ ...group }] : [])
          .map(m => blockNodeMapping[m.uuid]),
        blockNodeMapping,
      );

      const rectsmap = indexBy(rects1, r => r?.id);
      const rects = rects1?.map((rect) => {
        const { block } = rect;
        return {
          ...rect,
          // e.g. cleaning’s upstream is map
          // map belongs to group load.
          upstream: rect?.upstream?.reduce((acc, { id }) => {
            const upgroup = groupMappingRef.current?.[id];
            const gs = upgroup?.groups;
            const arr = [];
            const block2 = blockMappingRef.current?.[id];

            // Don’t add the parent as the upstream
            gs?.forEach((guuid) => {
              if (!block?.groups?.includes(guuid) && rectsmap?.[guuid]) {
                arr.push(rectsmap[guuid]);
              }
            });

            // If current block is a block in the current group and the upstream is a block
            // in the same group
            if (blocksInGroup?.[block?.uuid] && blocksInGroup?.[block2?.uuid]) {
              if (rectsmap?.[block2.uuid]) {
                arr.push(rectsmap[block2.uuid]);
              }
            } else if (
              // If upstream is the currently selected block or...
              group?.uuid === id
              // If the upstream is a sibling of the
              // currently selected block, then add it to the upstream.
              || upgroup?.groups?.some?.(guuid => block?.groups?.includes(guuid))
            ) {
              arr.push(rectsmap[id]);
            } else {
              // Look into the group of a sibling to check for the upstream blocks that have no
              // downstream block.
              upgroup?.children?.filter(
                b => block?.children?.some?.(c => b?.downstream_blocks?.includes(c.uuid)),
              )?.forEach(b => {
                if (rectsmap?.[b.uuid]) {
                  arr.push(rectsmap[b.uuid]);
                }
              });
            }

            return acc.concat(arr);
          }, []),
        };
      });

      let rectsUse = rects;
      let groupRect = null;
      if (isValidGroup && layoutConfig?.childrenLayout) {
        const childrenInGroup = indexBy(group?.children ?? [], c => c.uuid);
        const rectsInGroup = rects?.filter(r => blocksInGroup?.[r.id] || childrenInGroup?.[r.id]);

        if (rectsInGroup?.length > 0) {
          const transformations =
            buildRectTransformations({
              disableAlignments: true,
              layoutConfig: layoutConfig?.childrenLayout,
              selectedGroup,
            });

          // console.log(`| start[children]:\n${logMessageForRects(rectsInGroup)}`);
          // console.log(rectsInGroup);
          const tfs = transformRects(rectsInGroup, transformations);
          // console.log(`| end[children]:\n${logMessageForRects(tfs)}`);

          const map = indexBy(tfs ?? [], r => r.id) ?? {};
          groupRect = buildSelectedGroupRect(group?.uuid, map);
          rectsUse = rectsUse?.filter(r => !map?.[r.id] && r.id !== groupRect.id).concat({
            ...rectsmap?.[groupRect.id],
            ...groupRect,
            children: [],
            items: [],
          });
        }
      }

      if ((rectsUse?.length ?? 0) === 0) {
        rectsUse = rects;
      }

      // console.log(`start:\n${logMessageForRects(rectsUse)}`);

      const centerRect = groupRect ?? rectsUse?.find(r => r?.block?.uuid === group?.uuid);

      const transformations = buildRectTransformations({
        centerRect,
        conditionalDirections: (blocks?.length ?? 0) === 0,
        disableAlignments: !!centerRect,
        layoutConfig,
        selectedGroup,
      });
      let tfs = transformRects(rectsUse, transformations);
      // console.log(`end:\n${logMessageForRects(tfs)}`);

      if (groupRect) {
        const grouptf = tfs.find(r => r.id === groupRect.id);
        const diff = getRectDiff(groupRect, grouptf);
        const items = groupRect?.items?.map(r => applyRectDiff(r, diff));
        tfs = tfs.concat(...(items ?? [])).filter(r => r.id !== groupRect.id);
      }
      rectsMappingRef.current = indexBy(tfs, r => r.id);

      if (blocks?.length > 0 || groups?.length > 0) {
        if ((blocks?.length > 0 && blocks?.every(b => (rectsMappingRef.current ?? {})?.[b.uuid]))
          || (groups?.length > 0 && groups?.every(g => (rectsMappingRef.current ?? {})?.[g.uuid]))
        ) {
          setRectsMapping(rectsMappingRef.current);
        }
      }
    };

    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(updateState, 100);
  }

  useEffect(() => {
    if (framework === null && frameworkMutants.detail.isIdle) {
      frameworkMutants.detail.mutate();
    }

    if (pipeline === null && pipelineMutants.detail.isIdle) {
      pipelineMutants.detail.mutate();
    }

    if ((framework ?? false) && (pipeline ?? false)) {
      if ([blocksByGroupRef, blockMappingRef, groupMappingRef, groupsByLevelRef].every(
        r => !r.current,
      )) {
        updateLocalResources(pipeline);
      }

      // [WARNING]: The above needs to run 1st
      if (selectedGroupsRef.current === null) {
        setSelectedGroupsRef.current(getCache([framework.uuid, pipeline.uuid].join(':')));
      }
    }
  }, [framework, frameworkMutants, pipeline, pipelineMutants, updateLocalResources]);

  useEffect(() => {
    if ((framework ?? false) && (pipeline ?? false)) {
      setHeaderData({
        ...(defaultGroups ? { defaultGroups } : {}),
        executionFramework: framework,
        groupsByLevel: groupsByLevelRef.current ?? [],
        handleMenuItemClick: (_event: MouseEvent, groups: MenuGroupType[]) =>
          setSelectedGroupsRef.current(groups),
        pipeline,
      });
    }
  }, [defaultGroups, framework, pipeline]);

  // Cleanup
  useEffect(() => {
    const animationTimeout = animationTimeoutRef.current;
    const timeout = timeoutRef.current;

    return () => {
      clearTimeout(animationTimeout);
      clearTimeout(timeout);
      animationTimeoutRef.current = null;
      timeoutRef.current = null;
    };
  }, []);

  const blocks = useMemo(() => models?.blocks ?? [], [models?.blocks]);
  const groups = useMemo(() => models?.groups ?? [], [models?.groups]);

  function getSelectedGroupRects(
    uuid?: string,
    rects?: Record<string, RectType>,
  ): RectType[] {
    const group = uuid ? groupMappingRef?.current?.[uuid] : getCurrentGroup();
    const childrenInGroup = indexBy(group?.children ?? [], c => c.uuid);
    const blocksInGroup = blocksByGroupRef?.current?.[uuid] ?? {};
    return Object.values(
      rects ?? rectsMappingRef?.current ?? {},
    )?.filter(r => blocksInGroup?.[r.id] || childrenInGroup?.[r.id]);
  }

  function shouldRenderSelectedGroupNode(): boolean {
    const group = getCurrentGroup();
    const rectsInGroup = getSelectedGroupRects(group?.uuid);
    const blocksInGroup = blocksByGroupRef?.current?.[group?.uuid] ?? {};
    return ((rectsInGroup?.length ?? 0) > 0) && (getCurrentGroupSiblings()?.length ?? 0) > 0;
      // && blocksInGroup?.length > 0;
  }

  const selectedGroupNode = useMemo(() => {
    if (!shouldRenderSelectedGroupNode()) return;

    const { block, type } = selectedGroupRect ?? {};
    const node = {
      block: block,
      id: block?.uuid,
      type,
    } as NodeType;

    let dragRef = dragRefs.current[block.uuid];
    if (!dragRef) {
      dragRef = createRef();
      dragRefs.current[block.uuid] = dragRef;
    }

    let nodeRef = nodeRefs.current[block.uuid];
    if (!nodeRef) {
      nodeRef = createRef();
      nodeRefs.current[block.uuid] = nodeRef;
    }

    return (
      <WithOnMount
        key={block?.uuid}
        onMount={() => {
          nodesToBeRenderedRef.current[block.uuid] = true;
        }}
      >
        <DragWrapper
          // draggable={draggable}
          // droppable={droppable}
          // droppableItemTypes={droppableItemTypes}
          // eventHandlers={eventHandlers}
          // handleDrop={handleDrop}
          controllers={controllersRef}
          groupSelection
          // isAnimating={isAnimating}
          item={node}
          rect={selectedGroupRect ?? {
            left: undefined,
            top: undefined,
          }}
          ref={dragRef}
          // style={{
          //   height: heightGroupChange,
          //   translateX: translateXGroupChange,
          //   translateY: translateYGroupChange,
          //   width: widthGroupChange,
          // }}
        >
          <BlockNodeV2
            block={block as any}
            groupSelection
            key={block.uuid}
            node={node as NodeType}
            ref={nodeRef}
          />
        </DragWrapper>
      </WithOnMount>
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAnimating, selectedGroupRect]);

  function handleMouseDown(event: ClientEventType) {
    console.log('handleMouseDown', event);
    const { handle, operationType } = event;

    if (handle) {
      handle?.(event);
    }

    if (EventOperationEnum.DRAG_START !== operationType) {
      setZoomPanDisabled(false);
      setDragEnabled(false);
      setDropEnabled(false);
      containerRef?.current?.classList.remove(stylesPipelineBuilder.dragging);
    }
  }

  function handleContextMenu(
    event: ClientEventType, items?: MenuItemType[], opts?: RenderContextMenuOptions,
  ) {
    if (event.metaKey) return;

    removeContextMenu(event);

    let menuItems = [
      {
        Icon: SearchV2,
        items: [
          {
            Icon: iconProps => <Undo {...iconProps} secondary />,
            onClick: (event: ClientEventType) => {
              event?.preventDefault();
              removeContextMenu(event ?? null);
              transformState?.current?.handleZoom?.current?.((event ?? null) as any, 1);
              startTransition(() => {
                setZoomPanDisabled(false);
              });
            },
            uuid:
              (transformState?.current?.zoom?.current ?? 1) === 1 ? 'Default zoom' : 'Zoom to 100%',
          },
          {
            Icon: ArrowsAdjustingFrameSquare,
            onClick: (event: ClientEventType) => {
              event?.preventDefault();
              removeContextMenu(event ?? null);
              transformState?.current?.handlePanning?.current?.((event ?? null) as any, {
                x: 0,
                y: 0,
              });
              startTransition(() => {
                setZoomPanDisabled(false);
              });
            },
            uuid: 'Reset view',
          },
          {
            Icon: ArrowsPointingInFromAllCorners,
            onClick: (event: ClientEventType) => {
              event.preventDefault();
              removeContextMenu(event);
              transformState?.current?.handlePanning?.current?.((event ?? null) as any, {
                xPercent: 0.5,
                yPercent: 0.5,
              });
              startTransition(() => {
                setZoomPanDisabled(false);
              });
            },
            uuid: 'Center view',
          },
        ],
        uuid: 'View controls',
      },
      { divider: true },
      {
        Icon: TreeWithArrowsDown,
        onClick: (event: ClientEventType) => {
          event?.preventDefault();
          removeContextMenu(event);
          handleSaveAsImage(canvasRef, wrapperRef, rectsMappingRef.current, imageDataRef);
        },
        uuid: 'Save pipeline as image',
      },
    ] as MenuItemType[];

    const { reduceItems } = opts ?? {};
    if (items) {
      if (reduceItems) {
        menuItems = reduceItems(items, menuItems);
      } else {
        menuItems = [...items];
      }
    }

    renderContextMenu(event, menuItems, {
      ...opts,
      handleEscape: (event2) => {
        removeContextMenu(event2 as any);
      },
      rects: {
        bounding: wrapperRef.current.getBoundingClientRect(),
      },
    });
  }

  const portalsMemo = useMemo(() => (blocks ?? [])?.map((block) => {
    const key = `${block.uuid}-portal`;
    const portalRef = portalRefs.current[key] || createRef();
    portalRefs.current[key] = portalRef;

    return <PortalNode id={key} key={key} ref={portalRef} />;
  }), [blocks]);

  const renderNodeComponents = useCallback((mapping) => {
    const arr = [];

    Object.entries(mapping)
      .forEach(([nodeType, items]: [
        ItemTypeEnum,
        (AppNodeType | BlockType | FrameworkType | OutputNodeType)[],
      ]) => {
      items?.forEach((
        item: AppNodeType | BlockType | FrameworkType | OutputNodeType,
        idx: number,
      ) => {
        let itemUUID = (item as any)?.uuid ?? (item as any)?.id;
        const nodeID = (item as any)?.uuid ?? (item as any)?.id;
        let rect = rectsMapping?.[nodeID] ?? {
          left: undefined,
          top: undefined,
        };

        if ([ItemTypeEnum.APP, ItemTypeEnum.OUTPUT].includes(nodeType)) {
          itemUUID = (item as any)?.block?.uuid;
        }

        let dragRef = dragRefs.current[nodeID];
        if (!dragRef) {
          dragRef = createRef();
          dragRefs.current[nodeID] = dragRef;
        }

        if ([ItemTypeEnum.APP, ItemTypeEnum.OUTPUT].includes(nodeType)) {
          const cache = get(`${executionFrameworkUUID}:${pipelineUUID}`) ?? {};
          if (nodeID in rectsMappingRef?.current) {
            rect = rectsMappingRef.current[nodeID];
          } else if (nodeID in cache) {
            rect = cache[nodeID];
          } else {
            const rectg = getSelectedGroupRectFromRefs();
            const bbox = canvasRef?.current?.getBoundingClientRect();

            const box = {
              height: bbox?.height - PADDING_VERTICAL,
              left: 0 + PADDING_VERTICAL,
              top: 52 + PADDING_VERTICAL,
              width: bbox?.width - PADDING_VERTICAL,
            };

            const rects = Object.values(rectsMappingRef.current ?? {}).map(r => ({
              ...r,
              height: ItemTypeEnum.APP === r.type
                ? 1120 : ItemTypeEnum.OUTPUT === r.type ? 418 : r.height,
              width: ItemTypeEnum.APP === r.type
                ? 620 : ItemTypeEnum.OUTPUT === r.type ? 400 : r.width,
            })) as any[];
            const lrg =
              findLargestUnoccupiedSpace(
                rectg as any,
                rects,
                box as any,
            ) as RectType;

            rect.left = lrg.left;
            rect.top = lrg.top;
            rect.type = nodeType;
            rect.id = nodeID;

            rectsMappingRef.current[nodeID] = rect;
          }

          arr.push(
            <WithOnMount
              key={`${itemUUID}:${nodeID}:${nodeType}`}
              onMount={() => {
                if (ItemTypeEnum.APP === nodeType) {
                  appNodeRefs?.current?.[itemUUID]?.render?.(dragRef);
                } else {
                  outputNodeRefs?.current?.[itemUUID]?.render?.(item as OutputNodeType, dragRef);
                }
              }}
              uuid={`${itemUUID}:${nodeID}`}
            />,
          );
        }

        const node = {
          block: items,
          id: nodeID,
          type: nodeType,
        } as NodeType;

        arr.push(
          <DragWrapper
            item={node}
            key={nodeID}
            rect={rect}
            ref={dragRef}
          >
          </DragWrapper>,
        );
      });
    });

    return arr;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rectsMapping]);

  const nodesMemo = useMemo(() => renderNodeComponents({
    [ItemTypeEnum.BLOCK]: blocks,
    [ItemTypeEnum.NODE]: groups,
  }), [blocks, groups, renderNodeComponents]);

  const appsMemo = useMemo(() => renderNodeComponents({
      [ItemTypeEnum.APP]: Object
        .values(appNodes ?? {})
        .flatMap(appmaps => Object.values(appmaps ?? {})),
    }), [appNodes, renderNodeComponents]);
  const outputMemo = useMemo(() => renderNodeComponents({
    [ItemTypeEnum.OUTPUT]: Object.values(outputNodes ?? {}),
  }), [outputNodes, renderNodeComponents]);

  const [, connectDrop] = useDrop(
    () => ({
      // https://react-dnd.github.io/react-dnd/docs/api/use-drop
      accept: [ItemTypeEnum.APP, ItemTypeEnum.OUTPUT],
      drop: (item: NodeType, monitor) => {
        // console.log('start', itemsRef.current)
        const delta = monitor.getDifferenceFromInitialOffset() as {
          x: number;
          y: number;
        };

        // let left = Math.round(node?.rect?.left + delta.x);
        // let top = Math.round(node?.rect?.top + delta.y);
        let left = Math.round((item?.rect?.left ?? 0) + delta.x);
        let top = Math.round((item?.rect?.top ?? 0) + delta.y);

        let leftOffset = 0;
        let topOffset = 0;

        if (snapToGridOnDrop) {
          // TODO (dangerous): This doesn’t apply to the ports; need to handle that separately.
          const [xSnapped, ySnapped] = snapToGrid(
            {
              x: left,
              y: top,
            },
            { height: GRID_SIZE, width: GRID_SIZE },
          );
          leftOffset = xSnapped - left;
          topOffset = ySnapped - top;
        }

        left += leftOffset;
        top += topOffset;

        const node = { ...item };
        node.rect = node.rect ?? item.rect;
        node.rect.left = left;
        node.rect.top = top;

        const element = dragRefs.current[node.id].current;
        if (element) {
          element.style.transform = `translate(${left}px, ${top}px)`;
        }

        rectsMappingRef.current[node.id] = node.rect;
        update(`${executionFrameworkUUID}:${pipelineUUID}`, {
          [node.id]: node.rect,
        });
        return undefined;
      },
    }), [],
  );
  connectDrop(canvasRef);

  return (
    <div
      className={stylesPipelineBuilder.wrapper}
      ref={wrapperRef}
      style={{
        height: '100vh',
        overflow: 'visible',
        position: 'relative',
        width: '100vw',
      }}
    >
      <div
        onContextMenu={e => handleContextMenu(e as any)}
        onDoubleClick={() => {
          transformState?.current?.handlePanning?.current?.((event ?? null) as any, {
            x: 0,
            y: 0,
          });
          startTransition(() => {
            setZoomPanDisabled(false);
          });
        }}
        onMouseDown={e => handleMouseDown(e as any)}
        ref={canvasRef}
        style={{
          height: 'inherit',
          overflow: 'inherit',
          position: 'inherit',
          width: 'inherit',
        }}
      >
        <motion.div
          className={[
            stylesPipelineBuilder.interstitial,
            stylesPipelineBuilder.hide,
          ].join(' ')}
          ref={interstitialRef}
          style={{ opacity: opacityInterstitial }}
        >
          <Grid
            alignItems="center"
            className={stylesPipelineBuilder.content}
            justifyItems="center"
            padding={24}
            rowGap={16}
          >
            <OpenInSidekick
              className={[
                stylesPipelineBuilder.icon,
                stylesPipelineBuilder.iconRight,
              ].join(' ')}
              secondary
              size={40}
            />
            <OpenInSidekickLeft
              className={[
                stylesPipelineBuilder.icon,
                stylesPipelineBuilder.iconLeft,
              ].join(' ')}
              secondary
              size={40}
            />
            <Text medium secondary>
              {getCurrentGroup()?.name}
            </Text>
          </Grid>
        </motion.div>

        <CanvasContainer ref={containerRef}>
          <SettingsProvider
            layoutConfigsRef={layoutConfigsRef}
            selectedGroupsRef={selectedGroupsRef}
          >
            <ModelProvider
              blockMappingRef={blockMappingRef}
              blocksByGroupRef={blocksByGroupRef}
              groupMappingRef={groupMappingRef}
              groupsByLevelRef={groupsByLevelRef}
              mutations={{
                files: fileMutants,
                pipelines: pipelineMutants,
              }}
            >
              <EventProvider
                handleContextMenu={handleContextMenu}
                handleMouseDown={handleMouseDown}
                removeContextMenu={removeContextMenu}
                setSelectedGroup={setSelectedGroup}
                useExecuteCode={useExecuteCode}
                useRegistration={useRegistration}
              >
                <motion.div
                  className={[
                    stylesPipelineBuilder.planesWrapper,
                    stylesPipelineBuilder.enter,
                  ].join(' ')}
                  ref={scopeEnter}
                  style={phaseRef.current < 2
                    ? {
                      opacity: opacityInit,
                      scale: scaleInit,
                      translateX: translateXInit,
                      translateY: translateYInit,
                    }
                    : isAnimating
                      ? {
                        opacity: opacityEnter,
                        scale: scaleEnter,
                        translateX: translateXEnter,
                        translateY: translateYEnter,
                      }
                      : {}
                  }
                >
                  <div>
                    {appsMemo}
                    {outputMemo}
                    {nodesMemo}
                    {selectedGroupNode}

                    <LineManagerV2
                      controls={controlsForLines}
                      rectsMapping={rectsMapping}
                      selectedGroupRect={selectedGroupRect}
                    />
                  </div>
                </motion.div>

                <motion.div
                  className={[
                    stylesPipelineBuilder.planesWrapper,
                    stylesPipelineBuilder.idle,
                    stylesPipelineBuilder.exit,
                  ].join(' ')}
                  ref={scopeExit}
                  style={{
                    opacity: opacityExit,
                    scale: scaleExit,
                    translateX: translateXExit,
                    translateY: translateYExit,
                  }}
                />

                {portalsMemo}

                {renderer}
              </EventProvider>
            </ModelProvider>
          </SettingsProvider>
        </CanvasContainer>
      </div>

      {headerData && <HeaderUpdater {...headerData as any} />}
    </div >
  );
};

export default PipelineCanvasV2;