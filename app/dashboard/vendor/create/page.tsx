
'use client';

import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const vendorSchema = z.object({
  name: z.string().min(1, "Required"),
  address: z.string().min(1, "Required"),
  openingHours: z.string().min(1, "Required"),
  closingHours: z.string().min(1, "Required")
});

type VendorFormData = z.infer<typeof vendorSchema>;

export default function CreateVendor() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VendorFormData>({
    resolver: zodResolver(vendorSchema),
  });

  const onSubmit = async (data: VendorFormData) => {
    const res = await fetch("/api/vendor", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      alert("Vendor created");
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
        <label className="block">address</label>
        <input
          type="text"
          {...register("address")}
          className="border px-2 py-1 w-full"
        />
        {errors.address && <p className="text-red-500">{errors.address.message}</p>}
      </div>


      <div>
        <label className="block">openingHours</label>
        <input
          type="text"
          {...register("openingHours")}
          className="border px-2 py-1 w-full"
        />
        {errors.openingHours && <p className="text-red-500">{errors.openingHours.message}</p>}
      </div>


      <div>
        <label className="block">closingHours</label>
        <input
          type="text"
          {...register("closingHours")}
          className="border px-2 py-1 w-full"
        />
        {errors.closingHours && <p className="text-red-500">{errors.closingHours.message}</p>}
      </div>

      <button type="submit" className="bg-black text-white px-4 py-2">Create</button>
    </form>
  );
}
