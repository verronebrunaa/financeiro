/**
 * Hook para validação de formulários com Zod
 * Define tipos seguros e mensagens de erro claras
 */
import { useState, useCallback } from "react";
import { z, ZodSchema } from "zod";

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export function useFormValidation(schema: ZodSchema) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateField = useCallback(
    (fieldName: string, value: any): string | null => {
      try {
        const fieldSchema = schema instanceof z.ZodObject
          ? (schema as any).shape[fieldName]
          : null;

        if (fieldSchema) {
          fieldSchema.parse(value);
          return null;
        }

        return null;
      } catch (err) {
        if (err instanceof z.ZodError) {
          const issue = err.issues?.[0];
          return issue?.message || "Campo inválido";
        }
        return "Erro na validação";
      }
    },
    [schema],
  );

  const validateAll = useCallback(
    (data: Record<string, any>): ValidationResult => {
      try {
        // Extrair valores e validar
        const cleanData: Record<string, any> = {};
        for (const [key, val] of Object.entries(data)) {
          // Se é um objeto com {value, touched}, extrai o value
          if (val && typeof val === "object" && "value" in val) {
            cleanData[key] = val.value;
          } else {
            cleanData[key] = val;
          }
        }

        schema.parse(cleanData);
        setErrors({});
        return { isValid: true, errors: {} };
      } catch (err) {
        if (err instanceof z.ZodError) {
          const newErrors: Record<string, string> = {};
          
          if (err.issues && Array.isArray(err.issues)) {
            err.issues.forEach((issue: any) => {
              const key = issue.path?.[0];
              if (key) {
                newErrors[String(key)] = issue.message;
              }
            });
          }
          
          setErrors(newErrors);
          return { isValid: false, errors: newErrors };
        }
        return { isValid: false, errors: { _submit: "Erro na validação" } };
      }
    },
    [schema],
  );

  const handleBlur = useCallback((fieldName: string) => {
    setTouched((prev) => ({ ...prev, [fieldName]: true }));
  }, []);

  const handleChange = useCallback(
    (fieldName: string, value: any) => {
      const error = validateField(fieldName, value);
      setErrors((prev) => {
        const newErrors = { ...prev };
        if (error) {
          newErrors[fieldName] = error;
        } else {
          delete newErrors[fieldName];
        }
        return newErrors;
      });
    },
    [validateField],
  );

  const clearErrors = useCallback(() => {
    setErrors({});
    setTouched({});
  }, []);

  const getFieldError = useCallback(
    (fieldName: string) => {
      return touched[fieldName] ? errors[fieldName] : null;
    },
    [errors, touched],
  );

  return {
    errors,
    touched,
    validateField,
    validateAll,
    handleBlur,
    handleChange,
    clearErrors,
    getFieldError,
    hasError: (fieldName: string) => !!errors[fieldName],
  };
}

// Schemas reutilizáveis
export const transactionSchema = z.object({
  description: z.string().min(1, "Descrição obrigatória").max(255),
  amount: z.number().positive("Valor deve ser maior que 0"),
  category: z.string().optional(),
  competence_date: z.string().optional(),
  due_date: z.string().optional(),
  type: z.enum(["entrada", "saida"]),
});

export const budgetSchema = z.object({
  limit_amount: z.number().positive("Limite deve ser maior que 0"),
  category_id: z.string().min(1, "Categoria obrigatória"),
  month: z.string().regex(/^\d{4}-\d{2}$/, "Formato inválido"),
});

export const goalSchema = z.object({
  title: z.string().min(1, "Título obrigatório").max(255),
  target_amount: z.number().positive("Meta deve ser positiva"),
  deadline: z.string().optional(),
});

export const categorySchema = z.object({
  name: z.string().min(1, "Nome obrigatório").max(100),
  type: z.enum(["receita", "despesa"]),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, "Cor inválida").optional(),
  parent_id: z.string().uuid().optional().nullable(),
});
