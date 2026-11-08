import api from '@feathernest/api'

export async function 删除文件(articleId: string, id: string): Promise<void> {
  await api.delete(`/articles/${articleId}/images/${id}`)
}
