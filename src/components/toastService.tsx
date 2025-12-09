import { createStandaloneToast } from "@chakra-ui/react";

const { toast } = createStandaloneToast();

interface ToastOptions {
  status: "success" | "error" | "warning" | "info";
  title: string;
  description?: string;
  duration?: number;
  position?: "top" | "bottom" | "top-right" | "top-left" | "bottom-right" | "bottom-left";
}

export const showToast = ({
  status,
  title,
  description,
  duration = 3000,
  position = "top",
}: ToastOptions) => {
  toast({
    title,
    description,
    status,
    duration,
    isClosable: true,
    variant: "left-accent",
    position,
  });
};
