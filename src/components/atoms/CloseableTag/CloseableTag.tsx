"use client";

import { Tag } from "@chakra-ui/react";

interface Props {
  children: React.ReactNode;
  onClose: () => void;
  size?: string;
  variant?: string;
  colorPalette?: string;
  closeAriaLabel?: string;
}

export default function CloseableTag({ children, onClose, size = "sm", variant, colorPalette, closeAriaLabel }: Props) {
  return (
    <Tag.Root size={size as any} variant={variant as any} colorPalette={colorPalette as any}>
      <Tag.Label>{children}</Tag.Label>
      <Tag.CloseTrigger aria-label={closeAriaLabel ?? "Retirer"} onClick={onClose} />
    </Tag.Root>
  );
}
