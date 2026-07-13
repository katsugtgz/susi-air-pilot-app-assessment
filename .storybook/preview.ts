import type { Preview } from '@storybook/vue3'
import '../app/assets/scss/tokens.scss'
import '../app/assets/css/transitions-root.css'

const preview: Preview = {
  parameters: {
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    layout: 'centered',
    viewport: {
      defaultViewport: 'mobile1',
      viewports: {
        mobile1: { name: 'Mobile 390', styles: { width: '390px', height: '844px' } },
        tablet: { name: 'Tablet 768', styles: { width: '768px', height: '1024px' } },
        desktop: { name: 'Desktop 1280', styles: { width: '1280px', height: '800px' } },
      },
    },
    backgrounds: {
      default: 'app',
      values: [{ name: 'app', value: '#F5F6F8' }],
    },
  },
}

export default preview
