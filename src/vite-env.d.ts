/// <reference types="vite/client" />

interface Window {
  agendaDesktop?: {
    saveBackup: (content: string) => Promise<{ ok: boolean; filePath?: string }>
    openExternal: (url: string) => Promise<void>
    chooseCloudFolder: () => Promise<{ ok: boolean; folderPath?: string }>
    writeCloudFile: (payload: { folderPath: string; filename: string; content: string }) => Promise<{ ok: boolean; filePath?: string }>
    listCloudFiles: (folderPath: string) => Promise<{ ok: boolean; files: Array<{ name: string; filePath: string; size: number; modifiedAt: string }> }>
    readCloudFile: (filePath: string) => Promise<{ ok: boolean; content: string }>
    connectGoogleDrive: (clientId: string) => Promise<{ ok: boolean }>
    googleDriveStatus: () => Promise<{ connected: boolean; expiresAt: number }>
    disconnectGoogleDrive: () => Promise<{ ok: boolean }>
    uploadGoogleBackup: (payload: { clientId: string; filename: string; content: string }) => Promise<{ ok: boolean; file?: { id: string; name: string; size?: string; modifiedTime?: string } }>
    listGoogleBackups: (clientId: string) => Promise<{ ok: boolean; files: Array<{ id: string; name: string; size?: string; modifiedTime?: string }> }>
  }
}
