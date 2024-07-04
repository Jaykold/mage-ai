import { hyphenateCamelCase } from '@utils/string';
import { RectType } from './interfaces';

export function styleClassNames(
  styles: Record<string, boolean | number | string>,
  classNames: string[],
  {
    className,
    uuid,
    ...props
  }: {
    [key: string]: boolean | number | string | any;
  } = {
      className: '',
      uuid: '',
    },
): string {
  const arr: string[] = classNames || [];

  Object.entries(props || {}).forEach(([key, value]) => {
    if (typeof value !== 'undefined') {
      const k = [hyphenateCamelCase(key), ...String(value)?.replace('%', '')?.split(' ')]
        .filter(s => s?.length >= 1)
        ?.join('-');
      const cn = String(styles[k]);
      arr.push(cn);
    }
  });

  [className, uuid].forEach((key: string) => {
    if (key?.length >= 1 && !arr?.includes(key)) {
      arr.push(key);
    }
  });

  return arr
    .filter(value => typeof value !== 'undefined' && value !== null && String(value)?.length >= 1)
    .join(' ');
}

export function getAbsoluteRect(
  element: HTMLElement,
  opts?: {
    includeParents?: boolean;
  },
): {
  parents: RectType[];
  rect: RectType;
} {
  const rect = {
    ...element.getBoundingClientRect(),
    left: 0,
    top: 0,
  };
  const parents = [];

  while (element) {
    rect.left += element.offsetLeft - element.scrollLeft + element.clientLeft;
    rect.top += element.offsetTop - element.scrollTop + element.clientTop;
    element = element.offsetParent as HTMLElement;
    if (element) {
      parents.push(element?.getBoundingClientRect());
    }
  }

  return {
    parents,
    rect,
  };
}
