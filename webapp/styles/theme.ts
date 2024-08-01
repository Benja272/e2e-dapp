import { extendTheme, type ThemeConfig } from '@chakra-ui/react'
import { mode } from '@chakra-ui/theme-tools'

const config: ThemeConfig = {
  initialColorMode: 'dark', // 'dark' | 'light'
  useSystemColorMode: false
}

const theme = extendTheme({
  config,
  styles: {
    global: props => ({
      body: {
        bg: mode('white', 'gray.800')(props)
      }
    })
  },
  components: {
    Table: {
      variants: {
        simple: props => ({
          th: {
            bg: mode('teal.500', 'teal.300')(props),
            borderWidth: '1px',
            borderColor: 'gray.600',
            borderTopColor: mode('teal.500', 'teal.300')(props),
            textColor: mode('white', 'gray.700')(props),
          },
          td: {
            bg: mode('gray.50', 'gray.700')(props),
            borderWidth: '1px',
            borderLeftColor: 'transparent',
            borderColor: 'gray.600',
          }
        })
      }
    }
  }
});


export default theme
