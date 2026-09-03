import React, { useEffect, useState } from "react";
import ProductTable from "../components/ProductTable";
import ProductForm, { type ProductFormMode, type ProductFormValues } from "../components/ProductForm";
import type { Product } from "../types";
import * as productsApi from "@/services/api/products.api";
import * as areasApi from "@/services/api/areas.api";
import type { Area } from "@/services/api/areas.api";
import { Package, Plus, X } from "lucide-react";

const AdminProductsPage: React.FC = () => {
  const [items, setItems] = useState<Product[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formMode, setFormMode] = useState<ProductFormMode | null>(null);
  const [editing, setEditing] = useState<Product | null>(null);

  const [historyOf, setHistoryOf] = useState<Product | null>(null);
  const [history, setHistory] = useState<Product[]>([]);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const [productsResult, areasResult] = await Promise.all([
        productsApi.getProducts({ pageSize: 500 }),
        areasApi.getAreas(),
      ]);
      setItems(productsResult.items);
      setAreas(areasResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar el catálogo de productos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  function onCreate() {
    setEditing(null);
    setFormMode("create");
  }
  function onEdit(item: Product) {
    setEditing(item);
    setFormMode("edit");
  }
  function onDeactivate(item: Product) {
    setEditing(item);
    setFormMode("deactivate");
  }
  async function onHistory(item: Product) {
    setHistoryOf(item);
    try {
      setHistory(await productsApi.getProductHistory(item.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar el historial");
    }
  }

  async function handleSubmit(values: ProductFormValues) {
    setError(null);
    try {
      if (formMode === "create") {
        await productsApi.createProduct({
          codigo: values.codigo,
          nombre: values.nombre,
          vol: values.vol || null,
          envase: values.envase || null,
          areaId: values.areaId,
        });
      } else if (formMode === "edit" && editing) {
        await productsApi.updateProduct(editing.id, {
          codigo: values.codigo,
          nombre: values.nombre,
          vol: values.vol || null,
          envase: values.envase || null,
          areaId: values.areaId,
          changeReason: values.changeReason,
        });
      } else if (formMode === "deactivate" && editing) {
        await productsApi.deactivateProduct(editing.id, values.changeReason);
      }
      setFormMode(null);
      setEditing(null);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar el producto");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title flex items-center gap-3">
            <Package className="text-primary-600" size={28} />
            Catálogo de Productos
          </h1>
          <p className="page-subtitle">
            Define los productos por área. Cada edición queda versionada y trazable.
          </p>
        </div>
        <button className="btn-primary" onClick={onCreate}>
          <Plus size={18} /> Nuevo Producto
        </button>
      </div>

      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">{error}</div>
      )}

      {formMode && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">
              {formMode === "create" && "Nuevo producto"}
              {formMode === "edit" && `Editar producto — ${editing?.nombre}`}
              {formMode === "deactivate" && `Desactivar producto — ${editing?.nombre}`}
            </h3>
          </div>
          <ProductForm
            mode={formMode}
            initial={editing}
            areas={areas}
            onSubmit={handleSubmit}
            onCancel={() => {
              setFormMode(null);
              setEditing(null);
            }}
          />
        </div>
      )}

      {historyOf && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Historial de versiones — {historyOf.nombre}</h3>
            <button className="btn-icon" onClick={() => setHistoryOf(null)}>
              <X size={16} />
            </button>
          </div>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600 bg-gray-50">
                  <th className="py-2 px-3">Versión</th>
                  <th className="py-2 px-3">Nombre</th>
                  <th className="py-2 px-3">Vol.</th>
                  <th className="py-2 px-3">Envase</th>
                  <th className="py-2 px-3">Vigente desde</th>
                  <th className="py-2 px-3">Vigente hasta</th>
                  <th className="py-2 px-3">Motivo del cambio</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.id} className="border-t">
                    <td className="py-2 px-3">v{h.version}</td>
                    <td className="py-2 px-3">{h.nombre}</td>
                    <td className="py-2 px-3">{h.vol ?? "—"}</td>
                    <td className="py-2 px-3">{h.envase ?? "—"}</td>
                    <td className="py-2 px-3">{new Date(h.validFrom).toLocaleString()}</td>
                    <td className="py-2 px-3">{h.validTo ? new Date(h.validTo).toLocaleString() : "vigente"}</td>
                    <td className="py-2 px-3">{h.changeReason ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {loading ? (
        <div className="card p-8 text-center text-gray-500">Cargando productos...</div>
      ) : (
        <ProductTable
          data={items}
          areas={areas}
          onEdit={onEdit}
          onDeactivate={onDeactivate}
          onHistory={onHistory}
        />
      )}
    </div>
  );
};

export default AdminProductsPage;
