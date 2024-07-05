import Button, { ButtonProps } from '@mana/elements/Button';
import DashedDivider from '@mana/elements/Divider/DashedDivider';
import Grid from '@mana/components/Grid';
import MageAvatar from '@mana/icons/avatars';
import MenuManager from '@mana/components/Menu/MenuManager';
import NavigationButtonGroup from '@mana/components/Menu/NavigationButtonGroup';
import NavTag from '@mana/components/Tag/NavTag';
import React, { createRef, useCallback, useMemo, useRef } from 'react';
import Text from '@mana/elements/Text';
import TextInput from '@mana/elements/Input/TextInput';
import stylesHeader from '@styles/scss/layouts/Header/Header.module.scss';
import useContextMenu from '@mana/hooks/useContextMenu';
import { SearchV3, ChatV2, Code, DocumentIcon, Builder, CaretDown, CaretLeft } from '@mana/icons';
import { LayoutDirectionEnum } from '@mana/components/Menu/types';
import { MenuItemType } from '@mana/hooks/useContextMenu';
import { getUser } from '@utils/session';
import { HeaderProps } from './interfaces';
import { unique } from '@utils/array';

export const HEADER_ROOT_ID = 'v2-header-root';

export function Header({
  appHistory,
  buildInterAppNavItems,
  buildIntraAppNavItems,
  cacheKey,
  globalNavItems,
  interAppNavItems,
  intraAppNavItems,
  navTag,
  router,
  selectedNavItem,
  title,
  version,
}: HeaderProps, ref: React.MutableRefObject<HTMLDivElement | null>) {
  console.log('Header render');
  const headerRef = useRef<HTMLDivElement | null>(ref?.current);

  const {
    contextMenu,
  } = useContextMenu({
    containerRef: headerRef,
    useAsStandardMenu: true,
    uuid: 'main-header',
  });

  const buttonProps = useMemo(() => ({
    className: [
      stylesHeader.button,
    ].join(' '),
    // motion: true,
    small: true,
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), []);

  const gridProps = useMemo(() => ({
    autoColumns: 'min-content',
    autoFlow: 'column',
    columnGap: 10,
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), []);

  const iconProps = useMemo(() => ({
    className: stylesHeader.buttonIcon,
    size: 16,
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), []);

  const interAppItems = useMemo(() => {
    const itemsDefault = [
      {
        Icon: Code,
        onClick: () => {
          router.push('/v2/test');
        },
        uuid: 'code',
      },
    ];
    const items: (MenuItemType & {
      placeholder?: boolean;
    })[] = [...(interAppNavItems ?? [])];

    if (!version && !items?.length) {
      items.push({
        placeholder: true,
        uuid: 'placeholder-inter-app-item-0',
      });
    }

    return buildInterAppNavItems
      ? buildInterAppNavItems?.(interAppNavItems ?? itemsDefault, { router })
      : items.concat(itemsDefault);
  }, [version, router, interAppNavItems, buildInterAppNavItems]);

  const globalItems = globalNavItems ?? [
    {
      Icon: ChatV2,
      linkProps: { href: 'https://www.mage.ai/chat' },
      style: {
        gridTemplateColumns: '',
      },
      target: '_blank',
      uuid: 'help',
    },
    {
      Icon: DocumentIcon,
      linkProps: { href: 'https://docs.mage.ai' },
      style: {
        gridTemplateColumns: '',
      },
      target: '_blank',
      uuid: 'docs',
    },
  ];

  const renderNavItems = (items: (MenuItemType & {
    placeholder?: boolean;
  })[]) => unique(items, ({ uuid }) => uuid)?.map(({
    Icon,
    label,
    placeholder,
    uuid,
    ...rest
  }) => (
    <nav key={uuid}>
      <Button
        {...buttonProps}
        {...rest}
        Icon={ip => Icon ? <Icon {...ip} {...iconProps} /> : null}
        className={[
          ...(buttonProps?.className?.split(' ') ?? []),
          selectedNavItem === uuid ? stylesHeader.selected : '',
        ].filter(Boolean).join(' ')}
        data-uuid={uuid}
        style={{
          gridTemplateColumns: '',
        }}
      >
        {placeholder && <div style={{ width: iconProps?.size }} />}
        {label && label?.()}
      </Button>
    </nav>
  ));

  const intraAppItemsMemo = useMemo(() => {
    const hasItems = intraAppNavItems?.length >= 1 || buildIntraAppNavItems;

    if (version && !hasItems) {
      return null;
    }

    return (
      <Grid {...gridProps}>
        <DashedDivider vertical />

        {!version && !hasItems && (
          <Button
            {...buttonProps}
            style={{
              gridTemplateColumns: '',
            }}
          >
            <div style={{ width: 200 }} />
          </Button>
        )}

        {hasItems && (
          <NavigationButtonGroup
            buildGroups={buildIntraAppNavItems}
            cacheKey={cacheKey}
            groups={intraAppNavItems}
          />
        )}
      </Grid>
    );
  }, [buttonProps, cacheKey, intraAppNavItems, buildIntraAppNavItems, gridProps, version]);

  const appHistoryNavMemo = useMemo(() => (
    <Grid {...gridProps}>
      <Button
        {...buttonProps}
        style={{
          gridTemplateColumns: '',
        }}
      >
        <Grid
          {...gridProps}
          alignItems="center"
          columnGap={12}
          paddingRight={(title ?? false) ? 8 : undefined}
        >
          {(!version || !appHistory)
            ? <CaretDown {...iconProps} />
            : <CaretLeft {...iconProps} />
          }

          {(navTag || !version) &&
            <NavTag role="tag">
              {!navTag && !version
                ? <>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</>
                : navTag
              }
            </NavTag >
          }

          {(title && version) ?
            <Text nowrap role="title" semibold>
              {title}
            </Text>
            : <div style={{ width: 120 }} />}
        </Grid>
      </Button >
    </Grid>
  ), [buttonProps, gridProps, iconProps, navTag, title, appHistory, version])

  return (
    <>
      <header
        className={stylesHeader.header}
        ref={headerRef}
      >
        <Grid
          {...gridProps}
          paddingBottom={6}
          paddingLeft={10}
          paddingRight={10}
          paddingTop={6}
          style={{
            gridTemplateColumns: [
              appHistoryNavMemo && 'auto',
              interAppItems && 'auto',
              intraAppItemsMemo && 'auto',
              '1fr auto',
            ].filter(Boolean).join(' '),
          }}
        >
          {appHistoryNavMemo}

          {interAppItems?.length && (
            <Grid {...gridProps}>
              {renderNavItems(interAppItems)}
            </Grid>
          )}

          {intraAppItemsMemo}

          <Grid {...gridProps} templateColumns="1fr">
            <TextInput
              Icon={ip => <SearchV3 {...ip} {...iconProps} />}
              basic
              placeholder="Command Center for data..."
              small
              style={{
                height: '100%',
              }}
            />
          </Grid>

          <Grid {...gridProps}>
            {renderNavItems(globalItems)}

            <Button
              {...buttonProps}
              style={{
                gridTemplateColumns: '',
              }}
            >
              <Grid
                {...gridProps}
                alignItems="center"
                columnGap={10}
              >
                <MageAvatar size={24} variant="a" />

                Sorceress

                <CaretDown {...iconProps} />
              </Grid>
            </Button >
          </Grid>
        </Grid >

        <DashedDivider />
      </header >
      {contextMenu}
    </>
  );
}

export default React.forwardRef(Header);
