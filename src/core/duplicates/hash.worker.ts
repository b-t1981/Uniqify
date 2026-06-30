import { hashFile } from '@/core/hash/sha256'

export interface HashWorkerRequest {
  id: string
  file: File
}

export interface HashWorkerResponse {
  id: string
  hash: string
}

self.onmessage = async (event: MessageEvent<HashWorkerRequest>) => {
  const { id, file } = event.data
  const hash = await hashFile(file)
  const response: HashWorkerResponse = { id, hash }
  self.postMessage(response)
}
