import { css } from 'styled-components';

export type StyleProps = {
  className?: string;
  color?: string;
  colorName?: string;
  fill?: string;
  height?: number;
  inverted?: boolean;
  muted?: boolean;
  opacity?: number;
  secondary?: boolean;
  size?: number;
  small?: boolean;
  stroke?: string;
  style?: any;
  useStroke?: boolean;
  viewBox?: string;
  width?: number;
  xsmall?: boolean;
};

const icons = css<StyleProps>`
  ${({ color, colorName, fill, inverted, muted, secondary, theme, useStroke }) => !useStroke && `
    fill: ${[
      typeof colorName !== 'undefined' && theme.colors[colorName],
      typeof color !== 'undefined' && color,
      fill ?? (theme.icons.color[[
        inverted && 'inverted',
        muted && 'muted',
        secondary && 'secondary',
      ].find(Boolean) ?? 'base']),
    ].filter(Boolean)[0]};
  `}

  ${({ color, colorName, inverted, stroke, muted, secondary, theme, useStroke }) => useStroke && `
    stroke: ${[
      typeof colorName !== 'undefined' && theme.colors[colorName],
      typeof color !== 'undefined' && color,
      stroke ?? (theme.icons.color[[
        inverted && 'inverted',
        muted && 'muted',
        secondary && 'secondary',
      ].find(Boolean) ?? 'base']),
    ].filter(Boolean)[0]};
  `}
`;

const svg = css<StyleProps>`
  ${({ height, size, small, theme, width, xsmall }) => `
    height: ${typeof height === 'undefined' && typeof size === 'undefined'
      ? theme.icons.size[small ? 'sm' : xsmall ? 'xs' : 'base']
      : typeof height === 'undefined'
        ? size
        : height
    }px;
    width: ${typeof width === 'undefined' && typeof size === 'undefined'
      ? theme.icons.size[small ? 'sm' : xsmall ? 'xs' : 'base']
      : typeof width === 'undefined'
        ? size
        : width
    }px;
  `}
`;

export { svg };
export default icons;
