"use client";

import React, { forwardRef } from "react";
import { Input, InputProps } from "@chakra-ui/react";

const ChakraDateInput = forwardRef<HTMLInputElement, InputProps>((props, ref) => {
  return <Input ref={ref} size="sm" {...props} />;
});
ChakraDateInput.displayName = "ChakraDateInput";

export default ChakraDateInput;
