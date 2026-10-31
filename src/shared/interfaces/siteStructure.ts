export interface DepthBucket {
  depth: number
  count: number
}

export interface FolderNode {
  path: string
  count: number
}

export interface SiteStructure {
  depths: DepthBucket[]
  folders: FolderNode[]
}
