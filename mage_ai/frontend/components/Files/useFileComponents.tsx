import moment from 'moment-timezone';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useGlobalState } from '@storage/state';
import { useMutation } from 'react-query';

import ApiReloader from '@components/ApiReloader';
import BlockType, { BlockRequestPayloadType, BlockTypeEnum } from '@interfaces/BlockType';
import Controller from '@components/FileEditor/Controller';
import Dashboard from '@components/Dashboard';
import Flex from '@oracle/components/Flex';
import FlexContainer from '@oracle/components/FlexContainer';
import FileBrowser from '@components/FileBrowser';
import FileEditorHeader from '@components/FileEditor/Header';
import FileTabsScroller from '@components/FileTabsScroller';
import FileType, {
  ALL_SUPPORTED_FILE_EXTENSIONS_REGEX,
  OriginalContentMappingType,
  FILES_QUERY_INCLUDE_HIDDEN_FILES,
  COMMON_EXCLUDE_PATTERNS,
  COMMON_EXCLUDE_DIR_PATTERNS,
} from '@interfaces/FileType';
import FileVersions from '@components/FileVersions';
import KeyboardTextGroup from '@oracle/elements/KeyboardTextGroup';
import PipelineType from '@interfaces/PipelineType';
import Spacing from '@oracle/elements/Spacing';
import StatusFooter from '@components/PipelineDetail/StatusFooter';
import Text from '@oracle/elements/Text';
import api from '@api';
import useContextMenu from '@utils/useContextMenu';
import useStatus from '@utils/models/status/useStatus';
import {
  HeaderStyle,
  MAIN_CONTENT_TOP_OFFSET,
  MenuStyle,
  TabsStyle,
} from './index.style';
import { DATE_FORMAT_LONG_NO_SEC_WITH_OFFSET } from '@utils/date';
import {
  KEY_CODE_ARROW_LEFT,
  KEY_CODE_ARROW_RIGHT,
  KEY_CODE_ARROW_DOWN,
  KEY_CODE_ARROW_UP,
  KEY_CODE_BRACKET_LEFT,
  KEY_CODE_BRACKET_RIGHT,
  KEY_CODE_C,
  KEY_CODE_CONTROL,
  KEY_CODE_META,
  KEY_CODE_R,
  KEY_CODE_SHIFT,
  KEY_SYMBOL_ARROW_LEFT,
  KEY_SYMBOL_ARROW_RIGHT,
  KEY_SYMBOL_BRACKET_LEFT,
  KEY_SYMBOL_BRACKET_RIGHT,
  KEY_SYMBOL_C,
  KEY_SYMBOL_CONTROL,
  KEY_SYMBOL_META,
  KEY_SYMBOL_SHIFT,
} from '@utils/hooks/keyboardShortcuts/constants';
import { ViewKeyEnum } from '@components/Sidekick/constants';
import {
  LOCAL_STORAGE_KEY_SHOW_HIDDEN_FILES,
  addOpenFilePath as addOpenFilePathLocalStorage,
  getOpenFilePaths,
  removeOpenFilePath as removeOpenFilePathLocalStorage,
  setOpenFilePaths as setOpenFilePathsLocalStorage,
} from '@storage/files';
import { useKeyboardContext } from '@context/Keyboard';
import { useFileTabs } from '@components/PipelineDetail/FileTabs';
import { useError } from '@context/Error';
import { onlyKeysPresent } from '@utils/hooks/keyboardShortcuts/utils';
import { onSuccess } from '@api/utils/response';
import { keysPresentAndKeysRecent } from '@utils/hooks/keyboardShortcuts/utils';
import { indexBy } from '@utils/array';
import { getFilenameFromFilePath } from './utils';
import { get, set } from '@storage/localStorage';
import { displayPipelineLastSaved } from '@components/PipelineDetail/utils';
import { convertFilePathToRelativeRoot } from '@utils/files';
import { buildFileTreeByExtension } from '@components/FileBrowser/utils';
import { UNIT } from '@oracle/styles/units/spacing';
import { Edit, Save, VisibleEye } from '@oracle/icons';

