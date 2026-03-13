"use client";

import React from "react";
import { FiLoader } from "react-icons/fi";

interface LoadingStateProps {
  isLoading: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  size?: "sm" | "md" | "lg";
}

/**
 * Componente de feedback visual durante carregamento
 * Renderiza skeleton/spinner enquanto carrega
 */
export default function LoadingState({
  isLoading,
  children,
  fallback,
  size = "md",
}: Readonly<LoadingStateProps>) {
  if (isLoading) {
    return fallback || <LoadingSpinner size={size} />;
  }

  return children;
}

export function LoadingSpinner({
  size = "md",
  label = "Carregando...",
}: Readonly<{
  size?: "sm" | "md" | "lg";
  label?: string;
}>) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <FiLoader className={`${sizeClasses[size]} animate-spin text-blue-600`} />
      {label && <p className="text-sm text-slate-500 font-medium">{label}</p>}
    </div>
  );
}

/**
 * Skeleton para layout durante carregamento
 */
export function Skeleton({
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`bg-slate-200 animate-pulse rounded ${className}`}
      {...props}
    />
  );
}

/**
 * Skeleton de lista com múltiplos itens
 */
export function ListSkeleton({ count = 5 }: Readonly<{ count?: number }>) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex gap-4 p-4 bg-white rounded-lg border">
          <Skeleton className="w-12 h-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton de card
 */
export function CardSkeleton() {
  return (
    <div className="p-6 bg-white rounded-xl border border-slate-200">
      <div className="space-y-4">
        <Skeleton className="h-6 w-2/3" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>
        <Skeleton className="h-8 w-32" />
      </div>
    </div>
  );
}

/**
 * Estado vazio customizável
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
}: Readonly<{
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}>) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {icon && <div className="mb-4 text-4xl opacity-50">{icon}</div>}
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      {description && (
        <p className="mt-2 text-sm text-slate-500">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
