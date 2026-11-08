import type { components } from '@personal-system/api/generated/system'

export type FileItem = components['schemas']['FileRead']
export type FileFolderItem = components['schemas']['FileFolderRead']
export type FileTreeNode = components['schemas']['FileFolderTreeNodeRead']
export type FileBreadcrumbItem = components['schemas']['FileBreadcrumbRead']
export type FileExplorerData = components['schemas']['FileExplorerRead']
export type FileSearchFolderItem = components['schemas']['FileFolderSearchRead']
export type FileSearchFileItem = components['schemas']['FileSearchItemRead']
export type FileSearchData = components['schemas']['FileSearchRead']
export type FileTrashItem = components['schemas']['FileTrashItemRead']
export type FileTrashData = components['schemas']['FileTrashRead']

export type FilePurpose = FileItem['purpose']
export type FileTrashItemType = FileTrashItem['type']
