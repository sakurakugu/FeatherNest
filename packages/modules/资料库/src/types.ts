import type { paths } from '@personal-system/api/generated/system'

export type MaterialListResponse = paths['/materials']['get']['responses'][200]['content']['application/json']
export type MaterialRecord = MaterialListResponse['items'][number]
export type MaterialType = MaterialRecord['type']
export type MaterialStatus = MaterialRecord['status']
export type MaterialAssetRecord = MaterialRecord['assets'][number]
export type MaterialPayload = paths['/materials']['post']['requestBody']['content']['application/json']
export type MaterialAssetPayload = NonNullable<MaterialPayload['assets']>[number]
export type MaterialTagStat = paths['/materials/tags']['get']['responses'][200]['content']['application/json'][number]
export type MaterialBatchStatusPayload = paths['/materials/batch/status']['post']['requestBody']['content']['application/json']

export interface MaterialListQuery {
  page?: number
  page_size?: number
  status?: MaterialStatus | ''
  type?: MaterialType | ''
  tag?: string
  keyword?: string
  is_deleted?: boolean
}
