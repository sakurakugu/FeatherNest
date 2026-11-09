import type { AppModule } from '@feathernest/app-core'

const sharedModules = import.meta.glob<AppModule>(
  '../../../../packages/modules/*/src/manifest.ts',
  { eager: true, import: 'default' },
)
const localModules = import.meta.glob<AppModule>('../modules/*/manifest.ts', {
  eager: true,
  import: 'default',
})

export const consoleModules = [...Object.values(sharedModules), ...Object.values(localModules)]
