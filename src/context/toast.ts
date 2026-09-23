import { createContext, useContext } from "react";
export const ToastContext = createContext<
  (message: string, error?: boolean) => void
>(() => {});
export const useToast = () => useContext(ToastContext);
