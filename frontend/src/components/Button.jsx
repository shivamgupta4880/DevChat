const Button = ({ children, loading, ...props }) => {
  return (
    <button
      {...props}
      className="w-full bg-blue-600 hover:bg-blue-700 transition p-3 rounded-lg text-white font-semibold flex justify-center items-center"
    >
      {loading ? (
        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;