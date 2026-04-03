import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.hoya.todo',
  appName: 'hoya TODO',
  webDir: 'dist',
  // When deployed to Cloudflare Pages, update this URL
  // For local development, remove or comment out `server`
  // server: {
  //   url: 'https://hoya-todo.pages.dev',
  //   cleartext: false,
  // },
}

export default config
