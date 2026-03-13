/**
 * Hook para tratamento centralizado de erros
 * Mapeia erros Supabase para mensagens amigáveis
 */
import { useState, useCallback } from "react";
import toast from "react-hot-toast";

type ErrorType =
  | "auth"
  | "validation"
  | "database"
  | "network"
  | "permission"
  | "unknown";

interface ErrorInfo {
  type: ErrorType;
  message: string;
  code?: string;
  details?: Record<string, any>;
}

const ERROR_MESSAGES: Record<ErrorType, string> = {
  auth: "Erro de autenticação. Faça login novamente.",
  validation: "Dados inválidos. Verifique o formulário.",
  database: "Erro ao acessar o banco de dados.",
  network: "Erro de conexão. Verifique sua internet.",
  permission: "Você não tem permissão para fazer esta ação.",
  unknown: "Algo deu errado. Tente novamente.",
};

export function useErrorHandler() {
  const [lastError, setLastError] = useState<ErrorInfo | null>(null);

  const classifyError = useCallback((err: any): ErrorType => {
    const message = err?.message?.toLowerCase() || "";
    const code = err?.code;

    // Supabase-specific error codes
    if (code === "PGRST116") return "database";
    if (code === "401" || message.includes("unauthorized")) return "auth";
    if (code === "403" || message.includes("permission")) return "permission";
    if (message.includes("network") || message.includes("connection"))
      return "network";
    if (message.includes("invalid") || message.includes("required"))
      return "validation";

    return "unknown";
  }, []);

  const handleError = useCallback(
    (err: any, context?: string): ErrorInfo => {
      const type = classifyError(err);
      const userMessage =
        typeof err?.message === "string"
          ? err.message
          : ERROR_MESSAGES[type];

      const errorInfo: ErrorInfo = {
        type,
        message: userMessage,
        code: err?.code,
        details: err?.details,
      };

      setLastError(errorInfo);

      // Log para debugging
      console.error(`[${context || "Error"}]`, {
        ...errorInfo,
        originalError: err,
      });

      // Toast notification
      toast.error(userMessage, {
        duration: 4000,
        icon: getErrorIcon(type),
      });

      return errorInfo;
    },
    [classifyError],
  );

  const clearError = useCallback(() => {
    setLastError(null);
  }, []);

  return {
    lastError,
    handleError,
    clearError,
    classifyError,
    isAuthError: () => lastError?.type === "auth",
    isNetworkError: () => lastError?.type === "network",
    isValidationError: () => lastError?.type === "validation",
  };
}

function getErrorIcon(type: ErrorType): string {
  const icons = {
    auth: "🔐",
    validation: "⚠️",
    database: "🗄️",
    network: "📡",
    permission: "🚫",
    unknown: "❌",
  };
  return icons[type];
}

/**
 * Wrapper para async operations com error handling automático
 */
export async function handleAsync<T>(
  operation: () => Promise<T>,
  errorHandler: ReturnType<typeof useErrorHandler>,
  context?: string,
): Promise<T | null> {
  try {
    return await operation();
  } catch (err) {
    errorHandler.handleError(err, context);
    return null;
  }
}
