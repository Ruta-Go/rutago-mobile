/// <reference types="jest" />

jest.mock("@/services/colaOffline", () => ({
  listarPendientes: jest.fn(async () => []),
}));

import { listarPendientes } from "@/services/colaOffline";
import { useUnionesStore, viajeIdDeUrl } from "@/store/unionesStore";

const listar = listarPendientes as jest.Mock;

describe("unionesStore", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useUnionesStore.setState({ uniones: {} });
    listar.mockResolvedValue([]);
  });

  it("reconoce la URL de unión y descarta otras escrituras", () => {
    expect(viajeIdDeUrl("/viajes/8/unirse")).toBe(8);
    expect(viajeIdDeUrl("/viajes/8/unirse/")).toBe(8);
    expect(viajeIdDeUrl("/viajes/8/bajarse")).toBeNull();
    expect(viajeIdDeUrl("/vehiculos/8/ubicacion")).toBeNull();
  });

  it("pasa de pendiente a sincronizada cuando la cola confirma el envío", () => {
    useUnionesStore.getState().marcarPendiente(8, "Terminal → Universidad");

    useUnionesStore.getState().aplicarResultados([
      {
        id: "a",
        metodo: "POST",
        url: "/viajes/8/unirse",
        ok: true,
        descartada: false,
      },
    ]);

    expect(useUnionesStore.getState().uniones[8]).toMatchObject({
      estado: "sincronizada",
      titulo: "Terminal → Universidad",
    });
  });

  it("marca fallida con el mensaje del backend cuando la descartan", () => {
    useUnionesStore.getState().marcarPendiente(9, "Ruta 9");

    useUnionesStore.getState().aplicarResultados([
      {
        id: "b",
        metodo: "POST",
        url: "/viajes/9/unirse",
        ok: false,
        descartada: true,
        estado: 409,
        mensaje: "El viaje ya está lleno",
      },
    ]);

    expect(useUnionesStore.getState().uniones[9]).toMatchObject({
      estado: "fallida",
      mensaje: "El viaje ya está lleno",
    });
  });

  it("ignora resultados de recursos que no son uniones", () => {
    useUnionesStore.getState().marcarPendiente(8, "Ruta 8");

    useUnionesStore.getState().aplicarResultados([
      {
        id: "c",
        metodo: "PUT",
        url: "/vehiculos/3/ubicacion",
        ok: true,
        descartada: false,
      },
    ]);

    expect(useUnionesStore.getState().uniones[8]).toMatchObject({
      estado: "pendiente",
    });
  });

  it("recupera de la cola las uniones guardadas en una sesión anterior", async () => {
    listar.mockResolvedValue([
      {
        id: "d",
        metodo: "POST",
        url: "/viajes/15/unirse",
        creadaEn: 123,
        intentos: 0,
      },
      {
        id: "e",
        metodo: "PUT",
        url: "/vehiculos/2/ubicacion",
        creadaEn: 124,
        intentos: 0,
      },
    ]);

    await useUnionesStore.getState().hidratarDesdeCola();

    const uniones = useUnionesStore.getState().uniones;
    expect(uniones[15]).toMatchObject({
      estado: "pendiente",
      solicitadaEn: 123,
    });
    expect(uniones[2]).toBeUndefined();
  });

  it("quitar elimina sólo la unión indicada", () => {
    useUnionesStore.getState().marcarPendiente(1);
    useUnionesStore.getState().marcarPendiente(2);

    useUnionesStore.getState().quitar(1);

    expect(useUnionesStore.getState().uniones[1]).toBeUndefined();
    expect(useUnionesStore.getState().uniones[2]).toBeDefined();
  });
});
