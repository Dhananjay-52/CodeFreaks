function Input({ label, type = "text", placeholder }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-gray-300">
        {label}
      </label>

      <input
        type={type}
        placeholder={placeholder}
        className="w-full rounded-xl border border-[#202934] bg-[#111820] px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
      />
    </div>
  );
}

export default Input;