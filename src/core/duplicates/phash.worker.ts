import { computePHash } from '@/core/hash/phash'

export interface PHashWorkerRequest {
  id: string
  file: File
}

export interface PHashWorkerResponse {
  id: string
  hash: string
}

self.onmessage = async (event: MessageEvent<PHashWorkerRequest>) => {
  const { id, file } = event.data
  const hash = await computePHash(file)
  const response: PHashWorkerResponse = { id, hash }
  self.postMessage(response)
}
