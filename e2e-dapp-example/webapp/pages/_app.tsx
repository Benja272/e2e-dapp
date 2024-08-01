import { CacheProvider } from '@chakra-ui/next-js'
import { ChakraProvider } from '@chakra-ui/react'
import 'use-cardano/styles/use-cardano.css'
import '../styles/use-cardano-overrides.css'
import 'bootstrap/dist/css/bootstrap.css'

import type { AppProps } from 'next/app'
import { CardanoProvider, UseCardanoOptions } from 'use-cardano'
import Layout from '../components/Layout'
import theme from '../styles/theme'

const options: UseCardanoOptions = {
  allowedNetworks: ['Testnet'],
  testnetNetwork: 'Preprod',
  node: {
    provider: 'blockfrost',
    projectId: process.env.NEXT_PUBLIC_BLOCKFROST_PROJECT_ID
  }
}

export default function App ({ Component, pageProps }: AppProps) {
  return (
    <CacheProvider>
      <ChakraProvider theme={theme}>
        <CardanoProvider options={options}>
          <Layout>
            <Component {...pageProps} />
          </Layout>
        </CardanoProvider>
      </ChakraProvider>
    </CacheProvider>
  )
}
