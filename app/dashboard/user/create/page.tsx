
  'use client';

  import { useForm } from "react-hook-form";
  import * as z from "zod";
  import { zodResolver } from "@hookform/resolvers/zod";

  const userSchema = z.object({
    email: z.string().min(1, "Required"),
password: z.string().min(1, "Required"),
fullName: z.string().min(1, "Required"),
dni: z.string().min(1, "Required")
  });

  type UserFormData = z.infer<typeof userSchema>;

  export default function CreateUser() {
    const {
      register,
      handleSubmit,
      formState: { errors },
    } = useForm<UserFormData>({
      resolver: zodResolver(userSchema),
    });

    const onSubmit = async (data: UserFormData) => {
      const res = await fetch("/api/user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        alert("User created");
      }
    };

    return (
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-4 max-w-md mx-auto">

      <div>
        <label className="block">email</label>
        <input
          type="text"
          {...register("email")}
          className="border px-2 py-1 w-full"
        />
        {errors.email && <p className="text-red-500">{errors.email.message}</p>}
      </div>


      <div>
        <label className="block">password</label>
        <input
          type="text"
          {...register("password")}
          className="border px-2 py-1 w-full"
        />
        {errors.password && <p className="text-red-500">{errors.password.message}</p>}
      </div>


      <div>
        <label className="block">fullName</label>
        <input
          type="text"
          {...register("fullName")}
          className="border px-2 py-1 w-full"
        />
        {errors.fullName && <p className="text-red-500">{errors.fullName.message}</p>}
      </div>


      <div>
        <label className="block">dni</label>
        <input
          type="text"
          {...register("dni")}
          className="border px-2 py-1 w-full"
        />
        {errors.dni && <p className="text-red-500">{errors.dni.message}</p>}
      </div>

        <button type="submit" className="bg-black text-white px-4 py-2">Create</button>
      </form>
    );
  }
