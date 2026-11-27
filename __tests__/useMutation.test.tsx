/// <reference types="jest" />

import { act, renderHook } from "@testing-library/react-native";

import { useMutation } from "@/hooks/useMutation";

describe("useMutation", () => {
  it("ejecuta onMutate, mutationFn, onSuccess y onSettled en orden", async () => {
    const orden: string[] = [];

    const { result } = await renderHook(() =>
      useMutation<{ id: number }, { id: number }, { previo: number }>({
        mutationFn: async (variables) => {
          orden.push("mutationFn");
          return { id: variables.id };
        },
        onMutate: (variables) => {
          orden.push("onMutate");
          return { previo: variables.id };
        },
        onSuccess: (data, _variables, contexto) => {
          orden.push(`onSuccess:${data.id}:${contexto.previo}`);
        },
        onError: () => {
          orden.push("onError");
        },
        onSettled: (data, error) => {
          orden.push(`onSettled:${Boolean(data)}:${error === null}`);
        },
      }),
    );

    await act(async () => {
      await result.current.mutateAsync({ id: 7 });
    });

    expect(orden).toEqual([
      "onMutate",
      "mutationFn",
      "onSuccess:7:7",
      "onSettled:true:true",
    ]);
    expect(result.current.estado).toBe("success");
    expect(result.current.data).toEqual({ id: 7 });
    expect(result.current.error).toBeNull();
  });

  it("revierte con onError y cierra con onSettled cuando la petición falla", async () => {
    const orden: string[] = [];
    const fallo = new Error("sin red");

    const { result } = await renderHook(() =>
      useMutation<void, number, { previo: number }>({
        mutationFn: async () => {
          orden.push("mutationFn");
          throw fallo;
        },
        onMutate: (valor) => {
          orden.push("onMutate");
          return { previo: valor };
        },
        onSuccess: () => {
          orden.push("onSuccess");
        },
        onError: (error, _valor, contexto) => {
          orden.push(`onError:${(error as Error).message}:${contexto.previo}`);
        },
        onSettled: (data, error) => {
          orden.push(`onSettled:${data === undefined}:${error === fallo}`);
        },
      }),
    );

    await act(async () => {
      await expect(result.current.mutateAsync(3)).rejects.toBe(fallo);
    });

    expect(orden).toEqual([
      "onMutate",
      "mutationFn",
      "onError:sin red:3",
      "onSettled:true:true",
    ]);
    expect(result.current.estado).toBe("error");
    expect(result.current.error).toBe(fallo);
  });

  it("no envía la petición si onMutate falla y notifica el error", async () => {
    const mutationFn = jest.fn(async () => "ok");
    const onError = jest.fn();

    const { result } = await renderHook(() =>
      useMutation<string, void>({
        mutationFn,
        onMutate: () => {
          throw new Error("no se pudo preparar");
        },
        onError,
      }),
    );

    await act(async () => {
      await expect(result.current.mutateAsync(undefined)).rejects.toThrow(
        "no se pudo preparar",
      );
    });

    expect(mutationFn).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledTimes(1);
    expect(result.current.estado).toBe("error");
  });

  it("reset vuelve al estado inicial", async () => {
    const { result } = await renderHook(() =>
      useMutation<string, void>({ mutationFn: async () => "ok" }),
    );

    await act(async () => {
      await result.current.mutateAsync(undefined);
    });
    expect(result.current.isSuccess).toBe(true);

    await act(async () => {
      result.current.reset();
    });

    expect(result.current.estado).toBe("idle");
    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeNull();
  });
});
