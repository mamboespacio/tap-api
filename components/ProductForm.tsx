'use client';

import React, { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { upload } from '@vercel/blob/client';
import { type PutBlobResult } from '@vercel/blob';
import axios from 'axios';
import { api } from '@/lib/api'; // tu instancia axios

const productSchema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres'),
  description: z.string().min(10, 'Contá un poco más del producto').optional(),
  price: z.coerce.number().positive('Precio inválido'),
  stock: z.coerce.number().int().min(0, 'No puede ser negativo'),
  categoryId: z.string().min(1, 'Elegí una categoría'), // string en el form; en server se coercea
  active: z.boolean().default(true),
});

type FormValues  = z.input<typeof productSchema>;   // active?: boolean
type FormOutput  = z.output<typeof productSchema>;  // active:  boolean
type Category = { id: string; name: string };

type Props = {
  categories: Category[];
  defaultCategoryId?: string;
  onCreated?: (id: number | string) => void;
};

export default function ProductForm({ categories, defaultCategoryId, onCreated }: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [image, setImage] = useState<{ file: File; previewUrl: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [clientErrors, setClientErrors] = useState<string[]>([]);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      active: true,
      categoryId: defaultCategoryId ?? (categories[0]?.id ?? ''),
      stock: 0,
    },
    mode: 'onSubmit',
  });

  const onInvalid = (errs: any) => {
    // muestra un resumen arriba
    const msgs = Object.values(errs).map((e: any) => e?.message).filter(Boolean) as string[];
    setClientErrors(msgs);
    console.warn('Validaciones del form:', errs);
  };

  const onAddFile = (files: FileList | null) => {
    if (!files || !files.length) return;
    const f = files[0];
    if (image?.previewUrl) URL.revokeObjectURL(image.previewUrl);
    setImage({ file: f, previewUrl: URL.createObjectURL(f) });
  };

  const removeImage = () => {
    if (image?.previewUrl) URL.revokeObjectURL(image.previewUrl);
    setImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const onSubmit = async (values: FormValues) => {
    console.log('[ProductForm] submit start', values);
    setSubmitting(true);
    setServerError(null);
    setClientErrors([]);

    try {
      // sellamos valores (active garantizado)
      const data: FormOutput = productSchema.parse(values);

      if (!image) throw new Error('Subí la imagen del producto');

      const uploaded: PutBlobResult = await upload(image.file.name, image.file, {
        access: 'public',
        handleUploadUrl: '/api/blob/upload',
      });
      const imageUrl = uploaded.url;

      const payload = {
        name: data.name,
        description: data.description?.trim() ? data.description.trim() : undefined,
        price: data.price,
        stock: data.stock,
        active: data.active ?? true,
        categoryId: data.categoryId, // string -> el server lo coercea a number
        imageUrl,
      };

      console.log('[ProductForm] POST /api/products payload', payload);
      const res = await api.post('/api/products', payload);
      console.log('[ProductForm] created:', res.data);

      if (image?.previewUrl) URL.revokeObjectURL(image.previewUrl);
      setImage(null);
      reset();
      onCreated?.(res.data?.id ?? res.data?.product?.id ?? '');
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const msg =
          (err.response?.data as any)?.error ??
          (err.response?.data as any)?.message ??
          err.message;
        setServerError(String(msg));
        console.error('[ProductForm] axios error:', err.response?.status, err.response?.data);
      } else if (err instanceof Error) {
        setServerError(err.message);
        console.error('[ProductForm] error:', err.message);
      } else {
        setServerError('Error desconocido');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="max-w-2xl space-y-6">
      {/* resumen de errores */}
      {(serverError || clientErrors.length > 0) && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800 space-y-1">
          {serverError && <div>⚠ {serverError}</div>}
          {clientErrors.map((e, i) => (<div key={i}>• {e}</div>))}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium">Nombre</label>
        <input {...register('name')} className="mt-1 w-full rounded-lg border p-2" placeholder="Carajillo" />
        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium">Descripción</label>
        <textarea {...register('description')} rows={4} className="mt-1 w-full rounded-lg border p-2" placeholder="Un auténtico trago mexicano" />
        {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Precio</label>
          <input type="number" step="0.01" inputMode="decimal" {...register('price', { valueAsNumber: true })} className="mt-1 w-full rounded-lg border p-2" placeholder="0.00" />
          {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium">Stock</label>
          <input type="number" {...register('stock', { valueAsNumber: true })} className="mt-1 w-full rounded-lg border p-2" placeholder="0" />
          {errors.stock && <p className="mt-1 text-sm text-red-600">{errors.stock.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Categoría</label>
          <select {...register('categoryId')} className="mt-1 w-full rounded-lg border p-2">
            <option value="">Seleccioná</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          {errors.categoryId && <p className="mt-1 text-sm text-red-600">{errors.categoryId.message}</p>}
        </div>
        
        <div className="">
          <label className="block text-sm font-medium">Estado del producto</label>
          <div className='flex items-center gap-2 p-2 mt-1 border rounded-lg'>
            <input id="active" type="checkbox" {...register('active')} className="h-4 w-4" defaultChecked/>
            <label htmlFor="active" className="text-sm">Activo (listado visible)</label>
          </div>
        </div>
        {/* <div className="flex items-center gap-2 pt-6">
          <input id="active" type="checkbox" {...register('active')} className="h-4 w-4" defaultChecked />
          <label htmlFor="active" className="text-sm">Activo (listado visible)</label>
        </div> */}
      </div>

      <div>
        <label className="block text-sm font-medium">Imagen (1 sola)</label>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={(e) => onAddFile(e.target.files)} className="mt-1 block w-full text-sm" />
        {image && (
          <div className="mt-3">
            <img src={image.previewUrl} alt="preview" className="h-40 w-full rounded-lg object-cover" />
            <div className="mt-2 flex gap-2">
              <button type="button" onClick={() => fileInputRef.current?.click()} className="rounded-md border px-3 py-1 text-sm">Reemplazar</button>
              <button type="button" onClick={removeImage} className="rounded-md bg-black px-3 py-1 text-sm text-white">Quitar</button>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <button type="submit" disabled={submitting} className="rounded-lg bg-black px-4 py-2 text-white hover:bg-gray-800 disabled:opacity-50">
          {submitting ? 'Creando…' : 'Crear producto'}
        </button>
      </div>
    </form>
  );
}
