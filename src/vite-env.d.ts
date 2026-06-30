/// <reference types="vite/client" />

interface FileSystemFileHandle {
  remove(): Promise<void>
}

interface Window {
  showOpenFilePicker?: (options?: {
    multiple?: boolean
    mode?: 'read' | 'readwrite'
    types?: Array<{
      description: string
      accept: Record<string, string[]>
    }>
  }) => Promise<FileSystemFileHandle[]>
}
