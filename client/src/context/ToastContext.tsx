import React, { createContext, useContext } from "react";
import { toast, Toaster } from "react-hot-toast";

interface ToastContextType {
  success: (message: string) => void;
  error: (message: string) => void;
  loading: (message: string) => string;
  dismiss: (toastId?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const success = (message: string) => {
    toast.success(message, {
      duration: 4000,
      position: "top-right",
    });
  };

  const error = (message: string) => {
    toast.error(message, {
      duration: 5000,
      position: "top-right",
    });
  };

  const loading = (message: string): string => {
    return toast.loading(message, {
      position: "top-right",
    });
  };

  const dismiss = (toastId?: string) => {
    if (toastId) {
      toast.dismiss(toastId);
    } else {
      toast.dismiss();
    }
  };

  return (
    <ToastContext.Provider value={{ success, error, loading, dismiss }}>
      {children}
      <Toaster
        toastOptions={{
          style: {
            background: "#363636",
            color: "#fff",
          },
          success: {
            style: {
              background: "#10b981",
            },
          },
          error: {
            style: {
              background: "#ef4444",
            },
          },
        }}
      />
    </ToastContext.Provider>
  );
};
