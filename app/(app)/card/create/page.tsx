
  'use client';

  import { useForm } from "react-hook-form";
  import * as z from "zod";
  import { zodResolver } from "@hookform/resolvers/zod";

  const cardSchema = z.object({
    userId: z.string().min(1, "Required"),
brand: z.string().min(1, "Required"),
last4: z.string().min(1, "Required"),
expMonth: z.string().min(1, "Required"),
expYear: z.string().min(1, "Required")
  });

  type CardFormData = z.infer<typeof cardSchema>;

  export default function CreateCard() {
    const {
      register,
      handleSubmit,
      formState: { errors },
    } = useForm<CardFormData>({
      resolver: zodResolver(cardSchema),
    });

    const onSubmit = async (data: CardFormData) => {
      const res = await fetch("/api/card", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        alert("Card created");
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
        <label className="block">brand</label>
        <input
          type="text"
          {...register("brand")}
          className="border px-2 py-1 w-full"
        />
        {errors.brand && <p className="text-red-500">{errors.brand.message}</p>}
      </div>


      <div>
        <label className="block">last4</label>
        <input
          type="text"
          {...register("last4")}
          className="border px-2 py-1 w-full"
        />
        {errors.last4 && <p className="text-red-500">{errors.last4.message}</p>}
      </div>


      <div>
        <label className="block">expMonth</label>
        <input
          type="text"
          {...register("expMonth")}
          className="border px-2 py-1 w-full"
        />
        {errors.expMonth && <p className="text-red-500">{errors.expMonth.message}</p>}
      </div>


      <div>
        <label className="block">expYear</label>
        <input
          type="text"
          {...register("expYear")}
          className="border px-2 py-1 w-full"
        />
        {errors.expYear && <p className="text-red-500">{errors.expYear.message}</p>}
      </div>

        <button type="submit" className="bg-black text-white px-4 py-2">Create</button>
      </form>
    );
  }
