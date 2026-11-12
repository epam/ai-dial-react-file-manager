import type { DestinationFolderMode } from '../types/file-manager';
import type { DialFile, DialFileNodeType } from './file';

export interface DialCopiedItem {
  sourceUrl: string;
  destinationUrl: string;
  overwrite?: boolean;
  nodeType: DialFileNodeType;
}

export interface DialDeletedItem {
  sourceUrl: string;
  nodeType: DialFileNodeType;
}

export interface DialUploadFileItem {
  fileContent: File;
  name: string;
}

export interface DialFileManagerActionsRef {
  createFolder: () => void;
}

export type DialFileAcceptType =
  | `${string}/${string}` // MIME (wildcard)
  | `.${string}`; // extension

/** A Copy or Move the user started; the host picks a destination and then calls `confirm`. */
export interface DialDestinationRequest {
  /** Whether the items are being copied or moved. */
  mode: DestinationFolderMode;
  /** The items to copy or move. */
  items: DialFile[];
  /** Path of the folder the items are in. */
  sourceFolder: string;
  /** Copies or moves the items into `destinationFolder`; name conflicts are resolved by the file manager first. */
  confirm: (destinationFolder: string) => void;
  /** Abandons the request; call it when the host closes its destination UI without confirming. */
  cancel: () => void;
}
