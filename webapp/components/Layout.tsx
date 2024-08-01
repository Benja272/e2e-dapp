import React, { ReactNode, useState, createContext } from 'react'
import Head from 'next/head'
import NextLink from 'next/link'
import { ObsState } from '../utils/parameters'
import { Lucid } from 'lucid-cardano'
import { Account } from 'use-cardano'
import { Connect } from './Connect'
import { Start } from './Start'
import { BsSunFill, BsMoonFill } from 'react-icons/bs'
import {
  Flex,
  Link,
  Heading,
  Divider,
  Button,
  useColorMode,
  useColorModeValue
} from '@chakra-ui/react'
import SmallWithSocial from './Footer'

export interface ChildNavigationLink {
  name: string
  url: string
}

export interface NavigationLink {
  name: string
  url: string
  hasChildren?: boolean
  children?: ChildNavigationLink[]
}

type Props = {
  children?: ReactNode
}

export const OrderBookContext = createContext<{
  currentContractState: ObsState
  setCurrentContractState:
    | React.Dispatch<React.SetStateAction<ObsState>>
    | undefined
  isConnected: boolean
  setIsConnected: React.Dispatch<React.SetStateAction<boolean>> | undefined
  showStartModal: boolean
  setShowStartModal: React.Dispatch<React.SetStateAction<boolean>> | undefined
  lucidState: Lucid | undefined
  setLucidState: React.Dispatch<React.SetStateAction<Lucid>> | undefined
  account: Account | undefined
  setAccountState: React.Dispatch<React.SetStateAction<Account>> | undefined
}>({
  currentContractState: { ordersInfo: [], networkId: 0 },
  setCurrentContractState: undefined,
  isConnected: false,
  setIsConnected: undefined,
  showStartModal: false,
  setShowStartModal: undefined,
  lucidState: undefined,
  setLucidState: undefined,
  account: undefined,
  setAccountState: undefined
})

const Layout = ({ children }: Props) => {
  const [currentContractState, setCurrentContractState] = useState<ObsState>({
    ordersInfo: [],
    networkId: 0
  })
  const [isConnected, setIsConnected] = useState(false)
  const [showStartModal, setShowStartModal] = useState(false)
  const [lucidState, setLucidState] = useState<Lucid>()
  const [account, setAccountState] = useState<Account>()
  const [pagepath, setPagePath] = useState('all-orders')
  const { colorMode, toggleColorMode } = useColorMode()
  const hcolor = useColorModeValue('teal.600', 'teal.200')
  return (
    <OrderBookContext.Provider
      value={{
        currentContractState,
        setCurrentContractState,
        isConnected,
        setIsConnected,
        showStartModal,
        setShowStartModal,
        lucidState,
        setLucidState,
        account,
        setAccountState
      }}
    >
      <div
        style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}
      >
        <Head>
          <title>Order Book FiLabs</title>
          <meta charSet='utf-8' />
          <meta
            name='viewport'
            content='initial-scale=1.0, width=device-width'
          />
        </Head>
        <header>
          <nav>
            <Flex as='header' align='center' justify='space-between' p={4}>
              <Heading as='h2' size='xl' letterSpacing='-0.1rem'>
                Order Book
              </Heading>
              <Flex align='center' gap={2}>
                {isConnected && (
                  <>
                    <Start
                      lucidState={lucidState}
                      showStartModal={showStartModal}
                      setShowStartModal={setShowStartModal}
                    />
                    <Divider orientation='vertical' h={8} margin={2} />
                    {pagepath === 'own-orders' ? (
                      <>
                        <Link
                          textColor={hcolor}
                          fontWeight='bold'
                          as={NextLink}
                          href='/orders/all-orders'
                          onClick={() => setPagePath('all-orders')}
                        >
                          Fill Orders
                        </Link>
                        <Divider orientation='vertical' h={8} margin={2} />
                        <Link
                          textColor={hcolor}
                          fontWeight='bold'
                          as={NextLink}
                          href='/orders/history'
                          onClick={() => setPagePath('history')}
                        >
                          History
                        </Link>
                      </>
                    ) : pagepath === 'all-orders' ? (
                      <>
                        <Link
                          textColor={hcolor}
                          fontWeight='bold'
                          as={NextLink}
                          href='/orders/own-orders'
                          onClick={() => setPagePath('own-orders')}
                        >
                          Own Orders
                        </Link>
                        <Divider orientation='vertical' h={8} margin={2} />
                        <Link
                          textColor={hcolor}
                          fontWeight='bold'
                          as={NextLink}
                          href='/orders/history'
                          onClick={() => setPagePath('history')}
                        >
                          History
                        </Link>
                      </>
                    ) : (
                      <>
                        <Link
                          textColor={hcolor}
                          fontWeight='bold'
                          as={NextLink}
                          href='/orders/own-orders'
                          onClick={() => setPagePath('own-orders')}
                        >
                          Own Orders
                        </Link>
                        <Divider orientation='vertical' h={8} margin={2} />
                        <Link
                          textColor={hcolor}
                          fontWeight='bold'
                          as={NextLink}
                          href='/orders/all-orders'
                          onClick={() => setPagePath('all-orders')}
                        >
                          Fill Orders
                        </Link>
                      </>
                    )}
                    <Divider orientation='vertical' h={8} margin={2} />
                  </>
                )}
                <Button
                  onClick={toggleColorMode}
                  textColor={hcolor}
                  variant={'ghost'}
                >
                  {colorMode === 'light' ? <BsMoonFill /> : <BsSunFill />}
                </Button>
                <Divider orientation='vertical' h={8} margin={2} />
                <Connect
                  setIsConnected={setIsConnected}
                  setLucidState={setLucidState}
                  setAccountState={setAccountState}
                />
              </Flex>
            </Flex>
          </nav>
        </header>
        <main style={{ flex: '1' }}>{children}</main>
        <footer>{SmallWithSocial()}</footer>
      </div>
    </OrderBookContext.Provider>
  )
}

export default Layout
