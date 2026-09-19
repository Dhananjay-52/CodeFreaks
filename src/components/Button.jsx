function Button({ children, type = "button" }) {
  return (
    <button
      type={type}
      className="w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-gray-200 active:scale-[0.98]"
    >
      {children}
    </button>
  );
}

export default Button;