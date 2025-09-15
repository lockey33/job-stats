'use client'

import type { InputProps } from '@chakra-ui/react'
import { Input } from '@chakra-ui/react'
import React, { forwardRef } from 'react'

const ChakraDateInput = forwardRef<HTMLInputElement, InputProps>((props, ref) => {
  return <Input ref={ref} size="sm" {...props} />
})
ChakraDateInput.displayName = 'ChakraDateInput'

export default ChakraDateInput
