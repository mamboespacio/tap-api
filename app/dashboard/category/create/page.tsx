
  'use client';

  import { useForm } from "react-hook-form";
  import * as z from "zod";
  import { zodResolver } from "@hookform/resolvers/zod";

  const categorySchema = z.object({
    name: z.string().min(1, "Required"),
slug: z.string().min(1, "Required")
  });

  type CategoryFormData = z.infer<typeof categorySchema>;

  export default function CreateCategory() {
    const {
      register,
      handleSubmit,
      formState: { errors },
    } = useForm<CategoryFormData>({
      resolver: zodResolver(categorySchema),
    });

    const onSubmit = async (data: CategoryFormData) => {
      const res = await fetch("/api/category", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        alert("Category created");
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
        <label className="block">slug</label>
        <input
          type="text"
          {...register("slug")}
          className="border px-2 py-1 w-full"
        />
        {errors.slug && <p className="text-red-500">{errors.slug.message}</p>}
      </div>

        <button type="submit" className="bg-black text-white px-4 py-2">Create</button>
      </form>
    );
  }
