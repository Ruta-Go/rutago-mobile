/// <reference types="jest" />

jest.mock("@/services/colaOffline", () => ({
  mutarConCola: jest.fn(),
  listarPendientes: jest.fn(async () => []),
}));

import { act, renderHook } from "@testing-library/react-native";

import { useUnirseViaje } from "@/hooks/useUnirseViaje";
import { mutarConCola } from "@/services/colaOffline";
import { useUnionesStore } from "@/store/unionesStore";
import type { Viaje } from "@/types/rutago";

const ejecutar = mutarConCola as jest.Mock;

const viaje: Viaje = {
  id: 12,
  ruta: { origen: { nombre: "Terminal" }, destino: { nombre: "Universidad" } },
};

describe("useUnirseViaje", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useUnionesStore.setState({ uniones: {} });
  });

  it("oculta el viaje y lo marca sincronizado cuando hay conexión", async () => {
    ejecutar.mockResolvedValue({
      ok: true,
      offline: false,
      datos: { message: "Te uniste al viaje." },
    });
    const onExito = jest.fn();

    const { result } = await renderHook(() => useUnirseViaje({ onExito }));

    await act(async () => {
      await result.current.mutateAsync(viaje);
    });

    expect(ejecutar).toHaveBeenCalledWith({
      metodo: "POST",
      url: "/viajes/12/unirse",
    });
    expect(onExito).toHaveBeenCalledWith(
      expect.objectContaining({ viajeId: 12, offline: false }),
      viaje,
    );
    expect(useUnionesStore.getState().uniones[12]).toMatchObject({
      estado: "sincronizada",
    });
  });

  it("guarda la solicitud como pendiente cuando no hay red", async () => {
    ejecutar.mockResolvedValue({
      ok: true,
      offline: true,
      pendiente: {
        id: "1",
        metodo: "POST",
        url: "/viajes/12/unirse",
        creadaEn: 1,
        intentos: 0,
      },
    });
    const onExito = jest.fn();

    const { result } = await renderHook(() => useUnirseViaje({ onExito }));

    await act(async () => {
      await result.current.mutateAsync(viaje);
    });

    expect(onExito).toHaveBeenCalledWith(
      expect.objectContaining({
        offline: true,
        mensaje: expect.stringContaining("cuando vuelva la conexión"),
      }),
      viaje,
    );
    expect(useUnionesStore.getState().uniones[12]).toMatchObject({
      estado: "pendiente",
    });
  });

  it("revierte la marca y avisa cuando el servidor rechaza la unión", async () => {
    const error = Object.assign(new Error("Conflict"), {
      isAxiosError: true,
      response: { status: 409, data: { message: "El viaje ya está lleno" } },
    });
    ejecutar.mockResolvedValue({ ok: false, offline: false, error });
    const onFallo = jest.fn();

    const { result } = await renderHook(() => useUnirseViaje({ onFallo }));

    await act(async () => {
      await expect(result.current.mutateAsync(viaje)).rejects.toBe(error);
    });

    expect(useUnionesStore.getState().uniones[12]).toBeUndefined();
    expect(onFallo).toHaveBeenCalledWith("El viaje ya está lleno", viaje);
  });
});