export const ICON_SIZE = UNIT * 2;
export const MENU_ICON_SIZE = UNIT * 1.5;
const MENU_ICON_PROPS = {
  default: true,
  size: MENU_ICON_SIZE,
};

type UseFileComponentsProps = {
  addNewBlock?: (
    b: BlockRequestPayloadType,
    cb: (block: BlockType) => void,
    opts?: {
      disableFetchingFiles?: boolean;
    },
  ) => void;
  blocks?: BlockType[];
  contained?: boolean;
  containerRef?: any;
  deleteWidget?: (value: BlockType) => void;
  disableContextMenu?: boolean;
  fetchAutocompleteItems?: () => void;
  fetchPipeline?: () => void;
  fetchVariables?: () => void;
  codeEditorMaximumHeightOffset?: number;
  onClickTabClose?: (filePath: string) => void;
  onCreateFile?: (file: FileType) => void;
  onOpenFile?: (filePath: string, isFolder: boolean) => void;
  onSelectBlockFile?: (
    blockUUID: string,
    blockType: BlockTypeEnum,
    filePath: string,
  ) => void;
  onSelectFile?: (filePath: string) => void;
  onUpdateFileSuccess?: (fileContent: FileType, opts?: {
    blockUUID: string;
  }) => void;
  openSidekickView?: (
    newView: ViewKeyEnum,
    pushHistory?: boolean,
    opts?: {
      addon?: string;
      blockUUID: string;
      // http://localhost:3000/pipelines/delicate_field/edit?addon=conditionals&sideview=power_ups&extension=great_expectations
      extension?: string;
    },
  ) => void;
  originalContent?: OriginalContentMappingType;
  pipeline?: PipelineType;
  query?: {
    pattern?: string;
  };
  selectedFilePath?: string;
  sendTerminalMessage?: (message: string, keep?: boolean) => void;
  setDisableShortcuts?: (disableShortcuts: boolean) => void;
  setSelectedBlock?: (value: BlockType) => void;
  showHiddenFilesSetting?: boolean;
  uuid: string;
  widgets?: BlockType[];
};

