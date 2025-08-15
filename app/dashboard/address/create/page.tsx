
  'use client';

  import { useForm } from "react-hook-form";
  import * as z from "zod";
  import { zodResolver } from "@hookform/resolvers/zod";

  const addressSchema = z.object({
    userId: z.string().min(1, "Required"),
name: z.string().min(1, "Required"),
street: z.string().min(1, "Required"),
city: z.string().min(1, "Required"),
latitude: z.string().min(1, "Required"),
longitude: z.string().min(1, "Required"),
zipCode: z.string().min(1, "Required"),
country: z.string().min(1, "Required")
  });

  type AddressFormData = z.infer<typeof addressSchema>;

  export default function CreateAddress() {
    const {
      register,
      handleSubmit,
      formState: { errors },
    } = useForm<AddressFormData>({
      resolver: zodResolver(addressSchema),
    });

    const onSubmit = async (data: AddressFormData) => {
      const res = await fetch("/api/address", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        alert("Address created");
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
        <label className="block">name</label>
        <input
          type="text"
          {...register("name")}
          className="border px-2 py-1 w-full"
        />
        {errors.name && <p className="text-red-500">{errors.name.message}</p>}
      </div>


      <div>
        <label className="block">street</label>
        <input
          type="text"
          {...register("street")}
          className="border px-2 py-1 w-full"
        />
        {errors.street && <p className="text-red-500">{errors.street.message}</p>}
      </div>


      <div>
        <label className="block">city</label>
        <input
          type="text"
          {...register("city")}
          className="border px-2 py-1 w-full"
        />
        {errors.city && <p className="text-red-500">{errors.city.message}</p>}
      </div>


      <div>
        <label className="block">latitude</label>
        <input
          type="text"
          {...register("latitude")}
          className="border px-2 py-1 w-full"
        />
        {errors.latitude && <p className="text-red-500">{errors.latitude.message}</p>}
      </div>


      <div>
        <label className="block">longitude</label>
        <input
          type="text"
          {...register("longitude")}
          className="border px-2 py-1 w-full"
        />
        {errors.longitude && <p className="text-red-500">{errors.longitude.message}</p>}
      </div>


      <div>
        <label className="block">zipCode</label>
        <input
          type="text"
          {...register("zipCode")}
          className="border px-2 py-1 w-full"
        />
        {errors.zipCode && <p className="text-red-500">{errors.zipCode.message}</p>}
      </div>


      <div>
        <label className="block">country</label>
        <input
          type="text"
          {...register("country")}
          className="border px-2 py-1 w-full"
        />
        {errors.country && <p className="text-red-500">{errors.country.message}</p>}
      </div>

        <button type="submit" className="bg-black text-white px-4 py-2">Create</button>
      </form>
    );
  }
