import { useCallback, useEffect, useRef, useState } from "react";

export type EstadoMutation = "idle" | "pending" | "success" | "error";

export type OpcionesMutation<TData, TVariables, TContext = void> = {
  mutationFn: (variables: TVariables) => Promise<TData>;

  onMutate?: (variables: TVariables) => TContext | Promise<TContext>;
  onSuccess?: (
    data: TData,
    variables: TVariables,
    contexto: TContext,
  ) => void | Promise<void>;

  onError?: (
    error: unknown,
    variables: TVariables,
    contexto: TContext,
  ) => void | Promise<void>;
  onSettled?: (
    data: TData | undefined,
    error: unknown | null,
    variables: TVariables,
    contexto: TContext,
  ) => void | Promise<void>;
};

export type ResultadoMutation<TData, TVariables> = {
  mutate: (variables: TVariables) => void;
  mutateAsync: (variables: TVariables) => Promise<TData>;
  estado: EstadoMutation;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  data: TData | undefined;
  error: unknown | null;
  variables: TVariables | undefined;
  reset: () => void;
};

async function invocarSeguro(
  accion: (() => void | Promise<void>) | undefined,
): Promise<void> {
  if (!accion) return;
  try {
    await accion();
  } catch (error) {
    console.warn("[useMutation] un callback falló y se ignoró", error);
  }
}

export function useMutation<TData, TVariables, TContext = void>(
  opciones: OpcionesMutation<TData, TVariables, TContext>,
): ResultadoMutation<TData, TVariables> {
  const [estado, setEstado] = useState<EstadoMutation>("idle");
  const [data, setData] = useState<TData>();
  const [error, setError] = useState<unknown | null>(null);
  const [variables, setVariables] = useState<TVariables>();

  const opcionesRef = useRef(opciones);
  useEffect(() => {
    opcionesRef.current = opciones;
  }, [opciones]);

  const montadoRef = useRef(true);
  useEffect(() => {
    montadoRef.current = true;
    return () => {
      montadoRef.current = false;
    };
  }, []);

  const ejecutar = useCallback(async (entrada: TVariables): Promise<TData> => {
    const actuales = opcionesRef.current;

    if (montadoRef.current) {
      setEstado("pending");
      setVariables(entrada);
      setError(null);
    }

    let contexto = undefined as TContext;
    let datos: TData | undefined;
    let fallo: unknown = null;

    try {
      contexto = (await actuales.onMutate?.(entrada)) as TContext;
    } catch (falloMutate) {
      fallo = falloMutate;
    }

    if (!fallo) {
      try {
        datos = await actuales.mutationFn(entrada);
      } catch (falloPeticion) {
        fallo = falloPeticion;
      }
    }

    if (!fallo) {
      if (montadoRef.current) {
        setData(datos);
        setEstado("success");
      }
      await invocarSeguro(() =>
        actuales.onSuccess?.(datos as TData, entrada, contexto),
      );
    } else {
      if (montadoRef.current) {
        setError(fallo);
        setEstado("error");
      }
      await invocarSeguro(() => actuales.onError?.(fallo, entrada, contexto));
    }

    await invocarSeguro(() =>
      actuales.onSettled?.(datos, fallo, entrada, contexto),
    );

    if (fallo) throw fallo;
    return datos as TData;
  }, []);

  const mutate = useCallback(
    (entrada: TVariables) => {
      void ejecutar(entrada).catch(() => undefined);
    },
    [ejecutar],
  );

  const mutateAsync = useCallback(
    (entrada: TVariables) => ejecutar(entrada),
    [ejecutar],
  );

  const reset = useCallback(() => {
    if (!montadoRef.current) return;
    setEstado("idle");
    setData(undefined);
    setError(null);
    setVariables(undefined);
  }, []);

  return {
    mutate,
    mutateAsync,
    estado,
    isPending: estado === "pending",
    isSuccess: estado === "success",
    isError: estado === "error",
    data,
    error,
    variables,
    reset,
  };
}