function useFileComponents({
  addNewBlock,
  blocks,
  contained,
  containerRef,
  deleteWidget,
  disableContextMenu,
  fetchAutocompleteItems,
  fetchPipeline,
  fetchVariables,
  codeEditorMaximumHeightOffset,
  onClickTabClose,
  onCreateFile,
  onOpenFile,
  onSelectBlockFile,
  onSelectFile,
  onUpdateFileSuccess,
  openSidekickView,
  originalContent,
  pipeline,
  query,
  selectedFilePath: selectedFilePathDefault,
  sendTerminalMessage,
  setDisableShortcuts,
  setSelectedBlock,
  showHiddenFilesSetting,
  uuid: uuidProp,
  widgets,
}: UseFileComponentsProps = {
  uuid: null,
}) {
  const uuid = useMemo(() => `useFileComponents/${uuidProp}`, [uuidProp]);
  const [, setApiReloads] = useGlobalState('apiReloads');
  const [showError] = useError(null, {}, [], {
    uuid,
  });
  const [showHiddenFiles, setShowHiddenFiles] = useState<boolean>(
    get(LOCAL_STORAGE_KEY_SHOW_HIDDEN_FILES, false),
  );
  const { status } = useStatus({
    refreshInterval: 0,
    revalidateOnFocus: false,
  });

  const fileTreeRef = useRef(null);
  const contentByFilePath = useRef(null);
  const selectedFileHistoryRef = useRef([]);
  const selectedFilePathRef = useRef(null);

  const [lastSavedMapping, setSLastSavedMapping] = useState<{
    [filePath: string]: string | number;
  }>({});
  const [contentTouchedMapping, setContentTouchedMapping] = useState<{
    [filePath: string]: string | number;
  }>({});

  const setContentByFilePath = useCallback((data: {
    [filePath: string]: string;
  }) => {
    if (!contentByFilePath.current) {
      contentByFilePath.current = {};
    }

    contentByFilePath.current = {
      ...contentByFilePath.current,
      ...data,
    };

    setContentTouchedMapping(prev => ({
      ...prev,
      ...data,
    }));
  }, [contentByFilePath]);

  const [filesMapping, setFilesMapping] = useState<{
    [filePath: string]: FileType;
  }>({});
  const [openFilePaths, setOpenFilePathsState] = useState<string[]>([]);
  const [selectedFilePath, setSelectedFilePathState] = useState<string>(null);
  const selectedFilePathIndex = useMemo(() => openFilePaths?.findIndex(fp => fp === selectedFilePath), [
    openFilePaths,
    selectedFilePath,
  ]);

  const setSelectedFilePath = useCallback((prev: (string | ((p?: string) => string)), skipAddingToHistry: boolean = false) => {
    const filePath = convertFilePathToRelativeRoot(typeof prev === 'function' ? prev?.() : prev, status);

    if (!skipAddingToHistry) {
      if (!selectedFileHistoryRef?.current) {
        selectedFileHistoryRef.current = [];
      }
      const arr = (selectedFileHistoryRef.current || [])?.filter(fp => fp !== filePath);
      arr.unshift(filePath);
      selectedFileHistoryRef.current = arr;
    }

    selectedFilePathRef.current = filePath;
    setSelectedFilePathState(filePath);
  }, [status]);

  const [filesTouched, setFilesTouchedState] = useState<{
    [filePath: string]: boolean;
  }>({});
  const setFilesTouched = useCallback((prev) => {
    setFilesTouchedState((prev2) => {
      const val = typeof prev === 'function' ? prev?.(prev2) : prev;

      return Object.entries(val).reduce((acc, [k, v]) => ({
        ...acc,
        [convertFilePathToRelativeRoot(k, status)]: v,
      }), {});
    });
  }, [status]);

  const [fileVersionsVisible, setFilesVersionsVisible] = useState<boolean>(false);
  const selectedFile = useMemo(() => filesMapping?.[selectedFilePath], [
    filesMapping,
    selectedFilePath,
  ]);

  const openFilenameMapping = useMemo(() => openFilePaths.reduce((acc, filePath: string) => {
    const filename = getFilenameFromFilePath(filePath);
    if (!acc[filename]) {
      acc[filename] = [];
    }
    acc[filename].push(filePath);

    return acc;
  }, {}), [openFilePaths]);

  const setOpenFilePaths = useCallback((filePathsInit: string[]) => {
    const filePaths = filePathsInit?.map(fp => convertFilePathToRelativeRoot(fp, status));

    setOpenFilePathsLocalStorage(filePaths);
    setOpenFilePathsState(filePaths);
  }, [status]);

  const addOpenFilePath = useCallback((filePath: string) => {
    setOpenFilePaths(addOpenFilePathLocalStorage(convertFilePathToRelativeRoot(filePath, status)));
  }, [setOpenFilePaths, status]);

  const removeOpenFilePaths = useCallback((filePathsInit: string[]) => {
    const filePaths = filePathsInit?.map(fp => convertFilePathToRelativeRoot(fp, status));

    const fps = filePaths?.filter(filePath => filesTouched?.[filePath]
      && (typeof window === 'undefined'
        || !window.confirm(`${filePath} has unsaved changes, are you sure you want to close this file?`)));

    const indexes = filePaths?.map((filePath) => openFilePaths?.findIndex((fp: string) => fp === filePath));
    indexes.sort();
    let idx = indexes?.find((index, i) => i >= 1 && index > indexes[i - 1] + 1);
    if (idx === undefined || idx === null) {
      idx = indexes?.[0];
    }

    setContentByFilePath(filePaths?.reduce((acc, fp) => ({
      ...acc,
      [fp]: null,
    }), {}));

    setFilesTouched(prev => ({
      ...prev,
      ...filePaths?.reduce((acc, fp) => ({
        ...acc,
        [fp]: false,
      }), {}),
    }));


    let arr = [];
    filePaths?.forEach((filePath: string) => {
      arr = removeOpenFilePathLocalStorage(filePath);
      setOpenFilePaths(arr);
    });

    if (selectedFileHistoryRef?.current) {
      selectedFileHistoryRef.current = selectedFileHistoryRef.current.filter(fp => !filePaths?.includes(fp));
    }

    if (arr?.length >= 1) {
      const idxNext = Math.min(idx - 1, arr?.length - 1);
      setSelectedFilePath(arr[Math.max(idxNext, 0)]);
    } else if (arr?.length === 0) {
      setSelectedFilePath(null);
    }
  }, [
    filesTouched,
    selectedFilePath,
    setContentByFilePath,
    setOpenFilePaths,
    status,
  ]);

  const openFile = useCallback((filePathInit: string, isFolder?: boolean) => {
    const filePath = convertFilePathToRelativeRoot(filePathInit, status);

    if (!isFolder) {
      addOpenFilePath(filePath);
      setSelectedFilePath(filePath);
    }

    if (onOpenFile) {
      onOpenFile?.(filePath, isFolder);
    }
  }, [addOpenFilePath, onOpenFile, status]);

  const onFileFetched = useCallback((file: FileType) => {
    setFilesMapping(prev => ({
      ...prev,
      [convertFilePathToRelativeRoot(file.path, status)]: file,
    }));
  }, [status]);

  useEffect(() => {
    const arr = getOpenFilePaths();

    let fp;
    if (selectedFilePathDefault) {
      fp = convertFilePathToRelativeRoot(decodeURIComponent(selectedFilePathDefault), status);
      if (!arr?.includes(fp)) {
        arr.push(fp);
        openFile(fp);
      }
    }

    setSelectedFilePath((prev: string): string => {
      if (fp) {
        return fp;
      } else if (!prev && arr?.length >= 1) {
        return arr[0];
      }

      return prev;
    });

    setOpenFilePaths(arr);
  }, [
    openFile,
    selectedFilePathDefault,
    setOpenFilePaths,
    status,
  ]);

  const toggleShowHiddenFiles = useCallback(() => {
    const updatedShowHiddenFiles = !showHiddenFiles;
    setShowHiddenFiles(updatedShowHiddenFiles);
    set(LOCAL_STORAGE_KEY_SHOW_HIDDEN_FILES, updatedShowHiddenFiles);
  }, [showHiddenFiles]);

  const { data: filesData, mutate: fetchFiles } = api.files.list(
    (showHiddenFilesSetting && showHiddenFiles)
      ? {
        ...FILES_QUERY_INCLUDE_HIDDEN_FILES,
        ...query,
      } : query,
  );
  const files = useMemo(() => filesData?.files || [], [filesData]);

  const { data: filesFlattenData, mutate: fetchFilesFLatten } = api.files.list({
    pattern: encodeURIComponent(String(ALL_SUPPORTED_FILE_EXTENSIONS_REGEX)),
    flatten: true,
    exclude_pattern: COMMON_EXCLUDE_PATTERNS,
    exclude_dir_pattern: COMMON_EXCLUDE_DIR_PATTERNS,
  });
  const filesFlatten = useMemo(() => filesFlattenData?.files  || [], [filesFlattenData]);

  const selectItem = useCallback((offset: number, fromHistory: boolean = false) => {
    const arr = (fromHistory
      ? (selectedFileHistoryRef?.current || [])
      : openFilePaths
    );

    const numberOfFilePaths = arr?.length || 0;
    let idx = arr?.findIndex((filePath: string) => selectedFilePathRef?.current === filePath);

    idx += offset;

    if (idx < 0) {
      idx = 0;
    } else if (idx > numberOfFilePaths - 1) {
      idx = numberOfFilePaths - 1;
    }

    setSelectedFilePath(arr[idx], fromHistory);
  }, [openFilePaths, setSelectedFilePath]);

  const {
    disableGlobalKeyboardShortcuts,
    registerOnKeyDown,
    unregisterOnKeyDown,
  } = useKeyboardContext();

  useEffect(() => () => {
    unregisterOnKeyDown(uuid);
  }, [unregisterOnKeyDown, uuid]);

  registerOnKeyDown(uuid, (event, keyMapping, keyHistory) => {
    const filenamesTouched =
      Object.entries(filesTouched).reduce((acc, [k, v]) => v ? acc.concat(k) : acc, []);

    if (onlyKeysPresent([KEY_CODE_META, KEY_CODE_R], keyMapping) && filenamesTouched?.length >= 1) {
      event.preventDefault();

      const warning =
        `You have changes that are unsaved: ${filenamesTouched.join(', ')}. ` +
        'Click cancel and save your changes before reloading page.';

      if (typeof window !== 'undefined'
        && typeof location !== 'undefined'
        && window.confirm(warning)
      ) {
        location.reload();
      }
    } else if (
      keysPresentAndKeysRecent([KEY_CODE_META, KEY_CODE_CONTROL], [KEY_CODE_ARROW_LEFT], keyMapping, keyHistory)
      || keysPresentAndKeysRecent([KEY_CODE_META, KEY_CODE_CONTROL], [KEY_CODE_ARROW_RIGHT], keyMapping, keyHistory)
    ) {
      selectItem(KEY_CODE_ARROW_LEFT === keyHistory[0] ? -1 : 1);
    } else if (
      keysPresentAndKeysRecent([KEY_CODE_CONTROL], [KEY_CODE_BRACKET_LEFT], keyMapping, keyHistory)
      || keysPresentAndKeysRecent([KEY_CODE_CONTROL], [KEY_CODE_BRACKET_RIGHT], keyMapping, keyHistory)
    ) {
      selectItem(KEY_CODE_BRACKET_LEFT === keyHistory[0] ? -1 : 1, true);
    } else if (selectedFilePathRef?.current
      && keysPresentAndKeysRecent([KEY_CODE_META, KEY_CODE_SHIFT], [KEY_CODE_C], keyMapping, keyHistory)
    ) {
      removeOpenFilePaths([selectedFilePathRef?.current]);
    }

    if (disableGlobalKeyboardShortcuts) {
      return;
    }
  },
  [
    filesTouched,
    selectItem,
  ]);

  const [updateFile, { isLoading: isLoadingUpdate }] = useMutation(
    (file: FileType) => api.file_contents.useUpdate(file?.path && encodeURIComponent(file?.path))({
      file_content: file,
    }),
    {
      onSuccess: (response: any) => onSuccess(
        response, {
          callback: ({
            file_content: file,
          }) => {
            const filePath = convertFilePathToRelativeRoot(file?.path, status);

            setApiReloads(prev => ({
              ...prev,
              [`FileVersions/${filePath}`]: Number(new Date()),
            }));
            setContentByFilePath({
              [filePath]: null,
            });
            setSLastSavedMapping({
              [filePath]: moment().utc().unix(),
            });

            if (onUpdateFileSuccess) {
              onUpdateFileSuccess?.(file);
            }
          },
          onErrorCallback: (response, errors) => showError({
            errors,
            response,
          }),
        },
      ),
    },
  );

  const saveFile = useCallback((value: string, f: FileType) => {
    // @ts-ignore
    updateFile({
      ...f,
      content: value,
    });
    // @ts-ignore
    setFilesTouched((prev: {
      [path: string]: boolean;
    }) => ({
      ...prev,
      [f?.path]: false,
    }));
  }, [
    setFilesTouched,
    updateFile,
  ]);

  const saveStatus: string = useMemo(() => displayPipelineLastSaved(
    {
      updated_at: selectedFile?.modified_timestamp
        ? (moment.unix(selectedFile?.modified_timestamp))?.format(DATE_FORMAT_LONG_NO_SEC_WITH_OFFSET)
        : null,
      uuid: selectedFile?.path,
    },
    {
      displayRelative: true,
      isPipelineUpdating: isLoadingUpdate,
      pipelineContentTouched: !!contentTouchedMapping?.[selectedFilePath],
      pipelineLastSaved: Number(lastSavedMapping?.[selectedFilePath]),
      showLastUpdatedTimestamp: selectedFile?.modified_timestamp * 1000,
    },
  ), [
    contentTouchedMapping,
    isLoadingUpdate,
    lastSavedMapping,
    selectedFile,
    selectedFilePath,
  ]);

  const fileBrowserProps = useMemo(() => ({
    addNewBlock,
    blocks,
    deleteWidget,
    disableContextMenu,
    fetchAutocompleteItems,
    fetchFiles,
    fetchPipeline,
    onClickFile: openFile,
    onClickFolder: (path: string) => openFile(path, true),
    onCreateFile,
    onSelectBlockFile,
    openSidekickView,
    pipeline,
    ref: fileTreeRef,
    showError,
    setSelectedBlock,
    showHiddenFiles,
    uuid,
    widgets,
  }), [
    addNewBlock,
    blocks,
    deleteWidget,
    disableContextMenu,
    fetchAutocompleteItems,
    fetchFiles,
    fetchPipeline,
    fileTreeRef,
    onCreateFile,
    onSelectBlockFile,
    openFile,
    openSidekickView,
    pipeline,
    setSelectedBlock,
    showError,
    showHiddenFiles,
    toggleShowHiddenFiles,
    uuid,
    widgets,
  ]);

  const fileBrowserMemo = useMemo(() => (
    <FileBrowser
      {...fileBrowserProps}
      files={files}
    />
  ), [
    files,
    fileBrowserProps
  ]);

  const fileBrowserFlattenMemo = useMemo(() => (
    <FileBrowser
      {...fileBrowserProps}
      files={buildFileTreeByExtension(filesFlatten)}
    />
  ), [
    fileBrowserProps,
    filesFlatten,
  ]);

  const controller = useMemo(() => (
    <Controller
      addNewBlock={addNewBlock}
      contained={contained}
      containerRef={containerRef}
      disableRefreshWarning
      fetchPipeline={fetchPipeline}
      fetchVariables={fetchVariables}
      codeEditorMaximumHeightOffset={codeEditorMaximumHeightOffset}
      onFileFetched={onFileFetched}
      onUpdateFileSuccess={onUpdateFileSuccess}
      openFilePaths={openFilePaths}
      openSidekickView={openSidekickView}
      originalContent={originalContent}
      pipeline={pipeline}
      saveFile={saveFile}
      selectedFilePath={selectedFilePath}
      sendTerminalMessage={sendTerminalMessage}
      setContentByFilePath={setContentByFilePath}
      setDisableShortcuts={setDisableShortcuts}
      setErrors={showError}
      setFilesTouched={setFilesTouched}
      setSelectedBlock={setSelectedBlock}
      updateFile={updateFile}
    />
  ), [
    addNewBlock,
    codeEditorMaximumHeightOffset,
    contained,
    containerRef,
    fetchPipeline,
    fetchVariables,
    onFileFetched,
    onUpdateFileSuccess,
    openFilePaths,
    openSidekickView,
    originalContent,
    pipeline,
    saveFile,
    selectedFilePath,
    sendTerminalMessage,
    setContentByFilePath,
    setDisableShortcuts,
    setFilesTouched,
    setSelectedBlock,
    showError,
    updateFile,
  ]);

  const headerMenuGroups = useMemo(() => {
    return [
      {
        uuid: 'File',
        items: [
          {
            beforeIcon: <Save {...MENU_ICON_PROPS} />,
            uuid: 'Save file and and all changes',
            onClick: (opts) => {
              if (contentByFilePath?.current?.[selectedFilePath]?.length >= 1) {
                saveFile(contentByFilePath.current[selectedFilePath], {
                  path: selectedFilePath,
                });
              }
            },
          },
        ],
      },
      {
        uuid: 'Edit',
        items: [
          {
            beforeIcon: <Edit success={fileVersionsVisible} {...MENU_ICON_PROPS} />,
            uuid: 'Show previous file versions to undo changes',
            disabled: fileVersionsVisible,
            onClick: () => {
              setFilesVersionsVisible(true);
            },
          },
          {
            beforeIcon: <Edit {...MENU_ICON_PROPS} />,
            uuid: 'Close file versions',
            disabled: !Edit,
            onClick: () => {
              setFilesVersionsVisible(false);
            },
          },
        ],
      },
      {
        uuid: 'View',
        items: [
          {
            beforeIcon: <VisibleEye success={showHiddenFiles} {...MENU_ICON_PROPS} />,
            uuid: 'Show hidden files',
            disabled: showHiddenFiles,
            onClick: () => {
              setShowHiddenFiles(true);
            },
          },
          {
            beforeIcon: <VisibleEye {...MENU_ICON_PROPS} />,
            uuid: 'Hide hidden files',
            disabled: !showHiddenFiles,
            onClick: () => {
              setShowHiddenFiles(false);
            },
          },
        ],
      },
      {
        uuid: 'Keyboard shortcuts',
        items: [
          {
            uuid: 'Next file in tab',
            beforeIcon: (
              <KeyboardTextGroup
                addPlusSignBetweenKeys
                keyTextGroups={[[KEY_SYMBOL_META, KEY_SYMBOL_CONTROL, KEY_SYMBOL_ARROW_RIGHT]]}
                monospace
              />
            ),
            onClick: () => selectItem(1),
          },
          {
            uuid: 'Previous file in tab',
            beforeIcon: (
              <KeyboardTextGroup
                addPlusSignBetweenKeys
                keyTextGroups={[[KEY_SYMBOL_META, KEY_SYMBOL_CONTROL, KEY_SYMBOL_ARROW_LEFT]]}
                monospace
              />
            ),
            onClick: () => selectItem(-1),
          },
          {
            uuid: 'Next file recently viewed',
            beforeIcon: (
              <KeyboardTextGroup
                addPlusSignBetweenKeys
                keyTextGroups={[[KEY_SYMBOL_CONTROL, KEY_SYMBOL_BRACKET_RIGHT]]}
                monospace
              />
            ),
            onClick: () => selectItem(1, true),
          },
          {
            uuid: 'Previously viewed file',
            beforeIcon: (
              <KeyboardTextGroup
                addPlusSignBetweenKeys
                keyTextGroups={[[KEY_SYMBOL_CONTROL, KEY_SYMBOL_BRACKET_LEFT]]}
                monospace
              />
            ),
            onClick: () => selectItem(-1, true),
          },
          {
            uuid: 'Close current file',
            beforeIcon: (
              <KeyboardTextGroup
                addPlusSignBetweenKeys
                keyTextGroups={[[KEY_SYMBOL_META, KEY_SYMBOL_SHIFT, KEY_SYMBOL_C]]}
                monospace
              />
            ),
            onClick: () => removeOpenFilePaths([selectedFilePath]),
          },
        ],
      },
    ];
  }, [
    contentByFilePath,
    removeOpenFilePaths,
    saveFile,
    selectedFilePath,
    setShowHiddenFiles,
    showHiddenFiles,
  ]);

  const menuMemo = useMemo(() => (
    <FlexContainer alignItems="center" justifyContent="space-between">
      <Flex flex={1}>
        <FileEditorHeader
          menuGroups={headerMenuGroups}
        />
      </Flex>
      <Spacing mr={1} />
    </FlexContainer>
  ), [
    headerMenuGroups,
  ]);

  const {
    contextMenu: contextMenuFileTabs,
    hideContextMenu: hideContextMenuFileTabs,
    showContextMenu: showContextMenuFileTabs,
  } = useContextMenu(`${uuid}/FileTabs`);

  const onContextMenuFileTabs = useCallback((event: MouseEvent, filePath: string) => {
    const menuItems = [
      {
        uuid: 'Close tab',
        onClick: () => {
          removeOpenFilePaths([filePath]);
          hideContextMenuFileTabs();
        },
      },

      {
        uuid: 'Close all tabs',
        onClick: () => {
          openFilePaths?.forEach((fp) => {
            if (!filesTouched?.[fp]) {
              removeOpenFilePaths([fp]);
            }
          });
          hideContextMenuFileTabs();
        },
      },
      {
        uuid: 'Close all other tabs',
        onClick: () => openFilePaths?.forEach((fp) => {
          if (fp !== filePath && !filesTouched?.[fp]) {
            removeOpenFilePaths([fp]);
          }
          hideContextMenuFileTabs();
        }),
      },
      {
        uuid: 'Close all tabs to the right',
        onClick: () => {
          const idx = openFilePaths?.findIndex((fp: string) => fp === filePath);
          openFilePaths?.slice(idx + 1)?.forEach((fp) => {
            if (!filesTouched?.[fp]) {
              removeOpenFilePaths([fp]);
            }
          });
          hideContextMenuFileTabs();
        },
      },
      {
        uuid: 'Close tabs with files saved',
        onClick: () => {
          openFilePaths?.forEach((fp: string) => {
            if (!filesTouched?.[fp]) {
              removeOpenFilePaths([fp]);
            }
          });
          hideContextMenuFileTabs();
        },
      },
      {
        uuid: 'Copy file path',
        onClick: () => {
          alert(`${filePath} is copied to your clipboard.`);
          hideContextMenuFileTabs();
        },
        render: (el) => (
          <CopyToClipboard
            text={filePath}
          >
            {el}
          </CopyToClipboard>
        ),
      },
    ];

    showContextMenuFileTabs(event, {
      menuItems,
    });
  }, [
    filesTouched,
    hideContextMenuFileTabs,
    openFilePaths,
    removeOpenFilePaths,
    showContextMenuFileTabs,
  ]);

  const {
    tabs,
    tabsBefore,
  } = useFileTabs({
    filePaths: openFilePaths,
    filesTouched,
    isSelectedFilePath: (filePath: string, selectedFilePath: string) => filePath === selectedFilePath,
    onClickTab: (filePath: string) => {
      setSelectedFilePath(filePath);

      if (onSelectFile) {
        onSelectFile?.(filePath);
      }
    },
    onClickTabClose: (filePath: string) => {
      removeOpenFilePaths([filePath]);
      if (onClickTabClose) {
        onClickTabClose?.(filePath);
      }
    },
    onContextMenu: onContextMenuFileTabs,
    renderTabTitle: (filePath: string) => {
      const filename = getFilenameFromFilePath(filePath);
      const arr = openFilenameMapping[filename];
      if (arr && arr?.length >= 2) {
        return filePath;
      }

      return filename;
    },
    selectedFilePath,
  });

  const fileTabsMemo = useMemo(() => (
    <FileTabsScroller
      // @ts-ignore
      fileTabs={tabsBefore?.concat(tabs)}
      selectedFilePathIndex={selectedFilePathIndex}
    >
      {contextMenuFileTabs}
    </FileTabsScroller>
  ), [contextMenuFileTabs, selectedFilePathIndex, tabs, tabsBefore]);

  const fileVersionsMemo = useMemo(() => (
    <ApiReloader uuid={`FileVersions/${selectedFilePath
        ? decodeURIComponent(selectedFilePath)
        : '__missing_file_path__'
      }`
    }>
      <FileVersions
        selectedFilePath={selectedFilePath}
        setErrors={showError}
      />
    </ApiReloader>
  ), [
    selectedFilePath,
    showError,
  ]);

  const footerMemo = useMemo(() => {
    return (
      <StatusFooter
        inline
        pipelineContentTouched={!!contentTouchedMapping?.[selectedFilePath]}
        pipelineLastSaved={Number(lastSavedMapping?.[selectedFilePath])}
        refreshInterval={0}
        saveStatus={saveStatus}
      />
    );
  }, [
    contentTouchedMapping,
    lastSavedMapping,
    saveStatus,
    selectedFilePath,
  ]);

  return {
    browser: fileBrowserMemo,
    browserFlatten: fileBrowserFlattenMemo,
    controller,
    fetchFiles,
    filePaths: openFilePaths,
    files,
    filesTouched,
    footer: footerMemo,
    menu: menuMemo,
    openFile,
    selectedFilePath,
    tabs: fileTabsMemo,
    versions: fileVersionsMemo,
    versionsVisible: fileVersionsVisible,
  };
}

export default useFileComponents;