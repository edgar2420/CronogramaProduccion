import React, { useEffect, useState } from "react";
import ProductTable from "../components/ProductTable";
import ProductForm, { type ProductFormMode, type ProductFormValues } from "../components/ProductForm";
import type { Product } from "../types";
import * as productsApi from "@/services/api/products.api";
import * as areasApi from "@/services/api/areas.api";
import type { Area } from "@/services/api/areas.api";
import { Package, Plus, PackagePlus, Pencil, Ban, History, AlertCircle, Loader2 } from "lucide-react";
import Modal from "@/components/ui/Modal";

const AdminProductsPage: React.FC = () => {
  const [items, setItems] = useState<Product[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formMode, setFormMode] = useState<ProductFormMode | null>(null);
  const [editing, setEditing] = useState<Product | null>(null);

  // Error y estado de guardado del modal: se muestran dentro del modal, no
  // detrás de él.
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [historyOf, setHistoryOf] = useState<Product | null>(null);
  const [history, setHistory] = useState<Product[]>([]);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const [productsResult, areasResult] = await Promise.all([
        productsApi.getAllProducts(),
        areasApi.getAreas(),
      ]);
      setItems(productsResult);
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
    setHistory([]);
    setHistoryOf(item);
    try {
      setHistory(await productsApi.getProductHistory(item.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar el historial");
    }
  }

  function closeForm() {
    setFormMode(null);
    setEditing(null);
    setFormError(null);
  }

  async function handleSubmit(values: ProductFormValues) {
    setFormError(null);
    setSaving(true);
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
      closeForm();
      await refresh();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "No se pudo guardar el producto");
    } finally {
      setSaving(false);
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

      <Modal
        open={formMode !== null}
        onClose={closeForm}
        busy={saving}
        size="lg"
        icon={formMode === "create" ? <PackagePlus size={20} /> : formMode === "edit" ? <Pencil size={20} /> : <Ban size={20} />}
        title={formMode === "create" ? "Nuevo producto" : formMode === "edit" ? "Editar producto" : "Desactivar producto"}
        description={formMode === "create" ? "Queda disponible para programar órdenes en su área." : editing?.nombre}
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={closeForm} disabled={saving}>Cancelar</button>
            <button type="submit" form="product-form" className={formMode === "deactivate" ? "btn-danger" : "btn-primary"} disabled={saving}>
              {saving && <Loader2 size={16} className="animate-spin" />}
              {formMode === "create" ? "Crear producto" : formMode === "edit" ? "Guardar nueva versión" : "Desactivar"}
            </button>
          </>
        }
      >
        {formError && (
          <div role="alert" className="form-error mb-5">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            {formError}
          </div>
        )}
        {formMode && (
          <ProductForm
            key={`${formMode}-${editing?.id ?? "nuevo"}`}
            formId="product-form"
            mode={formMode}
            initial={editing}
            areas={areas}
            onSubmit={handleSubmit}
          />
        )}
      </Modal>

      <Modal
        open={historyOf !== null}
        onClose={() => setHistoryOf(null)}
        size="xl"
        icon={<History size={20} />}
        title="Historial de versiones"
        description={historyOf?.nombre}
      >
        <div className="table-shell">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Versión</th>
                  <th>Nombre</th>
                  <th>Vol.</th>
                  <th>Envase</th>
                  <th>Vigente desde</th>
                  <th>Vigente hasta</th>
                  <th>Motivo del cambio</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.id}>
                    <td className="tabular-nums">v{h.version}</td>
                    <td className="font-medium text-slate-900">{h.nombre}</td>
                    <td className="whitespace-nowrap">{h.vol ?? "—"}</td>
                    <td>{h.envase ?? "—"}</td>
                    <td className="whitespace-nowrap">{new Date(h.validFrom).toLocaleString("es")}</td>
                    <td className="whitespace-nowrap">{h.validTo ? new Date(h.validTo).toLocaleString("es") : <span className="status-pill status-active">Vigente</span>}</td>
                    <td>{h.changeReason ?? "—"}</td>
                  </tr>
                ))}
                {history.length === 0 && (
                  <tr><td colSpan={7} className="table-empty">Cargando historial…</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>

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
