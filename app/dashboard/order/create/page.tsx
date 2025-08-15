
  'use client';

  import { useForm } from "react-hook-form";
  import * as z from "zod";
  import { zodResolver } from "@hookform/resolvers/zod";

  const orderSchema = z.object({
    userId: z.string().min(1, "Required"),
vendorId: z.string().min(1, "Required"),
price: z.string().min(1, "Required"),
condition: z.string().min(1, "Required"),
preferenceId: z.string().min(1, "Required")
  });

  type OrderFormData = z.infer<typeof orderSchema>;

  export default function CreateOrder() {
    const {
      register,
      handleSubmit,
      formState: { errors },
    } = useForm<OrderFormData>({
      resolver: zodResolver(orderSchema),
    });

    const onSubmit = async (data: OrderFormData) => {
      const res = await fetch("/api/order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        alert("Order created");
      }
    };

    return (
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-4 max-w-md mx-auto">

      <div>
        <label className="block">userId</label>
        <input
          type="text"
          {...register("userId")}
          className="border px-2 py-1 w-full"
        />
        {errors.userId && <p className="text-red-500">{errors.userId.message}</p>}
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
        <label className="block">price</label>
        <input
          type="text"
          {...register("price")}
          className="border px-2 py-1 w-full"
        />
        {errors.price && <p className="text-red-500">{errors.price.message}</p>}
      </div>


      <div>
        <label className="block">condition</label>
        <input
          type="text"
          {...register("condition")}
          className="border px-2 py-1 w-full"
        />
        {errors.condition && <p className="text-red-500">{errors.condition.message}</p>}
      </div>


      <div>
        <label className="block">preferenceId</label>
        <input
          type="text"
          {...register("preferenceId")}
          className="border px-2 py-1 w-full"
        />
        {errors.preferenceId && <p className="text-red-500">{errors.preferenceId.message}</p>}
      </div>

        <button type="submit" className="bg-black text-white px-4 py-2">Create</button>
      </form>
    );
  }
