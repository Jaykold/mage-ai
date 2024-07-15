import React, { createRef, useRef } from 'react';
import update from 'immutability-helper';
import { ConnectionLines } from '../../Canvas/Connections/ConnectionLines';
import { DragItem, NodeItemType, NodeType, RectType, PortType, LayoutConfigType, ModelMappingType, AppNodeType } from '../../Canvas/interfaces';
import { ItemStatusEnum, ItemTypeEnum, LayoutConfigDirectionEnum, LayoutConfigDirectionOriginEnum, PortSubtypeEnum } from '../../Canvas/types';
import { createRoot, Root } from 'react-dom/client';
import { getBlockColor } from '@mana/themes/blocks';
import { getPathD } from '../../Canvas/Connections/utils';
import { throttle } from '../../Canvas/utils/throttle';
import { ItemManagerType, ItemElementsType, ItemElementsRefType } from './interfaces';
import useDynamicDebounce from '@utils/hooks/useDebounce';
import useAppEventsHandler, { CustomAppEvent, CustomAppEventEnum } from './useAppEventsHandler';
import { ClientEventType } from '@mana/shared/interfaces';
import { AppStatusEnum } from '../constants';
import { DEBUG } from '@components/v2/utils/debug';
import { areEqualRects } from '../../Canvas/Nodes/equals';
import { ElementRoleEnum } from '@mana/shared/types';
import { getClosestChildRole } from '@utils/elements';

