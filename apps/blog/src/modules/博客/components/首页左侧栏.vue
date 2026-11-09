<script setup lang="ts">
import type { CategoryRecord, TagRecord } from '@feathernest/module-articles'
import { BlogCategoryListWidget, BlogTagCloudWidget } from '@feathernest/module-blog/widgets'
import { MusicPlayerWidget } from '@feathernest/module-music'
import NavCard from './导航卡片.vue'
import ProfileCard from './个人资料卡.vue'

defineProps<{
  topClass: string
  stickyClass: string
  categories: CategoryRecord[]
  popularTags: TagRecord[]
}>()

const emit = defineEmits<{
  tagClick: [name: string]
  categoryClick: [slug: string | null]
}>()
</script>

<template>
  <div :class="topClass">
    <ProfileCard />
  </div>

  <aside :class="stickyClass">
    <NavCard />
    <MusicPlayerWidget />
    <BlogTagCloudWidget :tags="popularTags" @tag-click="emit('tagClick', $event)" />
    <BlogCategoryListWidget :categories="categories" @category-click="emit('categoryClick', $event)" />
  </aside>
</template>
