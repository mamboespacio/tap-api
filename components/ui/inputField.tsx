export default function InputField({ label, type = "text", register, error, className, autoComplete }: { label: string; type?: string; register: any; error?: string; className?: string; autoComplete?: string }) {
  return (
    <div className={`flex flex-col ${className ?? ""}`}>
      <label className="text-sm mb-1">{label}</label>
      <input type={type} className="border rounded-lg px-3 py-2 bg-transparent" {...register} autoComplete={autoComplete} />
      {error && <span className="text-sm text-red-500 mt-1">{error}</span>}
    </div>
  );
}