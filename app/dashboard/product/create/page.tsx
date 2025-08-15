
  'use client';

  import { useForm } from "react-hook-form";
  import * as z from "zod";
  import { zodResolver } from "@hookform/resolvers/zod";

  const productSchema = z.object({
    name: z.string().min(1, "Required"),
description: z.string().min(1, "Required"),
price: z.string().min(1, "Required"),
vendorId: z.string().min(1, "Required"),
categoryId: z.string().min(1, "Required")
  });

  type ProductFormData = z.infer<typeof productSchema>;

  export default function CreateProduct() {
    const {
      register,
      handleSubmit,
      formState: { errors },
    } = useForm<ProductFormData>({
      resolver: zodResolver(productSchema),
    });

    const onSubmit = async (data: ProductFormData) => {
      const res = await fetch("/api/product", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        alert("Product created");
      }
    };

    return (
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-4 max-w-md mx-auto">

      <div>
        <label className="block">name</label>
        <input
          type="text"
          {...register("name")}
          className="border px-2 py-1 w-full"
        />
        {errors.name && <p className="text-red-500">{errors.name.message}</p>}
      </div>


      <div>
        <label className="block">description</label>
        <input
          type="text"
          {...register("description")}
          className="border px-2 py-1 w-full"
        />
        {errors.description && <p className="text-red-500">{errors.description.message}</p>}
      </div>


      <div>
        <label className="block">price</label>
        <input
          type="text"
          {...register("price")}
          className="border px-2 py-1 w-full"
        />
        {errors.price && <p className="text-red-500">{errors.price.message}</p>}
      </div>


      <div>
        <label className="block">vendorId</label>
        <input
          type="text"
          {...register("vendorId")}
          className="border px-2 py-1 w-full"
        />
        {errors.vendorId && <p className="text-red-500">{errors.vendorId.message}</p>}
      </div>


      <div>
        <label className="block">categoryId</label>
        <input
          type="text"
          {...register("categoryId")}
          className="border px-2 py-1 w-full"
        />
        {errors.categoryId && <p className="text-red-500">{errors.categoryId.message}</p>}
      </div>

        <button type="submit" className="bg-black text-white px-4 py-2">Create</button>
      </form>
    );
  }
