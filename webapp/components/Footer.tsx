import {
  Box,
  Container,
  Stack,
  Text,
  useColorModeValue
} from '@chakra-ui/react'

export default function SmallWithSocial () {
  return (
    <Box
      bg={useColorModeValue('gray.50', 'gray.900')}
      color={useColorModeValue('gray.700', 'gray.200')}
    >
      <Container
        as={Stack}
        direction={{ base: 'column', md: 'row' }}
        justify={{ base: 'center' }}
        align={{ base: 'center', md: 'center' }}
      >
        <Text marginTop='15px'>© 2023 FiLabs. All rights reserved</Text>
      </Container>
    </Box>
  )
}
