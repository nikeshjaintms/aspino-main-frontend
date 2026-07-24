import { toast as sonnerToast } from "sonner";

export const customToast = {
  success: (message, description = undefined) => {
    sonnerToast.success(message, {
      description,
    });
  },
  error: (message, description = undefined) => {
    sonnerToast.error(message, {
      description,
    });
  },
  info: (message, description = undefined) => {
    sonnerToast.info(message, {
      description,
    });
  },
  warning: (message, description = undefined) => {
    sonnerToast.warning(message, {
      description,
    });
  },
};