export default function useItemManager({
  itemElementsRef,
  itemsRef,
}: {
  itemElementsRef: ItemElementsRefType;
  itemsRef: React.MutableRefObject<Record<string, NodeItemType>>;
}): {
  onMountItem: (item: DragItem, itemRef: React.RefObject<HTMLDivElement>) => void,
} {
  const itemMetadataRef = useRef<Record<string, Record<string, any>>>({});
  const [debouncer, cancelDebounce] = useDynamicDebounce();
  const [debouncer2, cancelDebounce2] = useDynamicDebounce();

  const handleNodeMounted = ({ detail: { event } }: CustomAppEvent) => {
    const { data, operationTarget } = event;
    const { node } = data;
    onMountItem(node, operationTarget as React.RefObject<HTMLDivElement>);
  };

  const { convertEvent, dispatchAppEvent } = useAppEventsHandler({
    itemElementsRef,
    itemMetadataRef,
    itemsRef,
  } as any, {
    [CustomAppEventEnum.NODE_MOUNTED]: handleNodeMounted,
  });

  // Stage 2: Initial setup of components on mount.
  function onMountItem(item: NodeType, itemRef: React.RefObject<HTMLDivElement> | React.RefObject<HTMLElement>) {
    const { id, type } = item;
    itemElementsRef.current ||= {} as ItemElementsType;
    itemElementsRef.current[type] ||= {};
    itemElementsRef.current[type][id] = itemRef;

    if (!itemRef.current) return;

    if (![ItemTypeEnum.APP, ItemTypeEnum.BLOCK, ItemTypeEnum.NODE].includes(type)) return;

    const rect = itemRef.current.getBoundingClientRect() as RectType;
    item.rect ||= { left: 0, top: 0 };
    item.rect.height = rect.height;
    item.rect.width = rect.width;
    item.rect.offset = {
      left: itemRef?.current?.offsetLeft,
      top: itemRef?.current?.offsetTop,
    };

    if ([ItemTypeEnum.BLOCK, ItemTypeEnum.NODE].includes(type)) {
      const elementBadge = itemRef?.current?.querySelector(`#${item.id}-badge`);
      const rectBadge = elementBadge?.getBoundingClientRect() ?? {
        height: 0,
        left: 0,
        top: 0,
        width: 0,
      };
      const elementTitle = itemRef?.current?.querySelector(`#${item.id}-title`);
      const rectTitle = elementTitle?.getBoundingClientRect() ?? {
        height: 0,
        left: 0,
        top: 0,
        width: 0,
      };

      item.rect.inner ||= {};
      item.rect.inner.badge = {
        height: rectBadge?.height,
        left: rectBadge?.left,
        top: rectBadge?.top,
        width: rectBadge?.width,
        offset: {
          top: (elementBadge as { offsetTop?: number })?.offsetTop,
        },
      };
      item.rect.inner.title = {
        height: rectTitle?.height,
        left: rectTitle?.left,
        top: rectTitle?.top,
        width: rectTitle?.width,
        offset: {
          top: (elementTitle as { offsetTop?: number })?.offsetTop,
        },
      };

      if (ItemStatusEnum.INITIALIZED === item?.status) {
        item.status = ItemStatusEnum.PENDING_LAYOUT;
      }

      const itemPrev = itemsRef?.current?.[item.id];
      itemsRef.current[item.id] = item;

      if (itemPrev?.rect && item?.rect) {
        let same = areEqualRects(itemPrev as { rect: RectType }, item as { rect: RectType });

        if (same) {
          const child = getClosestChildRole(itemRef?.current, ElementRoleEnum.CONTENT);
          if (child) {
            const rectChild = child?.getBoundingClientRect() as RectType;
            const h1 = Math.ceil(item?.rect?.height)
            const h2 = Math.ceil(rectChild.height)
            const w1 = Math.ceil(item?.rect?.width)
            const w2 = Math.ceil(rectChild.width)

            DEBUG.itemManager && console.log('SAME?',
              item.id,
              [h1, w1],
              [h2, w2],
              Math.abs(h1 - h2) <= 2,
              Math.abs(w1 - w2) <= 2,
            );

            // 2 is for border width
            same = Math.abs(h1 - h2) <= 2 && Math.abs(w1 - w2) <= 2;
            if (!same) {
              item.rect.height = rectChild.height;
              item.rect.width = rectChild.width;
            }
          }
        }

        if (same) {
          const rectsPrev = itemMetadataRef?.current?.[item.id]?.rects;
          if (rectsPrev?.length >= 1) {
            DEBUG.itemManager && console.log('[onMountItem] rects are equal', item.id, itemPrev?.rect, item?.rect);
            DEBUG.itemManager && console.log('[onMountItem] Number of times mounted:', item.id, rectsPrev?.length ?? 0);

            item.status = ItemStatusEnum.READY;

            cancelDebounce2();

            debouncer2(() => {
              DEBUG.itemManager && console.log('onMountItem.ready', item);
              dispatchAppEvent(CustomAppEventEnum.NODE_MOUNTED_PREVIOUSLY, {
                node: item,
              });
            }, 100);
          }
        }
      }

      itemMetadataRef.current[item.id] ||= {
        rects: [],
      };
      itemMetadataRef.current[item.id].rects.push(item.rect);

      cancelDebounce();

      debouncer(() => {
        DEBUG.itemManager && console.log('onMountItem', item);
        dispatchAppEvent(CustomAppEventEnum.UPDATE_DISPLAY, {
          node: item,
        });
      }, 100);
    } else if ([ItemTypeEnum.APP].includes(type)) {
      const node = itemsRef?.current?.[item?.upstream?.[0]];
      if (!node) return;
      const {
        height = 0,
        left = 0,
        top = 0,
        width = 0,
      } = node?.rect ?? {};
      item.rect.left = left + width + 20;
      item.rect.top = top + 20;

      if (AppStatusEnum.PENDING_LAYOUT === (item as AppNodeType)?.app?.status) {
        (item as AppNodeType).app.status = AppStatusEnum.READY;
      }

      dispatchAppEvent(CustomAppEventEnum.APP_RECT_UPDATED, {
        event: update({}, {
          data: {
            $set: {
              node: item,
            },
          },
          operationTarget: {
            $set: itemRef,
          },
        }) as any,
      });
    } else if ([ItemTypeEnum.OUTPUT].includes(type)) {
      dispatchAppEvent(CustomAppEventEnum.OUTPUT_UPDATED, {
        node: item.node,
        output: item,
      });
    }
  }

  return {
    onMountItem,
  };
}